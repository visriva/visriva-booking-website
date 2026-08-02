import { NextResponse } from "next/server";

// Ignore SSL certificate checks for self-hosted Evolution VPS servers
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function getFirebase() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const { getFirestore, doc, getDoc, setDoc } = await import("firebase/firestore");

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "visriva-live-station",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return { db: getFirestore(app), doc, getDoc, setDoc };
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
      if (url.endsWith("/")) url = url.slice(0, -1);
      return { url, key, instance };
    }
  } catch (e) {
    console.error("Failed to load Evolution config:", e);
  }
  return {
    url: process.env.EVOLUTION_API_URL || "https://api.visriva.com",
    key: process.env.EVOLUTION_API_KEY || "VisrivaSecretKey2026_SecureKey",
    instance: process.env.EVOLUTION_INSTANCE_NAME || "visriva-live"
  };
}

// ─── POST: Auto-Responder Event Handler ──────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verify webhook message upsert event
    if (body.event !== "messages.upsert") {
      return NextResponse.json({ status: "IGNORED_EVENT" });
    }

    const messageData = body.data;
    const fromMe = messageData?.key?.fromMe;
    const remoteJid = messageData?.key?.remoteJid;

    if (fromMe || !remoteJid) {
      return NextResponse.json({ status: "IGNORED_SENDER" });
    }

    const phone = remoteJid.split("@")[0];

    // Check if auto-responder bot toggle is active in database
    const fb = await getFirebase();
    const botRef = fb.doc(fb.db, "config", "whatsapp_bot");
    const botSnap = await fb.getDoc(botRef);
    
    const isBotActive = botSnap.exists() ? botSnap.data()?.botActive === true : false;
    
    if (!isBotActive) {
      return NextResponse.json({ status: "BOT_DISABLED" });
    }

    const config = await getEvolutionConfig();
    const replyText = "Hi! I am currently operating a live printing station. I will get back to you shortly!";

    console.log(`🔌 Dispatching auto-reply message via Evolution API to: ${phone}`);

    const response = await fetch(`${config.url}/message/sendText/${config.instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.key
      },
      body: JSON.stringify({
        number: phone,
        options: {
          delay: 1000,
          presence: "composing"
        },
        textMessage: {
          text: replyText
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Evolution sendText failed:", errText);
      return NextResponse.json({ error: "Failed to send auto-reply via Evolution API", details: errText }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Auto-reply sent successfully" });

  } catch (error: any) {
    console.error("WhatsApp Webhook Error:", error);
    return NextResponse.json({ error: error.message || "Webhook processing error" }, { status: 500 });
  }
}

// ─── PUT: Sync Bot Setting State ─────────────────────────────────────────────
export async function PUT(req: Request) {
  try {
    const { botActive } = await req.json();
    const fb = await getFirebase();
    const botRef = fb.doc(fb.db, "config", "whatsapp_bot");
    
    await fb.setDoc(botRef, { botActive }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
