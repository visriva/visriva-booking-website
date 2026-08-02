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
      console.log(`[Config Loader] Loaded config successfully: URL=${url}, Instance=${instance}`);
      return { url, key, instance };
    } else {
      console.log("[Config Loader] Operator doc not found. Seeding default configs...");
      await fb.setDoc(docRef, {
        backupEvoApiUrl: defaultUrl,
        backupEvoApiKey: defaultKey,
        backupInstanceName: defaultInstance
      });
    }
  } catch (err) {
    console.warn("[Config Loader] Failed to load/initialize Evolution config, using env/defaults fallback:", err);
  }
  
  let fallbackUrl = process.env.EVOLUTION_API_URL || defaultUrl;
  if (!fallbackUrl.startsWith("http://") && !fallbackUrl.startsWith("https://")) {
    fallbackUrl = "https://" + fallbackUrl;
  }
  if (fallbackUrl.endsWith("/")) {
    fallbackUrl = fallbackUrl.slice(0, -1);
  }

  return {
    url: fallbackUrl,
    key: process.env.EVOLUTION_API_KEY || defaultKey,
    instance: process.env.EVOLUTION_INSTANCE_NAME || defaultInstance,
  };
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
    console.log(`[POST connect] Using Config: URL="${config.url}", Instance="${config.instance}"`);

    // Determine active webhook URL based on the request host
    const host = req.headers.get("host");
    const protocol = host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https";
    const webhookUrl = `${protocol}://${host}/api/whatsapp/webhook`;

    // ----------------------------------------------------
    // STEP 1: Check / Create the Instance
    // ----------------------------------------------------
    const createUrl = `${config.url}/instance/create`;
    console.log(`[Step 1] Attempting to create/verify instance via POST ${createUrl}`);
    
    const createRes = await fetch(createUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.key
      },
      body: JSON.stringify({
        instanceName: config.instance,
        qrcode: true
      })
    });

    const createStatus = createRes.status;
    const createBodyText = await createRes.text();
    console.log(`[Step 1] Response received. Status: ${createStatus}`);
    console.log(`[Step 1] Response Body: ${createBodyText}`);

    if (!createRes.ok) {
      // If it fails but says it already exists, that is safe to ignore
      if (createBodyText.includes("already exists") || createBodyText.includes("exists") || createStatus === 400) {
        console.log(`[Step 1] Instance "${config.instance}" already exists. Proceeding safely to connect...`);
      } else {
        console.error(`[Step 1] Fatal instance creation error: Status=${createStatus}, Body=${createBodyText}`);
        return NextResponse.json({ 
          error: `Instance creation failed (${createStatus}): ${createBodyText}` 
        }, { status: createStatus });
      }
    } else {
      console.log(`[Step 1] Instance "${config.instance}" created successfully.`);
    }

    // ----------------------------------------------------
    // Webhook Configuration (Required for Auto-Responder)
    // ----------------------------------------------------
    const webhookSetUrl = `${config.url}/webhook/set/${config.instance}`;
    console.log(`[Webhook] Configuring webhook via POST ${webhookSetUrl}`);
    try {
      const webhookRes = await fetch(webhookSetUrl, {
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
      console.log(`[Webhook] Configured successfully. Status: ${webhookRes.status}`);
    } catch (webhookErr: any) {
      console.warn(`[Webhook] Warning: Failed to set webhook URL: ${webhookErr.message}`);
    }

    // ----------------------------------------------------
    // STEP 2: Fetch the QR Code
    // ----------------------------------------------------
    const connectUrl = `${config.url}/instance/connect/${config.instance}`;
    console.log(`[Step 2] Fetching QR Code via GET ${connectUrl}`);

    const connectRes = await fetch(connectUrl, {
      method: "GET",
      headers: {
        apikey: config.key
      }
    });

    const connectStatus = connectRes.status;
    const connectBodyText = await connectRes.text();
    console.log(`[Step 2] Response received. Status: ${connectStatus}`);

    if (!connectRes.ok) {
      console.error(`[Step 2] Fatal connection/QR fetch error: Status=${connectStatus}, Body=${connectBodyText}`);
      return NextResponse.json({ 
        error: `Evolution connect failed (${connectStatus}): ${connectBodyText}` 
      }, { status: connectStatus });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(connectBodyText);
      console.log("[Step 2] Parsed Response Keys:", Object.keys(parsedData));
    } catch (parseErr) {
      console.error("[Step 2] Failed to parse JSON response:", parseErr);
      return NextResponse.json({ 
        error: `Invalid JSON response from connect endpoint: ${connectBodyText.slice(0, 100)}` 
      }, { status: 500 });
    }

    // Extract the base64 code from the response. Look at multiple possible properties for safety.
    const base64Data = parsedData.base64 || parsedData.qrcode?.base64 || parsedData.code || "";
    
    if (base64Data) {
      console.log(`[Step 2] Base64 QR Code extracted successfully (Length: ${base64Data.length})`);
    } else {
      console.warn("[Step 2] Warning: No base64 field found in JSON payload. Full Payload:", connectBodyText);
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("[POST Exception]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
