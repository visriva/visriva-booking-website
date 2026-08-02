import { NextResponse } from "next/server";

// Allow self-signed certificates for self-hosted Evolution VPS connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function getFirebase() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const { getFirestore, doc, getDoc } = await import("firebase/firestore");

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "visriva-live-station",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return { db: getFirestore(app), doc, getDoc };
}

async function getEvolutionConfig() {
  try {
    const fb = await getFirebase();
    const docRef = fb.doc(fb.db, "site_config", "operator");
    const snap = await fb.getDoc(docRef);
    
    if (snap.exists()) {
      const data = snap.data();
      let url = data.backupEvoApiUrl || process.env.EVOLUTION_API_URL || "https://api.visriva.com";
      const key = data.backupEvoApiKey || process.env.EVOLUTION_API_KEY || "VisrivaSecretKey2026_SecureKey";
      const instance = data.backupInstanceName || process.env.EVOLUTION_INSTANCE_NAME || "visriva-live";
      
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
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return {
    url,
    key: process.env.EVOLUTION_API_KEY || "VisrivaSecretKey2026_SecureKey",
    instance: process.env.EVOLUTION_INSTANCE_NAME || "visriva-live",
  };
}

async function ensureInstanceExists(config: { url: string; key: string; instance: string }) {
  try {
    // Check connection status of the instance
    const checkRes = await fetch(`${config.url}/instance/connectionStatus/${config.instance}`, {
      headers: { apikey: config.key }
    });
    
    // If instance is missing, recreate it
    if (checkRes.status === 404) {
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
    
    // Auto-create instance if it is missing
    await ensureInstanceExists(config);

    if (action === "status") {
      const res = await fetch(`${config.url}/instance/connectionStatus/${config.instance}`, {
        headers: { apikey: config.key }
      });
      
      if (!res.ok) {
        return NextResponse.json({ state: "close", status: "disconnected", details: `HTTP error ${res.status}` });
      }

      const data = await res.json();
      return NextResponse.json({
        state: data.instance?.state || "close",
        status: data.instance?.state === "open" ? "connected" : "disconnected",
      });
    }

    if (action === "connect") {
      // 1. Determine active webhook URL based on the request host
      const host = req.headers.get("host");
      const protocol = host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https";
      const webhookUrl = `${protocol}://${host}/api/whatsapp/webhook`;

      // 2. Configure Webhook on Evolution API for the instance
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

      // 3. Connect / Generate QR Code
      const res = await fetch(`${config.url}/instance/connect/${config.instance}`, {
        headers: { apikey: config.key }
      });
      
      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `Evolution server connect failed (${res.status}): ${errText.slice(0, 100)}` }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Evolution Instance GET Error:", error);
    return NextResponse.json({ error: error.message || "Failed to reach Evolution server" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    const config = await getEvolutionConfig();

    if (action === "logout") {
      const res = await fetch(`${config.url}/instance/logout/${config.instance}`, {
        method: "DELETE",
        headers: { apikey: config.key }
      });
      
      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `Evolution logout failed (${res.status}): ${errText}` }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Evolution Instance POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
