import { NextResponse } from "next/server";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function getFirebase() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const {
    getFirestore,
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    addDoc,
    setDoc,
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
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    addDoc,
    setDoc,
    serverTimestamp,
  };
}

async function getEvolutionConfig() {
  const defaults = {
    url: "https://evolution-api-production-d446.up.railway.app",
    key: "VisrivaSecretKey2026_SecureKey",
    instance: "visriva-live",
  };
  try {
    const fb = await getFirebase();
    const snap = await fb.getDoc(fb.doc(fb.db, "config", "operator"));
    if (snap.exists()) {
      const d = snap.data();
      let url = d.backupEvoApiUrl || process.env.EVOLUTION_API_URL || defaults.url;
      url = url.replace(/\/$/, "");
      if (!url.startsWith("http")) url = "https://" + url;
      return {
        url,
        key: d.backupEvoApiKey || process.env.EVOLUTION_API_KEY || defaults.key,
        instance: d.backupInstanceName || process.env.EVOLUTION_INSTANCE_NAME || defaults.instance,
      };
    }
  } catch {}
  return {
    url: (process.env.EVOLUTION_API_URL || defaults.url).replace(/\/$/, ""),
    key: process.env.EVOLUTION_API_KEY || defaults.key,
    instance: process.env.EVOLUTION_INSTANCE_NAME || defaults.instance,
  };
}

// ─── GET: Fetch all chat threads ─────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const fb = await getFirebase();

    if (phone) {
      // Fetch messages for a specific thread
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const messagesRef = fb.collection(fb.db, "chats", cleanPhone, "messages");
      const q = fb.query(messagesRef, fb.orderBy("timestamp", "asc"), fb.limit(150));
      const snap = await fb.getDocs(q);

      const messages = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          sender: data.sender,
          text: data.text,
          timestamp: data.timestamp?.toDate?.()?.toISOString?.() || null,
        };
      });

      return NextResponse.json({ messages });
    }

    // Fetch all threads
    const threadsRef = fb.collection(fb.db, "chats");
    const snap = await fb.getDocs(threadsRef);

    const threads = snap.docs.map((d) => {
      const data = d.data();
      return {
        phoneNum: d.id,
        displayName: data.displayName || d.id,
        lastMessage: data.lastMessage || "",
        lastTimestamp: data.lastTimestamp?.toDate?.()?.toISOString?.() || null,
      };
    });

    threads.sort((a, b) => {
      const ta = a.lastTimestamp ? new Date(a.lastTimestamp).getTime() : 0;
      const tb = b.lastTimestamp ? new Date(b.lastTimestamp).getTime() : 0;
      return tb - ta;
    });

    return NextResponse.json({ threads });
  } catch (error: any) {
    console.error("[CRM GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST: Send a manual admin message ──────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { phone, text } = await req.json();
    if (!phone || !text) {
      return NextResponse.json({ error: "phone and text are required" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const config = await getEvolutionConfig();

    // Send via Evolution API
    const sendRes = await fetch(`${config.url}/message/sendText/${config.instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.key,
      },
      body: JSON.stringify({
        number: cleanPhone,
        options: { delay: 500 },
        textMessage: { text },
      }),
    });

    if (!sendRes.ok) {
      const err = await sendRes.text();
      return NextResponse.json({ error: "Failed to send message", details: err }, { status: 500 });
    }

    // Save to Firestore
    const fb = await getFirebase();
    const messagesRef = fb.collection(fb.db, "chats", cleanPhone, "messages");
    await fb.addDoc(messagesRef, {
      sender: "admin",
      text,
      timestamp: fb.serverTimestamp(),
    });

    await fb.setDoc(
      fb.doc(fb.db, "chats", cleanPhone),
      {
        lastMessage: text.slice(0, 120),
        lastTimestamp: fb.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[CRM POST] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
