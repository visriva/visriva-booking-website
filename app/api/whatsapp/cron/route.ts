import { NextResponse } from 'next/server';
import { configureEvolutionTls, getEvolutionConfig, verifyCronSecret } from '@/lib/evolutionApi';

configureEvolutionTls();

async function getFirebase() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const { getFirestore, doc, setDoc } = await import("firebase/firestore");

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "visriva-live-station",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return { db: getFirestore(app), doc, setDoc };
}

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("⏰ WhatsApp Keep-Alive Cron job triggered");
  try {
    const config = await getEvolutionConfig();
    const checkUrl = `${config.url}/instance/connectionState/${config.instance}`;

    console.log(`[Cron] Fetching state from: ${checkUrl}`);
    const res = await fetch(checkUrl, {
      headers: { apikey: config.key },
      next: { revalidate: 0 },
    });

    const isOk = res.ok;
    let state = "close";

    if (isOk) {
      const data = await res.json();
      state = data?.instance?.state || data?.state || "close";
    }

    const isConnected = state === "open" || state === "connected";
    const connectionStatus = isConnected ? "open" : "close";
    const lastSyncedAt = new Date().toISOString();

    const fb = await getFirebase();
    const docRef = fb.doc(fb.db, "config", "whatsapp_bot");
    await fb.setDoc(docRef, {
      connectionStatus,
      lastSyncedAt,
      instanceName: config.instance,
    }, { merge: true });

    return NextResponse.json({
      success: true,
      instanceName: config.instance,
      connectionStatus,
      state,
      lastSyncedAt,
    });
  } catch (error: any) {
    console.error("[Cron Exception]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
