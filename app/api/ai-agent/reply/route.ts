import { NextResponse } from "next/server";
import type { WAMessage, AgentSettings } from "@/types/whatsapp-agent";
import { DEFAULT_AGENT_SETTINGS } from "@/types/whatsapp-agent";

// ─── Firebase helpers (server-side) ──────────────────────────────────────────

async function getFirebase() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const {
    getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc,
    query, orderBy, limit, serverTimestamp,
  } = await import("firebase/firestore");

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "visriva-live-station",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return {
    db: getFirestore(app),
    collection, doc, getDoc, getDocs, addDoc, updateDoc,
    query, orderBy, limit, serverTimestamp,
  };
}

async function getEvolutionConfig() {
  try {
    const fb = await getFirebase();
    const docRef = fb.doc(fb.db, "config", "operator");
    const snap = await fb.getDoc(docRef);
    
    if (snap.exists()) {
      const data = snap.data();
      let url = data.backupEvoApiUrl || process.env.EVOLUTION_API_URL || "https://api.visriva.com";
      const key = data.backupEvoApiKey || process.env.EVOLUTION_API_KEY || "VisrivaSecretKey2026_SecureKey";
      const instance = data.backupInstanceName || process.env.EVOLUTION_INSTANCE_NAME || "visriva-live";
      
      // Prepend https:// if protocol is missing
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      // Strip trailing slash
      if (url.endsWith("/")) {
        url = url.slice(0, -1);
      }
      return { url, key, instance };
    }
  } catch (err) {
    console.warn("Failed to load Evolution config from Firestore, falling back to env:", err);
  }
  
  let url = process.env.EVOLUTION_API_URL || "https://api.visriva.com";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return {
    url,
    key: process.env.EVOLUTION_API_KEY || "VisrivaSecretKey2026_SecureKey",
    instance: process.env.EVOLUTION_INSTANCE_NAME || "visriva-live",
  };
}

async function checkEvolutionConnected(config: { url: string; key: string; instance: string }) {
  try {
    const res = await fetch(`${config.url}/instance/connectionStatus/${config.instance}`, {
      headers: { apikey: config.key }
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.instance?.state === "open";
  } catch (e) {
    return false;
  }
}

// ─── RAG Search (inline for server route) ────────────────────────────────────

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "is", "are", "was", "were", "be", "been", "have", "has",
  "had", "do", "does", "did", "will", "would", "could", "should", "this", "that",
  "it", "its", "not", "no", "so", "if", "then", "than", "too", "very", "just",
  "i", "me", "my", "we", "you", "your", "he", "she", "they",
]);

function extractKeywords(text: string, max: number = 10): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, max).map(([w]) => w);
}

async function searchKnowledgeBase(queryText: string, firebase: any): Promise<string> {
  try {
    const docsSnap = await firebase.getDocs(firebase.collection(firebase.db, "wa_kb_documents"));
    const queryKeywords = extractKeywords(queryText);
    const queryLower = queryText.toLowerCase();

    interface ScoredChunk { content: string; score: number; source: string }
    const scored: ScoredChunk[] = [];

    for (const docSnap of docsSnap.docs) {
      const docData = docSnap.data();
      if (docData.status !== "ready") continue;

      const chunksSnap = await firebase.getDocs(
        firebase.collection(firebase.db, "wa_kb_documents", docSnap.id, "chunks")
      );

      for (const chunkDoc of chunksSnap.docs) {
        const chunk = chunkDoc.data();
        let score = 0;

        // Keyword overlap
        const chunkKeywords: string[] = chunk.keywords || [];
        for (const kw of chunkKeywords) {
          if (queryKeywords.includes(kw)) score += 2;
        }

        // Direct word match
        const chunkLower = (chunk.content || "").toLowerCase();
        for (const kw of queryKeywords) {
          if (chunkLower.includes(kw)) score += 1;
        }

        // Exact phrase match
        if (chunkLower.includes(queryLower.slice(0, 40))) {
          score += 5;
        }

        if (score > 0) {
          scored.push({
            content: chunk.content,
            score,
            source: docData.title || "Knowledge Base",
          });
        }
      }
    }

    // Sort and take top 3
    scored.sort((a, b) => b.score - a.score);
    const topChunks = scored.slice(0, 3);

    if (topChunks.length === 0) return "";

    return topChunks
      .map((c, i) => `[KB Source: ${c.source}]\n${c.content}`)
      .join("\n\n---\n\n");
  } catch (err) {
    console.error("KB search error:", err);
    return "";
  }
}

// ─── POST: AI Reply Engine ───────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { phone, customerMessage, messageType, mediaUrl, mediaMimeType } = await req.json();

    if (!phone || !customerMessage) {
      return NextResponse.json({ error: "phone and customerMessage required" }, { status: 400 });
    }

    const firebase = await getFirebase();

    // ── 1. Load settings ─────────────────────────────────────────────────────
    let settings: AgentSettings = { ...DEFAULT_AGENT_SETTINGS };
    try {
      const settingsRef = firebase.doc(firebase.db, "wa_agent_settings", "global");
      const settingsSnap = await firebase.getDoc(settingsRef);
      if (settingsSnap.exists()) {
        settings = { ...DEFAULT_AGENT_SETTINGS, ...settingsSnap.data() } as AgentSettings;
      }
    } catch (e) {}

    // ── 2. Get conversation history ──────────────────────────────────────────
    let historyContext = "";
    try {
      const msgsQuery = firebase.query(
        firebase.collection(firebase.db, "wa_conversations", phone, "messages"),
        firebase.orderBy("timestamp", "desc"),
        firebase.limit(20)
      );
      const msgsSnap = await firebase.getDocs(msgsQuery);
      const messages: { role: string; text: string }[] = [];

      msgsSnap.docs.reverse().forEach((msgDoc: any) => {
        const msg = msgDoc.data();
        const role = msg.sender === "customer" ? "Customer" : "Agent";
        messages.push({ role, text: msg.content || "" });
      });

      if (messages.length > 0) {
        historyContext = "Recent conversation history:\n" +
          messages.map((m) => `${m.role}: ${m.text}`).join("\n");
      }
    } catch (e) {
      console.warn("History fetch warning:", e);
    }

    // ── 3. RAG — Search knowledge base ───────────────────────────────────────
    const kbContext = await searchKnowledgeBase(customerMessage, firebase);

    // ── 4. Build Gemini prompt ───────────────────────────────────────────────
    const parts: any[] = [];

    // System prompt
    let fullPrompt = settings.systemPrompt + "\n\n";

    // Add KB context if found
    if (kbContext) {
      fullPrompt += "=== RELEVANT KNOWLEDGE BASE INFORMATION ===\n";
      fullPrompt += "Use the following information to answer the customer's question accurately:\n\n";
      fullPrompt += kbContext + "\n\n";
      fullPrompt += "=== END KNOWLEDGE BASE ===\n\n";
    }

    // Add conversation history
    if (historyContext) {
      fullPrompt += historyContext + "\n\n";
    }

    // Add current message
    fullPrompt += `Customer's latest message: "${customerMessage}"\n\n`;
    fullPrompt += "Respond as the support agent. Be concise, helpful, and professional. Use WhatsApp formatting.";

    parts.push({ text: fullPrompt });

    // ── 5. Handle image input (multimodal) ───────────────────────────────────
    if (messageType === "image" && mediaUrl) {
      try {
        const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
        if (ACCESS_TOKEN) {
          const imgRes = await fetch(mediaUrl, {
            headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
          });
          if (imgRes.ok) {
            const imgBuffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(imgBuffer).toString("base64");
            parts.push({
              inlineData: {
                mimeType: mediaMimeType || "image/jpeg",
                data: base64,
              },
            });
          }
        }
      } catch (imgErr) {
        console.warn("Image processing warning:", imgErr);
      }
    }

    // ── 6. Call Gemini API ────────────────────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const model = settings.geminiModel || "gemini-2.5-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: settings.temperature || 0.7,
          maxOutputTokens: settings.maxTokens || 800,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json({ error: "Gemini API error", details: errText }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    const aiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0;

    if (!aiReply) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 500 });
    }

    // ── 7. Send reply via Evolution API (if connected) or Meta Cloud API ────
    const evoConfig = await getEvolutionConfig();
    const isEvoConnected = await checkEvolutionConnected(evoConfig);

    let sentViaApi = false;
    let waMessageId = "";

    if (isEvoConnected) {
      try {
        console.log(`🔌 Outgoing reply: Routing via active Evolution instance [${evoConfig.instance}] to ${phone}`);
        const evoSendRes = await fetch(
          `${evoConfig.url}/message/sendText/${evoConfig.instance}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: evoConfig.key,
            },
            body: JSON.stringify({
              number: phone,
              options: {
                delay: 1000,
                presence: "composing",
                linkPreview: true,
              },
              textMessage: {
                text: aiReply,
              },
            }),
          }
        );

        if (evoSendRes.ok) {
          const evoSendData = await evoSendRes.ok ? await evoSendRes.json() : {};
          waMessageId = evoSendData.key?.id || "";
          sentViaApi = true;
        } else {
          console.error("Evolution send failed, falling back to Meta Cloud API...");
        }
      } catch (evoSendErr) {
        console.error("Evolution send exception, falling back to Meta...", evoSendErr);
      }
    }

    if (!sentViaApi) {
      const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

      if (PHONE_NUMBER_ID && ACCESS_TOKEN) {
        try {
          const sendRes = await fetch(
            `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: phone,
                type: "text",
                text: {
                  preview_url: true,
                  body: aiReply,
                },
              }),
            }
          );

          if (sendRes.ok) {
            const sendData = await sendRes.json();
            waMessageId = sendData.messages?.[0]?.id || "";
            sentViaApi = true;
          } else {
            const errText = await sendRes.text();
            console.error("Meta send error:", errText);
          }
        } catch (sendErr) {
          console.error("Meta send exception:", sendErr);
        }
      }
    }

    // ── 8. Store AI response in Firestore ────────────────────────────────────
    try {
      const aiMessage: Omit<WAMessage, "id"> = {
        sender: "ai",
        type: "text",
        content: aiReply,
        waMessageId: waMessageId || undefined,
        status: sentViaApi ? "sent" : "failed",
        timestamp: firebase.serverTimestamp(),
        aiModel: model,
        aiTokensUsed: tokensUsed,
        ragContextUsed: !!kbContext,
      };

      const msgColRef = firebase.collection(firebase.db, "wa_conversations", phone, "messages");
      await firebase.addDoc(msgColRef, aiMessage);

      // Update conversation
      const convRef = firebase.doc(firebase.db, "wa_conversations", phone);
      await firebase.updateDoc(convRef, {
        lastMessage: aiReply.slice(0, 100),
        lastMessageSender: "ai",
        lastActivityAt: firebase.serverTimestamp(),
      });
    } catch (storeErr) {
      console.error("Store AI message error:", storeErr);
    }

    return NextResponse.json({
      success: true,
      reply: aiReply,
      sentViaApi,
      waMessageId,
      tokensUsed,
      ragContextUsed: !!kbContext,
    });
  } catch (error: any) {
    console.error("AI Reply Engine Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
