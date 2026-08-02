import { NextResponse } from "next/server";

// Allow self-signed certs for self-hosted Evolution VPS connections
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
  const defaultUrl = "https://evolution-api-production-d446.up.railway.app";
  const defaultKey = "VisrivaSecretKey2026_SecureKey";
  const defaultInstance = "visriva-live";

  try {
    const fb = await getFirebase();
    const docRef = fb.doc(fb.db, "config", "operator");
    const snap = await fb.getDoc(docRef);
    
    if (snap.exists()) {
      const data = snap.data();
      let url = data.backupEvoApiUrl || process.env.EVOLUTION_API_URL || defaultUrl;
      const key = data.backupEvoApiKey || process.env.EVOLUTION_API_KEY || defaultKey;
      const instance = data.backupInstanceName || process.env.EVOLUTION_INSTANCE_NAME || defaultInstance;
      
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      if (url.endsWith("/")) {
        url = url.slice(0, -1);
      }
      return { url, key, instance };
    } else {
      // Auto-initialize operator configurations if empty
      await fb.setDoc(docRef, {
        backupEvoApiUrl: defaultUrl,
        backupEvoApiKey: defaultKey,
        backupInstanceName: defaultInstance
      });
    }
  } catch (err) {
    console.warn("Failed to load/initialize Evolution config:", err);
  }
  
  return {
    url: defaultUrl,
    key: defaultKey,
    instance: defaultInstance,
  };
}

async function ensureInstanceExists(config: { url: string; key: string; instance: string }) {
  try {
    let needsCreation = false;
    const checkRes = await fetch(`${config.url}/instance/connectionStatus/${config.instance}`, {
      headers: { apikey: config.key }
    });
    
    if (!checkRes.ok) {
      needsCreation = true;
    } else {
      const data = await checkRes.json();
      if (data.error || data.message?.includes("not found") || data.message?.includes("not exist")) {
        needsCreation = true;
      }
    }
    
    if (needsCreation) {
      console.log(`🔌 Evolution instance ${config.instance} not found. Re-creating...`);
      await fetch(`${config.url}/instance/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.key
        },
        body: JSON.stringify({
          instanceName: config.instance,
          token: config.key,
          qrcode: true
        })
      });
    }
  } catch (e) {
    console.warn("Failed to check or auto-create Evolution instance:", e);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "status";
    
    const config = await getEvolutionConfig();
    await ensureInstanceExists(config);

    if (action === "status") {
      const res = await fetch(`${config.url}/instance/connectionStatus/${config.instance}`, {
        headers: { apikey: config.key }
      });
      
      if (!res.ok) {
        return NextResponse.json({ state: "close", status: "disconnected" });
      }

      const data = await res.json();
      return NextResponse.json({
        state: data.instance?.state || "close",
        status: data.instance?.state === "open" ? "connected" : "disconnected",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const config = await getEvolutionConfig();
    await ensureInstanceExists(config);

    // Determine active webhook URL based on the request host
    const host = req.headers.get("host");
    const protocol = host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https";
    const webhookUrl = `${protocol}://${host}/api/whatsapp/webhook`;

    // 1. Configure Webhook on Evolution API for the instance
    try {
      console.log(`🔌 Registering Evolution Webhook for ${config.instance} ➡️ ${webhookUrl}`);
      await fetch(`${config.url}/webhook/set/${config.instance}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.key,
        },
        body: JSON.stringify({
          enabled: true,
          url: webhookUrl,
          events: [
            "CONNECTION_UPDATE",
            "MESSAGES_UPSERT"
          ]
        })
      });
    } catch (webhookErr) {
      console.warn("Failed to set Evolution webhook URL:", webhookErr);
    }

    // 2. Connect / Generate QR Code
    // Try POST first (standard in v2.x), fallback to GET if POST returns 404 or 405
    let res = await fetch(`${config.url}/instance/connect/${config.instance}`, {
      method: "POST",
      headers: { apikey: config.key }
    });
    
    if (res.status === 404 || res.status === 405) {
      console.log(`🔌 POST connect failed with ${res.status}. Falling back to GET...`);
      res = await fetch(`${config.url}/instance/connect/${config.instance}`, {
        method: "GET",
        headers: { apikey: config.key }
      });
    }
    
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Evolution connect failed (${res.status}): ${errText.slice(0, 100)}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
