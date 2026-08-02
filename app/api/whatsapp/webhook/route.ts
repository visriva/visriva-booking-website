import { NextResponse } from "next/server";
import type {
  WAMessage,
  MessageType,
  AIReplyPayload,
} from "@/types/whatsapp-agent";

// ─── Firebase Admin-style server access (using REST for server routes) ───────

const FIRESTORE_PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "visriva-live-station";

async function firestoreREST(method: string, path: string, body?: any) {
  // We use the client SDK pattern via dynamic import for server routes
  // This avoids issues with Firebase Admin in Edge/Serverless
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    query,
    orderBy,
    limit,
    serverTimestamp,
    increment,
  } = await import("firebase/firestore");

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: FIRESTORE_PROJECT,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return { db: getFirestore(app), doc, getDoc, getDocs, setDoc, addDoc, updateDoc, collection, query, orderBy, limit, serverTimestamp, increment };
}

// ─── GET: Meta Webhook Verification Endpoint ──────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const VERIFY_TOKEN =
      process.env.WHATSAPP_VERIFY_TOKEN || "visriva_whatsapp_verify_token_2026";

    // Meta Webhook verification protocol
    if (mode === "subscribe" && (token === VERIFY_TOKEN || token === "visriva_whatsapp_verify_token_2026")) {
      console.log("✅ Meta WhatsApp Webhook Verified Successfully!");
      return new Response(challenge || "OK", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Fallback: If Meta sends request with challenge parameter
    if (challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new Response("Forbidden", { status: 403 });
  } catch (error: any) {
    console.error("Meta Webhook Verification Error:", error);
    return new Response("Internal Error", { status: 500 });
  }
}

// ─── Helper: Download media from Meta ─────────────────────────────────────────

async function downloadMetaMedia(mediaId: string): Promise<{ url: string; mimeType: string } | null> {
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  if (!ACCESS_TOKEN || !mediaId) return null;

  try {
    // Step 1: Get media URL from Meta
    const metaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });

    if (!metaRes.ok) return null;

    const metaData = await metaRes.json();
    return {
      url: metaData.url || "",
      mimeType: metaData.mime_type || "application/octet-stream",
    };
  } catch (err) {
    console.error("Media download error:", err);
    return null;
  }
}

// ─── Helper: Send read receipt to Meta ────────────────────────────────────────

async function sendReadReceipt(messageId: string) {
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID || !messageId) return;

  try {
    await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
  } catch (err) {
    console.error("Read receipt error:", err);
  }
}

async function sendMetaAlert(text: string) {
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "1203212472878765";
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) return;

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: "918884484828",
        type: "text",
        text: { body: text },
      }),
    });
    console.log("Meta Alert Sent status:", res.status);
  } catch (err) {
    console.error("Meta Alert Send error:", err);
  }
}

// ─── Helper: Trigger AI reply ─────────────────────────────────────────────────

async function triggerAIReply(payload: AIReplyPayload, origin: string) {
  try {
    const res = await fetch(`${origin}/api/ai-agent/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("AI reply trigger failed:", await res.text());
    }
  } catch (err) {
    console.error("AI reply trigger error:", err);
  }
}

// ─── POST: Meta Webhook Incoming Message & Event Handler ──────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ─── EVOLUTION API PAYLOAD HANDLER ───────────────────────────────────────
    if (body.event) {
      const firebase = await firestoreREST("", "");

      // 1. Handle Connection State Changes
      if (body.event === "connection.update") {
        const state = body.data?.state || body.data?.status;
        console.log(`🔌 Evolution Connection State changed for instance ${body.instance}:`, state);
        if (state === "close" || state === "disconnected" || state === "logout") {
          await sendMetaAlert(`⚠️ *Visriva WhatsApp Bot Alert:* Your connected WhatsApp session (*${body.instance || "visriva-live"}*) has been disconnected! Please scan the QR code in the Admin Panel immediately to re-link your device.`);
        }
        return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
      }

      // 2. Handle Incoming Customer Messages
      if (body.event === "messages.upsert") {
        const fromMe = body.data?.key?.fromMe;
        if (fromMe) {
          return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
        }

        const remoteJid = body.data?.key?.remoteJid;
        const from = remoteJid ? remoteJid.split("@")[0] : "";
        if (!from) {
          return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
        }

        const messageId = body.data?.key?.id;
        const senderName = body.data?.pushName || "Customer";
        
        let content = "";
        let msgType: MessageType = "text";

        const messageContent = body.data?.message;
        if (messageContent) {
          if (messageContent.conversation) {
            content = messageContent.conversation;
          } else if (messageContent.extendedTextMessage?.text) {
            content = messageContent.extendedTextMessage.text;
          } else if (messageContent.imageMessage) {
            msgType = "image";
            content = messageContent.imageMessage.caption || "📷 Image";
          }
        }

        if (!content) {
          return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
        }

        const convRef = firebase.doc(firebase.db, "wa_conversations", from);
        const convSnap = await firebase.getDoc(convRef);

        if (convSnap.exists()) {
          await firebase.updateDoc(convRef, {
            lastMessage: content.slice(0, 100),
            lastMessageSender: "customer",
            lastActivityAt: firebase.serverTimestamp(),
            customerLastMessageAt: firebase.serverTimestamp(),
            unreadCount: firebase.increment(1),
            windowOpen: true,
            resolved: false,
          });
        } else {
          let defaultMode = "ai";
          try {
            const settingsRef = firebase.doc(firebase.db, "wa_agent_settings", "global");
            const settingsSnap = await firebase.getDoc(settingsRef);
            if (settingsSnap.exists()) {
              defaultMode = settingsSnap.data()?.defaultMode || "ai";
            }
          } catch (e) {}

          await firebase.setDoc(convRef, {
            phone: from,
            name: senderName,
            mode: defaultMode,
            lastMessage: content.slice(0, 100),
            lastMessageSender: "customer",
            lastActivityAt: firebase.serverTimestamp(),
            customerLastMessageAt: firebase.serverTimestamp(),
            unreadCount: 1,
            windowOpen: true,
            resolved: false,
            createdAt: firebase.serverTimestamp(),
          });
        }

        const msgColRef = firebase.collection(firebase.db, "wa_conversations", from, "messages");
        const waMessage: Omit<WAMessage, "id"> = {
          sender: "customer",
          type: msgType,
          content,
          waMessageId: messageId,
          status: "delivered",
          timestamp: firebase.serverTimestamp(),
        };
        await firebase.addDoc(msgColRef, waMessage);

        const updatedConvSnap = await firebase.getDoc(convRef);
        const convData = updatedConvSnap.data();
        const isAIMode = convData?.mode === "ai";

        let aiEnabled = true;
        try {
          const settingsRef = firebase.doc(firebase.db, "wa_agent_settings", "global");
          const settingsSnap = await firebase.getDoc(settingsRef);
          if (settingsSnap.exists()) {
            aiEnabled = settingsSnap.data()?.aiEnabled !== false;
          }
        } catch (e) {}

        if (isAIMode && aiEnabled) {
          const url = new URL(req.url);
          const origin = url.origin;
          triggerAIReply({
            phone: from,
            customerMessage: content,
            messageType: msgType,
          }, origin);
        }
      }

      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    }

    // Check if this is a WhatsApp Business Account notification (Meta Cloud API fallback)
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Not a whatsapp_business_account event" }, { status: 404 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;

    if (!changes) {
      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    }

    const contacts = changes.contacts;
    const messages = changes.messages;
    const statuses = changes.statuses;

    // ── 1. Handle Incoming Customer Messages ──────────────────────────────────
    if (messages && messages.length > 0) {
      const firebase = await firestoreREST("", "");

      for (const message of messages) {
        const from = message.from; // Sender phone number
        const messageId = message.id;
        const senderName = contacts?.[0]?.profile?.name || "Customer";

        // Determine message type and content
        let msgType: MessageType = "text";
        let content = "";
        let mediaUrl = "";
        let mediaMimeType = "";
        let mediaFilename = "";

        switch (message.type) {
          case "text":
            msgType = "text";
            content = message.text?.body || "";
            break;

          case "image":
            msgType = "image";
            content = message.image?.caption || "📷 Image";
            if (message.image?.id) {
              const media = await downloadMetaMedia(message.image.id);
              if (media) {
                mediaUrl = media.url;
                mediaMimeType = media.mimeType;
              }
            }
            break;

          case "document":
            msgType = "document";
            mediaFilename = message.document?.filename || "Document";
            content = `📄 ${mediaFilename}`;
            if (message.document?.id) {
              const media = await downloadMetaMedia(message.document.id);
              if (media) {
                mediaUrl = media.url;
                mediaMimeType = media.mimeType;
              }
            }
            break;

          case "audio":
            msgType = "audio";
            content = "🎵 Audio message";
            if (message.audio?.id) {
              const media = await downloadMetaMedia(message.audio.id);
              if (media) {
                mediaUrl = media.url;
                mediaMimeType = media.mimeType;
              }
            }
            break;

          case "video":
            msgType = "video";
            content = message.video?.caption || "🎥 Video";
            if (message.video?.id) {
              const media = await downloadMetaMedia(message.video.id);
              if (media) {
                mediaUrl = media.url;
                mediaMimeType = media.mimeType;
              }
            }
            break;

          case "sticker":
            msgType = "sticker";
            content = "🏷️ Sticker";
            break;

          case "location":
            msgType = "location";
            content = `📍 Location: ${message.location?.latitude}, ${message.location?.longitude}`;
            break;

          case "contacts":
            msgType = "contact";
            content = `👤 Contact shared`;
            break;

          default:
            content = message.text?.body || `[${message.type || "unknown"} message]`;
        }

        console.log(`💬 Incoming WhatsApp message from ${senderName} (${from}): "${content}"`);

        // ── Store message in Firestore ──────────────────────────────────────
        const waMessage: Omit<WAMessage, "id"> = {
          sender: "customer",
          type: msgType,
          content,
          mediaUrl: mediaUrl || undefined,
          mediaMimeType: mediaMimeType || undefined,
          mediaFilename: mediaFilename || undefined,
          waMessageId: messageId,
          status: "delivered",
          timestamp: firebase.serverTimestamp(),
        };

        // Add message to subcollection
        const msgColRef = firebase.collection(firebase.db, "wa_conversations", from, "messages");
        await firebase.addDoc(msgColRef, waMessage);

        // ── Create or update conversation ───────────────────────────────────
        const convRef = firebase.doc(firebase.db, "wa_conversations", from);
        const convSnap = await firebase.getDoc(convRef);

        if (convSnap.exists()) {
          await firebase.updateDoc(convRef, {
            name: senderName,
            lastMessage: content.slice(0, 100),
            lastMessageSender: "customer",
            lastActivityAt: firebase.serverTimestamp(),
            customerLastMessageAt: firebase.serverTimestamp(),
            unreadCount: firebase.increment(1),
            windowOpen: true,
          });
        } else {
          // Check global default mode
          let defaultMode = "ai";
          try {
            const settingsRef = firebase.doc(firebase.db, "wa_agent_settings", "global");
            const settingsSnap = await firebase.getDoc(settingsRef);
            if (settingsSnap.exists()) {
              defaultMode = settingsSnap.data()?.defaultMode || "ai";
            }
          } catch (e) {}

          await firebase.setDoc(convRef, {
            phone: from,
            name: senderName,
            mode: defaultMode,
            lastMessage: content.slice(0, 100),
            lastMessageSender: "customer",
            lastActivityAt: firebase.serverTimestamp(),
            customerLastMessageAt: firebase.serverTimestamp(),
            unreadCount: 1,
            windowOpen: true,
            resolved: false,
            createdAt: firebase.serverTimestamp(),
          });
        }

        // ── Send read receipt ───────────────────────────────────────────────
        sendReadReceipt(messageId);

        // ── Check if AI mode → trigger AI reply ────────────────────────────
        const updatedConvSnap = await firebase.getDoc(convRef);
        const convData = updatedConvSnap.data();
        const isAIMode = convData?.mode === "ai";

        // Check global AI enabled
        let aiEnabled = true;
        try {
          const settingsRef = firebase.doc(firebase.db, "wa_agent_settings", "global");
          const settingsSnap = await firebase.getDoc(settingsRef);
          if (settingsSnap.exists()) {
            aiEnabled = settingsSnap.data()?.aiEnabled !== false;
          }
        } catch (e) {}

        if (isAIMode && aiEnabled) {
          // Get the origin URL for internal API call
          const url = new URL(req.url);
          const origin = url.origin;

          // Fire and forget — don't block webhook response
          triggerAIReply({
            phone: from,
            customerMessage: content,
            messageType: msgType,
            mediaUrl: mediaUrl || undefined,
            mediaMimeType: mediaMimeType || undefined,
          }, origin);
        }
      }
    }

    // ── 2. Handle Message Status Updates ──────────────────────────────────────
    if (statuses && statuses.length > 0) {
      const firebase = await firestoreREST("", "");

      for (const statusObj of statuses) {
        const recipientId = statusObj.recipient_id;
        const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
        const waMessageId = statusObj.id;

        console.log(`📬 WhatsApp delivery status: ${recipientId} → [${status.toUpperCase()}]`);

        // Update message status in Firestore if we can find it
        if (recipientId && waMessageId) {
          try {
            const { query: q, where } = await import("firebase/firestore");
            const msgsRef = firebase.collection(firebase.db, "wa_conversations", recipientId, "messages");
            const msgQuery = q(msgsRef, firebase.orderBy("timestamp", "desc"), firebase.limit(10));
            const msgSnap = await firebase.getDocs(msgQuery);

            for (const msgDoc of msgSnap.docs) {
              if (msgDoc.data().waMessageId === waMessageId) {
                await firebase.updateDoc(msgDoc.ref, { status });
                break;
              }
            }
          } catch (e) {
            // Non-critical — log and continue
            console.warn("Status update warning:", e);
          }
        }
      }
    }

    // Always return 200 OK to Meta to confirm receipt
    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error: any) {
    console.error("Meta Webhook Event Processing Error:", error);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  }
}
