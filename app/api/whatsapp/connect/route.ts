import { NextResponse } from 'next/server';

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
    console.log(`[GET status] Querying connection status for: ${config.url}/instance/connectionState/${config.instance}`);

    if (action === "status") {
      const res = await fetch(`${config.url}/instance/connectionState/${config.instance}`, {
        headers: { apikey: config.key }
      });
      
      if (!res.ok) {
        console.log(`[GET status] Connection check returned status ${res.status}. Treating as disconnected.`);
        try {
          const fb = await getFirebase();
          const docRef = fb.doc(fb.db, "config", "whatsapp_bot");
          await fb.setDoc(docRef, {
            connectionStatus: "close",
            lastSyncedAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {}
        return NextResponse.json({ state: "close", status: "disconnected" });
      }

      const data = await res.json();
      console.log("[GET status] Connection status data:", JSON.stringify(data));
      const state = data?.instance?.state || data?.state;
      const isConnected = state === "open" || state === "connected";
      
      try {
        const fb = await getFirebase();
        const docRef = fb.doc(fb.db, "config", "whatsapp_bot");
        await fb.setDoc(docRef, {
          connectionStatus: isConnected ? "open" : "close",
          lastSyncedAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        console.warn("[GET status] Failed to save connectionStatus to Firestore:", dbErr);
      }

      return NextResponse.json({
        state: state || "close",
        status: isConnected ? "connected" : "disconnected",
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
    const body = await req.json().catch(() => ({}));
    const action = body.action || "connect";

    const config = await getEvolutionConfig();
    const baseUrl = config.url;
    const apiKey = config.key;
    const instanceName = config.instance;

    console.log(`[POST connect] Using config: URL="${baseUrl}", Instance="${instanceName}", Action="${action}"`);

    // Determine active webhook URL based on the request host
    const host = req.headers.get("host");
    const protocol = host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https";
    const webhookUrl = host?.includes("visriva.com") 
      ? "https://visriva.com/api/whatsapp/webhook"
      : `${protocol}://${host}/api/whatsapp/webhook`;

    if (action === "setup_webhook") {
      const webhookSetUrl = `${baseUrl}/webhook/set/${instanceName}`;
      console.log(`[Webhook Sync] Configuring webhook via POST ${webhookSetUrl} to URL ${webhookUrl}`);
      
      const webhookRes = await fetch(webhookSetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          enabled: true,
          url: webhookUrl,
          events: ["MESSAGES_UPSERT"]
        })
      });

      const resStatus = webhookRes.status;
      const resText = await webhookRes.text();
      console.log(`[Webhook Sync] Response status: ${resStatus}, body: ${resText}`);

      if (!webhookRes.ok) {
        return NextResponse.json({ 
          error: `Evolution Webhook set failed (${resStatus}): ${resText}` 
        }, { status: resStatus });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Webhook set successfully", 
        url: webhookUrl,
        response: resText 
      });
    }

    // STEP 1: CHECK IF INSTANCE IS ALREADY CONNECTED
    console.log(`[1/3] Checking connection status for '${instanceName}' via GET ${baseUrl}/instance/connectionState/${instanceName}...`);
    const statusRes = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': apiKey },
    });

    if (statusRes.ok) {
      const statusData = await statusRes.json();
      console.log(`[1/3] Connection status payload:`, JSON.stringify(statusData));
      const state = statusData?.instance?.state || statusData?.state;
      if (state === 'open' || state === 'connected') {
        console.log('Instance is already connected and open!');
        try {
          const fb = await getFirebase();
          const docRef = fb.doc(fb.db, "config", "whatsapp_bot");
          await fb.setDoc(docRef, {
            connectionStatus: "open",
            lastSyncedAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {}
        return NextResponse.json({ connected: true, state: 'open' });
      }
    } else {
      console.log(`[1/3] Status check failed or instance doesn't exist yet (Status: ${statusRes.status}).`);
    }

    // STEP 2: TRY CONNECTING / FETCHING EXISTING QR
    console.log(`[2/3] Attempting to fetch existing QR code for '${instanceName}' via GET ${baseUrl}/instance/connect/${instanceName}...`);
    const connectRes = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': apiKey },
    });

    if (connectRes.ok) {
      const connectData = await connectRes.json();
      let rawBase64 = connectData.base64 || connectData.qrcode?.base64 || connectData.code || '';
      if (typeof rawBase64 === 'string') {
        rawBase64 = rawBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      }
      if (rawBase64) {
        console.log(`[2/3] Successfully retrieved existing QR code.`);
        try {
          const fb = await getFirebase();
          const docRef = fb.doc(fb.db, "config", "whatsapp_bot");
          await fb.setDoc(docRef, {
            connectionStatus: "close",
            lastSyncedAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {}
        return NextResponse.json({ connected: false, base64: rawBase64 });
      }
    } else {
      console.log(`[2/3] Fetching existing QR code failed (Status: ${connectRes.status}).`);
    }

    // STEP 3: CREATE INSTANCE ONLY IF IT DOESN'T EXIST
    console.log(`[3/3] Creating new instance '${instanceName}' via POST ${baseUrl}/instance/create...`);
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
    console.log('[3/3] Create response status:', createStatus);
    console.log('[3/3] Create response body:', createBodyText);

    let createData: any = {};
    try {
      createData = JSON.parse(createBodyText);
    } catch (e) {
      console.warn('[3/3] Failed to parse create response body as JSON');
    }

    if (createRes.ok || createStatus === 400 || createStatus === 403) {
      // Configure Webhook since we're setting up the instance
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

      // Fetch the QR code again now that it has been created/re-initialized
      console.log(`[3/3] Re-fetching connect after create...`);
      const retryConnectRes = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': apiKey },
      });
      if (retryConnectRes.ok) {
        const retryConnectData = await retryConnectRes.json();
        let rawBase64 = retryConnectData.base64 || retryConnectData.qrcode?.base64 || retryConnectData.code || '';
        if (typeof rawBase64 === 'string') {
          rawBase64 = rawBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        }
        if (rawBase64) {
          try {
            const fb = await getFirebase();
            const docRef = fb.doc(fb.db, "config", "whatsapp_bot");
            await fb.setDoc(docRef, {
              connectionStatus: "close",
              lastSyncedAt: new Date().toISOString()
            }, { merge: true });
          } catch (dbErr) {}
          return NextResponse.json({ connected: false, base64: rawBase64 });
        }
      }
    }

    let rawBase64 = createData.base64 || createData.qrcode?.base64 || '';
    if (typeof rawBase64 === 'string') {
      rawBase64 = rawBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    }

    if (rawBase64) {
      try {
        const fb = await getFirebase();
        const docRef = fb.doc(fb.db, "config", "whatsapp_bot");
        await fb.setDoc(docRef, {
          connectionStatus: "close",
          lastSyncedAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {}
      return NextResponse.json({ connected: false, base64: rawBase64 });
    }

    return NextResponse.json({
      error: 'Unable to connect or create instance',
      details: { createData }
    }, { status: 400 });

  } catch (error: any) {
    console.error('SERVER ROUTE ERROR:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
