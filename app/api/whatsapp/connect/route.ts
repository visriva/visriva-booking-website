import { NextResponse } from 'next/server';

// Allow self-signed certs for self-hosted Evolution VPS connections
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
  const defaultUrl = "https://evolution-api-production-d446.up.railway.app";
  const defaultKey = "VisrivaSecretKey2026_SecureKey";
  const defaultInstance = "visriva-live";

  let url = process.env.EVOLUTION_API_URL || defaultUrl;
  let key = process.env.EVOLUTION_API_KEY || defaultKey;
  let instance = process.env.EVOLUTION_INSTANCE_NAME || defaultInstance;

  try {
    const fb = await getFirebase();
    const docRef = fb.doc(fb.db, "config", "operator");
    const snap = await fb.getDoc(docRef);
    
    if (snap.exists()) {
      const data = snap.data();
      if (data.backupEvoApiUrl) url = data.backupEvoApiUrl;
      if (data.backupEvoApiKey) key = data.backupEvoApiKey;
      if (data.backupInstanceName) instance = data.backupInstanceName;
    }
  } catch (err) {
    console.warn("[Config Loader] Firestore config load bypassed, using env/default config:", err);
  }

  url = url.replace(/\/$/, '');
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  return { url, key, instance };
}

export async function GET(req: Request) {
  console.log("📥 GET Request received at /api/whatsapp/connect");
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "status";
    
    const config = await getEvolutionConfig();
    console.log(`[GET status] Querying connection status for: ${config.url}/instance/connectionStatus/${config.instance}`);

    if (action === "status") {
      const res = await fetch(`${config.url}/instance/connectionStatus/${config.instance}`, {
        headers: { apikey: config.key }
      });
      
      if (!res.ok) {
        console.log(`[GET status] Connection check returned status ${res.status}. Treating as disconnected.`);
        return NextResponse.json({ state: "close", status: "disconnected" });
      }

      const data = await res.json();
      console.log("[GET status] Connection status data:", JSON.stringify(data));
      return NextResponse.json({
        state: data.instance?.state || "close",
        status: data.instance?.state === "open" ? "connected" : "disconnected",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[GET Exception]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  console.log("📥 POST Request received at /api/whatsapp/connect");
  try {
    const config = await getEvolutionConfig();
    const baseUrl = config.url;
    const apiKey = config.key;
    const instanceName = config.instance;

    console.log(`[POST connect] Using config: URL="${baseUrl}", Instance="${instanceName}"`);

    // Determine active webhook URL based on the request host
    const host = req.headers.get("host");
    const protocol = host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https";
    const webhookUrl = `${protocol}://${host}/api/whatsapp/webhook`;

    // STEP 1: CREATE THE INSTANCE FIRST
    console.log(`[1/2] Creating instance '${instanceName}' on Evolution API via POST ${baseUrl}/instance/create...`);
    const createRes = await fetch(`${baseUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    });

    const createStatus = createRes.status;
    const createBodyText = await createRes.text();
    console.log('[1/2] Create response status:', createStatus);
    console.log('[1/2] Create response body:', createBodyText);

    let createData: any = {};
    try {
      createData = JSON.parse(createBodyText);
    } catch (e) {
      console.warn('[1/2] Failed to parse create response body as JSON');
    }

    // Configure Webhook so the auto-responder behaves correctly
    const webhookSetUrl = `${baseUrl}/webhook/set/${instanceName}`;
    console.log(`[Webhook] Configuring webhook via POST ${webhookSetUrl}`);
    try {
      const webhookRes = await fetch(webhookSetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
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
      console.log(`[Webhook] Configured successfully. Status: ${webhookRes.status}`);
    } catch (webhookErr: any) {
      console.warn(`[Webhook] Warning: Failed to set webhook URL: ${webhookErr.message}`);
    }

    // STEP 2: CONNECT / FETCH QR CODE
    console.log(`[2/2] Fetching QR Code for instance '${instanceName}' via GET ${baseUrl}/instance/connect/${instanceName}...`);
    const connectRes = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
      },
    });
    
    const connectStatus = connectRes.status;
    const connectBodyText = await connectRes.text();
    console.log('[2/2] Connect response status:', connectStatus);
    console.log('[2/2] Connect response body (truncated):', connectBodyText.slice(0, 200));

    let connectData: any = {};
    try {
      connectData = JSON.parse(connectBodyText);
    } catch (e) {
      console.error('[2/2] Failed to parse connect response body as JSON:', e);
      return NextResponse.json({ 
        error: 'Invalid JSON response from connect endpoint', 
        details: { connectBodyText } 
      }, { status: 500 });
    }

    // Extract base64 QR code string from wherever Evolution API returns it
    let rawBase64 = connectData.base64 || connectData.qrcode?.base64 || createData.qrcode?.base64 || createData.base64 || '';

    // Strip prefix if already attached
    if (typeof rawBase64 === 'string') {
      rawBase64 = rawBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    }

    if (!rawBase64) {
      console.error('[POST Error] Failed to retrieve QR code from server response:', { createData, connectData });
      return NextResponse.json({ 
        error: 'Failed to retrieve QR code from server response', 
        details: { createData, connectData } 
      }, { status: 400 });
    }

    console.log(`[POST Success] Successfully retrieved QR Base64 (length: ${rawBase64.length})`);
    return NextResponse.json({ base64: rawBase64 });
  } catch (error: any) {
    console.error('SERVER ROUTE ERROR:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
