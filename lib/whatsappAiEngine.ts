import type { AgentSettings, WAMessage } from "@/types/whatsapp-agent";
import { DEFAULT_AGENT_SETTINGS } from "@/types/whatsapp-agent";
import { sendEvolutionText } from "@/lib/evolutionSend";
import { adminDb } from "@/lib/firebaseAdmin";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "is", "are", "was", "were", "be", "been", "have", "has",
  "had", "do", "does", "did", "will", "would", "could", "should", "this", "that",
  "it", "its", "not", "no", "so", "if", "then", "than", "too", "very", "just",
  "i", "me", "my", "we", "you", "your", "he", "she", "they",
]);

function extractKeywords(text: string, max = 10): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

async function getFirebaseClient() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    setDoc,
    query,
    orderBy,
    limit,
    serverTimestamp,
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
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    setDoc,
    query,
    orderBy,
    limit,
    serverTimestamp,
  };
}

async function loadAgentSettings(): Promise<AgentSettings> {
  if (adminDb) {
    const snap = await adminDb.doc("wa_agent_settings/global").get();
    if (snap.exists) return { ...DEFAULT_AGENT_SETTINGS, ...snap.data() } as AgentSettings;
    return { ...DEFAULT_AGENT_SETTINGS };
  }
  const fb = await getFirebaseClient();
  const snap = await fb.getDoc(fb.doc(fb.db, "wa_agent_settings", "global"));
  if (snap.exists()) return { ...DEFAULT_AGENT_SETTINGS, ...snap.data() } as AgentSettings;
  return { ...DEFAULT_AGENT_SETTINGS };
}

async function getConversationMode(phone: string): Promise<"ai" | "human"> {
  if (adminDb) {
    const snap = await adminDb.doc(`wa_conversations/${phone}`).get();
    if (snap.exists) return (snap.data()?.mode as "ai" | "human") || "ai";
    return "ai";
  }
  const fb = await getFirebaseClient();
  const snap = await fb.getDoc(fb.doc(fb.db, "wa_conversations", phone));
  if (snap.exists()) return (snap.data()?.mode as "ai" | "human") || "ai";
  return "ai";
}

async function searchKnowledgeBase(queryText: string): Promise<string> {
  try {
    if (adminDb) {
      const docsSnap = await adminDb.collection("wa_kb_documents").get();
      const queryKeywords = extractKeywords(queryText);
      const queryLower = queryText.toLowerCase();
      const scored: { content: string; score: number; source: string }[] = [];

      for (const docSnap of docsSnap.docs) {
        const docData = docSnap.data();
        if (docData.status !== "ready") continue;
        const chunksSnap = await adminDb
          .collection(`wa_kb_documents/${docSnap.id}/chunks`)
          .get();
        for (const chunkDoc of chunksSnap.docs) {
          const chunk = chunkDoc.data();
          let score = 0;
          for (const kw of (chunk.keywords as string[]) || []) {
            if (queryKeywords.includes(kw)) score += 2;
          }
          const chunkLower = String(chunk.content || "").toLowerCase();
          for (const kw of queryKeywords) {
            if (chunkLower.includes(kw)) score += 1;
          }
          if (chunkLower.includes(queryLower.slice(0, 40))) score += 5;
          if (score > 0) {
            scored.push({
              content: String(chunk.content || ""),
              score,
              source: String(docData.title || "Knowledge Base"),
            });
          }
        }
      }
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, 3);
      if (!top.length) return "";
      return top.map((c) => `[KB Source: ${c.source}]\n${c.content}`).join("\n\n---\n\n");
    }
  } catch (err) {
    console.warn("[AI] KB search (admin) warning:", err);
  }
  return "";
}

async function storeCustomerMessage(phone: string, name: string, text: string): Promise<void> {
  const msg: Omit<WAMessage, "id"> = {
    sender: "customer",
    type: "text",
    content: text,
    status: "delivered",
    timestamp: new Date(),
  };

  if (adminDb) {
    const convRef = adminDb.doc(`wa_conversations/${phone}`);
    const convSnap = await convRef.get();
    if (!convSnap.exists) {
      await convRef.set({
        phone,
        name,
        mode: "ai",
        lastMessage: text.slice(0, 100),
        lastMessageSender: "customer",
        lastActivityAt: new Date(),
        unreadCount: 1,
        windowOpen: true,
        customerLastMessageAt: new Date(),
        resolved: false,
        createdAt: new Date(),
      });
    } else {
      await convRef.update({
        name,
        lastMessage: text.slice(0, 100),
        lastMessageSender: "customer",
        lastActivityAt: new Date(),
        unreadCount: (convSnap.data()?.unreadCount || 0) + 1,
        customerLastMessageAt: new Date(),
        windowOpen: true,
      });
    }
    await convRef.collection("messages").add({
      ...msg,
      timestamp: new Date(),
    });
    return;
  }

  const fb = await getFirebaseClient();
  const convRef = fb.doc(fb.db, "wa_conversations", phone);
  const existing = await fb.getDoc(convRef);
  if (!existing.exists()) {
    await fb.setDoc(convRef, {
      phone,
      name,
      mode: "ai",
      lastMessage: text.slice(0, 100),
      lastMessageSender: "customer",
      lastActivityAt: fb.serverTimestamp(),
      unreadCount: 1,
      windowOpen: true,
      customerLastMessageAt: fb.serverTimestamp(),
      resolved: false,
      createdAt: fb.serverTimestamp(),
    });
  } else {
    await fb.updateDoc(convRef, {
      name,
      lastMessage: text.slice(0, 100),
      lastMessageSender: "customer",
      lastActivityAt: fb.serverTimestamp(),
      unreadCount: (existing.data()?.unreadCount || 0) + 1,
      customerLastMessageAt: fb.serverTimestamp(),
      windowOpen: true,
    });
  }
  await fb.addDoc(fb.collection(fb.db, "wa_conversations", phone, "messages"), {
    ...msg,
    timestamp: fb.serverTimestamp(),
  });
}

async function storeAiMessage(
  phone: string,
  text: string,
  meta: { model: string; tokensUsed: number; ragUsed: boolean; waMessageId?: string; sent: boolean }
): Promise<void> {
  const msg: Omit<WAMessage, "id"> = {
    sender: "ai",
    type: "text",
    content: text,
    waMessageId: meta.waMessageId,
    status: meta.sent ? "sent" : "failed",
    timestamp: new Date(),
    aiModel: meta.model,
    aiTokensUsed: meta.tokensUsed,
    ragContextUsed: meta.ragUsed,
  };

  if (adminDb) {
    await adminDb.doc(`wa_conversations/${phone}`).collection("messages").add({
      ...msg,
      timestamp: new Date(),
    });
    await adminDb.doc(`wa_conversations/${phone}`).update({
      lastMessage: text.slice(0, 100),
      lastMessageSender: "ai",
      lastActivityAt: new Date(),
      unreadCount: 0,
    });
    return;
  }

  const fb = await getFirebaseClient();
  await fb.addDoc(fb.collection(fb.db, "wa_conversations", phone, "messages"), {
    ...msg,
    timestamp: fb.serverTimestamp(),
  });
  await fb.updateDoc(fb.doc(fb.db, "wa_conversations", phone), {
    lastMessage: text.slice(0, 100),
    lastMessageSender: "ai",
    lastActivityAt: fb.serverTimestamp(),
    unreadCount: 0,
  });
}

export interface AiReplyResult {
  replied: boolean;
  replyText?: string;
  reason?: string;
  sentViaApi?: boolean;
}

export async function runAiAutoReply(
  phone: string,
  customerMessage: string,
  pushName: string
): Promise<AiReplyResult> {
  const settings = await loadAgentSettings();

  if (!settings.aiEnabled) {
    console.log("[AI] Skipped — aiEnabled=false in wa_agent_settings");
    return { replied: false, reason: "ai_disabled" };
  }

  const mode = await getConversationMode(phone);
  if (mode === "human") {
    console.log(`[AI] Skipped — conversation ${phone} is in human mode`);
    return { replied: false, reason: "human_mode" };
  }

  console.log(`[AI Generating] for ${phone}...`);

  const kbContext = await searchKnowledgeBase(customerMessage);

  let fullPrompt = settings.systemPrompt + "\n\n";
  if (kbContext) {
    fullPrompt += "=== RELEVANT KNOWLEDGE BASE INFORMATION ===\n" + kbContext + "\n=== END ===\n\n";
  }
  fullPrompt += `Customer's latest message: "${customerMessage}"\n\n`;
  fullPrompt += "Respond as the support agent. Be concise, helpful, and professional. Use WhatsApp formatting.";

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[AI] Error — GEMINI_API_KEY not configured");
    return { replied: false, reason: "no_gemini_key" };
  }

  const model = settings.geminiModel || "gemini-2.5-flash";
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const geminiRes = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: settings.temperature || 0.7,
        maxOutputTokens: settings.maxTokens || 800,
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error("[AI] Error — Gemini API:", errText.slice(0, 300));
    return { replied: false, reason: "gemini_error" };
  }

  const geminiData = await geminiRes.json();
  const aiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0;

  if (!aiReply.trim()) {
    console.error("[AI] Error — empty Gemini response");
    return { replied: false, reason: "empty_ai_response" };
  }

  const sendResult = await sendEvolutionText(phone, aiReply, "[AI]");
  let sentViaApi = sendResult.ok;

  if (!sentViaApi) {
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
    if (PHONE_NUMBER_ID && ACCESS_TOKEN) {
      try {
        const metaRes = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
          method: "POST",
          headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: { preview_url: true, body: aiReply },
          }),
        });
        sentViaApi = metaRes.ok;
        if (!metaRes.ok) console.error("[AI] Meta fallback failed:", await metaRes.text());
      } catch (e) {
        console.error("[AI] Meta fallback exception:", e);
      }
    }
  }

  await storeAiMessage(phone, aiReply, {
    model,
    tokensUsed,
    ragUsed: !!kbContext,
    waMessageId: sendResult.messageId,
    sent: sentViaApi,
  });

  console.log(`[Reply Sent] AI → ${phone} (api=${sentViaApi})`);
  return { replied: true, replyText: aiReply, sentViaApi };
}

export { storeCustomerMessage, loadAgentSettings };
