import { NextResponse } from "next/server";
import type { WAMessage } from "@/types/whatsapp-agent";

async function getFirebase() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const {
    getFirestore, collection, doc, getDoc, addDoc, updateDoc, serverTimestamp,
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
  return { db: getFirestore(app), collection, doc, getDoc, addDoc, updateDoc, serverTimestamp };
}

// ─── POST: Send message from dashboard ───────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { phone, message, type = "text" } = await req.json();

    if (!phone || !message) {
      return NextResponse.json({ error: "phone and message required" }, { status: 400 });
    }

    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

    let sentViaApi = false;
    let waMessageId = "";
    let errorDetails = "";

    // ── Send via Meta Cloud API ──────────────────────────────────────────────
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
                body: message,
              },
            }),
          }
        );

        if (sendRes.ok) {
          const sendData = await sendRes.json();
          waMessageId = sendData.messages?.[0]?.id || "";
          sentViaApi = true;
        } else {
          errorDetails = await sendRes.text();
          console.error("Meta send error:", errorDetails);

          // Check if 24-hour window expired
          const isWindowExpired =
            errorDetails.includes("131047") ||
            errorDetails.toLowerCase().includes("window") ||
            errorDetails.toLowerCase().includes("24 hour");

          if (isWindowExpired) {
            return NextResponse.json({
              success: false,
              error: "24-hour customer service window has expired. Only template messages can be sent.",
              isWindowExpired: true,
            }, { status: 200 });
          }
        }
      } catch (sendErr: any) {
        console.error("Meta send exception:", sendErr);
        errorDetails = sendErr.message;
      }
    }

    // ── Store sent message in Firestore ───────────────────────────────────────
    const fb = await getFirebase();

    const agentMessage: Omit<WAMessage, "id"> = {
      sender: "agent",
      type: "text",
      content: message,
      waMessageId: waMessageId || undefined,
      status: sentViaApi ? "sent" : "failed",
      timestamp: fb.serverTimestamp(),
    };

    const msgColRef = fb.collection(fb.db, "wa_conversations", phone, "messages");
    await fb.addDoc(msgColRef, agentMessage);

    // Update conversation
    const convRef = fb.doc(fb.db, "wa_conversations", phone);
    const convSnap = await fb.getDoc(convRef);

    if (convSnap.exists()) {
      await fb.updateDoc(convRef, {
        lastMessage: message.slice(0, 100),
        lastMessageSender: "agent",
        lastActivityAt: fb.serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: sentViaApi,
      waMessageId,
      error: sentViaApi ? undefined : errorDetails || "Failed to send via Meta API",
    });
  } catch (error: any) {
    console.error("Send Message Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
