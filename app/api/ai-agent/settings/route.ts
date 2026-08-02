import { NextResponse } from "next/server";
import { DEFAULT_AGENT_SETTINGS } from "@/types/whatsapp-agent";

async function getFirebase() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const { getFirestore, doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "visriva-live-station",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return { db: getFirestore(app), doc, getDoc, setDoc, serverTimestamp };
}

// ─── GET: Fetch current settings ─────────────────────────────────────────────

export async function GET() {
  try {
    const fb = await getFirebase();
    const docRef = fb.doc(fb.db, "wa_agent_settings", "global");
    const snap = await fb.getDoc(docRef);

    if (snap.exists()) {
      return NextResponse.json({
        settings: { ...DEFAULT_AGENT_SETTINGS, ...snap.data() },
      });
    }

    return NextResponse.json({ settings: DEFAULT_AGENT_SETTINGS });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PUT: Update settings ────────────────────────────────────────────────────

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const fb = await getFirebase();
    const docRef = fb.doc(fb.db, "wa_agent_settings", "global");

    // Whitelist allowed fields
    const allowedFields = [
      "systemPrompt", "defaultMode", "geminiModel", "temperature",
      "maxTokens", "aiEnabled", "greetingMessage", "awayMessage",
      "autoReadReceipts",
    ];

    const update: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        update[field] = body[field];
      }
    }

    update.updatedAt = fb.serverTimestamp();

    await fb.setDoc(docRef, update, { merge: true });

    return NextResponse.json({ success: true, updated: Object.keys(update) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
