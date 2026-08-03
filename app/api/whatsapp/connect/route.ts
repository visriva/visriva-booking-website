import { NextResponse } from 'next/server';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const EVO_URL      = (process.env.EVOLUTION_API_URL      || 'https://evolution-api-production-d446.up.railway.app').replace(/\/$/, '');
const EVO_KEY      = process.env.EVOLUTION_API_KEY       || 'VisrivaSecretKey2026_SecureKey';
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'visriva-live';

const evoHeaders = {
  'Content-Type': 'application/json',
  'apikey': EVO_KEY,
};

async function syncStatusToFirestore(status: string) {
  try {
    const { saveBotSettings } = await import('@/lib/chatStore');
    await saveBotSettings({
      connectionStatus: status,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[connect] Status sync skipped:', e);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${EVO_INSTANCE}`, {
          headers: evoHeaders,
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
          await syncStatusToFirestore('close');
          return NextResponse.json({ status: 'disconnected', connected: false, httpStatus: res.status });
        }

        const data = await res.json().catch(() => ({}));
        const state: string = data?.instance?.state || data?.state || 'unknown';
        const connected = state === 'open';
        await syncStatusToFirestore(connected ? 'open' : 'close');

        return NextResponse.json({ status: connected ? 'connected' : 'disconnected', connected, state });
      } catch (fetchErr: any) {
        return NextResponse.json({ status: 'disconnected', connected: false, error: fetchErr.message });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'GET /api/whatsapp/connect error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action: string = body.action || 'connect';

    // ── setup_webhook ────────────────────────────────────────────────────────
    if (action === 'setup_webhook') {
      const webhookUrl = 'https://visriva.com/api/whatsapp/webhook';
      const endpoint   = `${EVO_URL}/webhook/set/${EVO_INSTANCE}`;
      console.log(`[connect/setup_webhook] POST ${endpoint}`);

      try {
        const res = await fetch(endpoint, {
          method:  'POST',
          headers: evoHeaders,
          body:    JSON.stringify({
            webhook: {
              url:     webhookUrl,
              enabled: true,
              events:  ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
            },
          }),
          signal: AbortSignal.timeout(8000),
        });

        const raw = await res.text();
        let parsed: unknown = raw;
        try { parsed = JSON.parse(raw); } catch { parsed = { message: raw }; }

        if (!res.ok) {
          return NextResponse.json(
            { error: `Railway HTTP ${res.status}`, details: parsed },
            { status: res.status }
          );
        }
        return NextResponse.json({ success: true, url: webhookUrl, response: parsed });
      } catch (webErr: any) {
        return NextResponse.json({ error: webErr.message || 'Failed to setup webhook' }, { status: 500 });
      }
    }

    // ── connect (QR Generation & Connect) ────────────────────────────────────
    // Step 1: Check connection state
    console.log(`[connect/step-1] Checking connectionState for '${EVO_INSTANCE}'...`);
    try {
      const stateRes = await fetch(`${EVO_URL}/instance/connectionState/${EVO_INSTANCE}`, {
        headers: evoHeaders,
        signal: AbortSignal.timeout(6000),
      });

      if (stateRes.ok) {
        const stateData = await stateRes.json().catch(() => ({}));
        const state: string = stateData?.instance?.state || stateData?.state || '';
        console.log(`[connect/step-1] Connection state: ${state}`);

        if (state === 'open') {
          await syncStatusToFirestore('open');
          return NextResponse.json({ connected: true, state: 'open' });
        }
      }
    } catch (step1Err) {
      console.warn('[connect/step-1] Warning checking state:', step1Err);
    }

    // Step 2: Fetch QR code from existing instance
    console.log(`[connect/step-2] Fetching QR code from instance '${EVO_INSTANCE}'...`);
    try {
      const connectRes = await fetch(`${EVO_URL}/instance/connect/${EVO_INSTANCE}`, {
        headers: evoHeaders,
        signal: AbortSignal.timeout(6000),
      });

      if (connectRes.ok) {
        const connectData = await connectRes.json().catch(() => ({}));
        let raw64: string =
          connectData?.base64 ||
          connectData?.qrcode?.base64 ||
          connectData?.qrcode ||
          '';

        if (raw64) {
          const cleanBase64 = raw64.replace(/^data:image\/[a-z]+;base64,/, '');
          await syncStatusToFirestore('connecting');
          return NextResponse.json({ connected: false, base64: cleanBase64 });
        }
      }
    } catch (step2Err) {
      console.warn('[connect/step-2] Warning fetching QR:', step2Err);
    }

    // Step 3: Create instance if missing or wiped by Railway
    console.log(`[connect/step-3] Creating instance '${EVO_INSTANCE}' on Railway...`);
    try {
      const createRes = await fetch(`${EVO_URL}/instance/create`, {
        method:  'POST',
        headers: evoHeaders,
        body:    JSON.stringify({
          instanceName: EVO_INSTANCE,
          token:        EVO_KEY,
          qrcode:       true,
          integration:  'WHATSAPP-BAILEYS',
        }),
        signal: AbortSignal.timeout(8000),
      });

      const createData = await createRes.json().catch(() => ({}));
      console.log(`[connect/step-3] Create response status ${createRes.status}:`, createData);
    } catch (step3Err) {
      console.warn('[connect/step-3] Warning creating instance:', step3Err);
    }

    // Step 4: Re-fetch QR code after creation
    console.log(`[connect/step-4] Re-fetching QR code after creation...`);
    try {
      const retryRes = await fetch(`${EVO_URL}/instance/connect/${EVO_INSTANCE}`, {
        headers: evoHeaders,
        signal: AbortSignal.timeout(8000),
      });

      if (retryRes.ok) {
        const retryData = await retryRes.json().catch(() => ({}));
        let raw64: string =
          retryData?.base64 ||
          retryData?.qrcode?.base64 ||
          retryData?.qrcode ||
          '';

        if (raw64) {
          const cleanBase64 = raw64.replace(/^data:image\/[a-z]+;base64,/, '');
          await syncStatusToFirestore('connecting');
          return NextResponse.json({ connected: false, base64: cleanBase64 });
        }
      }
    } catch (step4Err) {
      console.warn('[connect/step-4] Warning re-fetching QR:', step4Err);
    }

    return NextResponse.json(
      { error: 'Unable to connect or create instance. Check Railway status.' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('[connect] Top-level crash error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
