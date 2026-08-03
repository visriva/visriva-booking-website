import { NextResponse } from 'next/server';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const EVO_URL      = (process.env.EVOLUTION_API_URL      || 'https://evolution-api-production-d446.up.railway.app').replace(/\/$/, '');
const EVO_KEY      = process.env.EVOLUTION_API_KEY       || 'VisrivaSecretKey2026_SecureKey';
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'visriva-live';

const evoHeaders = {
  'Content-Type': 'application/json',
  'apikey': EVO_KEY,
};

// ─── Shared Firebase init ────────────────────────────────────────────────────
async function getFirebase() {
  const { initializeApp, getApps, getApp } = await import('firebase/app');
  const { getFirestore, doc, getDoc, setDoc } = await import('firebase/firestore');
  const app = getApps().length === 0
    ? initializeApp({
        apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'visriva-live-station',
        storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      })
    : getApp();
  return { db: getFirestore(app), doc, getDoc, setDoc };
}

async function syncStatusToFirestore(status: string) {
  try {
    const fb = await getFirebase();
    await fb.setDoc(
      fb.doc(fb.db, 'config', 'whatsapp_bot'),
      { connectionStatus: status, lastSyncedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (e) {
    console.warn('[connect] Firestore sync skipped:', e);
  }
}

// ─── GET — connection status check ──────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'status';

  if (action === 'status') {
    try {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${EVO_INSTANCE}`, {
        headers: evoHeaders,
      });
      if (!res.ok) {
        await syncStatusToFirestore('close');
        return NextResponse.json({ status: 'disconnected', httpStatus: res.status });
      }
      const data = await res.json();
      const state: string = data?.instance?.state || data?.state || 'unknown';
      const connected = state === 'open';
      await syncStatusToFirestore(connected ? 'open' : 'close');
      return NextResponse.json({ status: connected ? 'connected' : 'disconnected', state });
    } catch (err: any) {
      return NextResponse.json({ status: 'disconnected', error: err.message });
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// ─── POST — connect / QR / setup_webhook ────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action: string = body.action || 'connect';

    // ── setup_webhook ──────────────────────────────────────────────────────
    if (action === 'setup_webhook') {
      const webhookUrl = 'https://visriva.com/api/whatsapp/webhook';
      const endpoint   = `${EVO_URL}/webhook/set/${EVO_INSTANCE}`;
      console.log(`[connect/setup_webhook] POST ${endpoint}`);

      const res = await fetch(endpoint, {
        method:  'POST',
        headers: evoHeaders,
        body:    JSON.stringify({
          webhook: {
            url:     webhookUrl,
            enabled: true,
            events:  ['MESSAGES_UPSERT', 'MESSAGES_SET', 'CONNECTION_UPDATE'],
          },
        }),
      });

      const raw = await res.text();
      let parsed: unknown = raw;
      try { parsed = JSON.parse(raw); } catch {}

      if (!res.ok) {
        return NextResponse.json(
          { error: `Railway ${res.status}`, details: parsed },
          { status: res.status }
        );
      }
      return NextResponse.json({ success: true, url: webhookUrl, response: parsed });
    }

    // ── connect (QR generation) ────────────────────────────────────────────
    // Step 1 — check current connection state
    console.log(`[connect/step-1] Checking connectionState for ${EVO_INSTANCE}...`);
    const stateRes = await fetch(`${EVO_URL}/instance/connectionState/${EVO_INSTANCE}`, {
      headers: evoHeaders,
    });

    if (stateRes.ok) {
      const stateData = await stateRes.json();
      const state: string = stateData?.instance?.state || stateData?.state || '';
      console.log(`[connect/step-1] State: ${state}`);

      if (state === 'open') {
        await syncStatusToFirestore('open');
        return NextResponse.json({ connected: true, state: 'open' });
      }
    }

    // Step 2 — try to fetch QR from existing instance
    console.log(`[connect/step-2] Fetching QR from existing instance...`);
    const connectRes = await fetch(`${EVO_URL}/instance/connect/${EVO_INSTANCE}`, {
      headers: evoHeaders,
    });

    if (connectRes.ok) {
      const connectData = await connectRes.json();
      let raw64: string =
        connectData?.base64 ||
        connectData?.qrcode?.base64 ||
        connectData?.qrcode ||
        '';

      if (raw64) {
        raw64 = raw64.replace(/^data:image\/[a-z]+;base64,/, '');
        await syncStatusToFirestore('connecting');
        return NextResponse.json({ connected: false, base64: raw64 });
      }
    }

    // Step 3 — create the instance
    console.log(`[connect/step-3] Creating instance ${EVO_INSTANCE}...`);
    const createRes = await fetch(`${EVO_URL}/instance/create`, {
      method:  'POST',
      headers: evoHeaders,
      body:    JSON.stringify({
        instanceName: EVO_INSTANCE,
        token:        EVO_KEY,
        qrcode:       true,
        integration:  'WHATSAPP-BAILEYS',
      }),
    });

    const createData = await createRes.json().catch(() => ({}));
    console.log(`[connect/step-3] Create response ${createRes.status}:`, createData);

    // Step 4 — re-fetch QR after creation (even on 400/403 — instance may already exist)
    console.log(`[connect/step-4] Re-fetching connect after create...`);
    const retryRes = await fetch(`${EVO_URL}/instance/connect/${EVO_INSTANCE}`, {
      headers: evoHeaders,
    });

    if (retryRes.ok) {
      const retryData = await retryRes.json();
      let raw64: string =
        retryData?.base64 ||
        retryData?.qrcode?.base64 ||
        retryData?.qrcode ||
        '';

      if (raw64) {
        raw64 = raw64.replace(/^data:image\/[a-z]+;base64,/, '');
        await syncStatusToFirestore('connecting');
        return NextResponse.json({ connected: false, base64: raw64 });
      }
    }

    return NextResponse.json(
      { error: 'Unable to connect or create instance. Check Railway logs.' },
      { status: 502 }
    );
  } catch (err: any) {
    console.error('[connect] Fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
