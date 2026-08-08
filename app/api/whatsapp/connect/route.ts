import { NextResponse } from 'next/server';
import { configureEvolutionTls, getEvolutionConfig, getEvolutionHeaders } from '@/lib/evolutionApi';
import { registerEvolutionWebhook } from '@/lib/registerEvolutionWebhook';

configureEvolutionTls();

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
        const { url, key, instance } = await getEvolutionConfig();
        const res = await fetch(`${url}/instance/connectionState/${instance}`, {
          headers: getEvolutionHeaders(key),
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
    const { url, key, instance } = await getEvolutionConfig();
    const evoHeaders = getEvolutionHeaders(key);

    const body = await req.json().catch(() => ({}));
    const action: string = body.action || 'connect';

    if (action === 'setup_webhook') {
      const result = await registerEvolutionWebhook();
      if (!result.ok) {
        return NextResponse.json({ error: result.error, url: result.url }, { status: 500 });
      }
      return NextResponse.json({ success: true, url: result.url });
    }

    console.log(`[connect/step-1] Checking connectionState for '${instance}'...`);
    try {
      const stateRes = await fetch(`${url}/instance/connectionState/${instance}`, {
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

    console.log(`[connect/step-2] Fetching QR code from instance '${instance}'...`);
    try {
      const connectRes = await fetch(`${url}/instance/connect/${instance}`, {
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

    console.log(`[connect/step-3] Creating instance '${instance}'...`);
    try {
      const createRes = await fetch(`${url}/instance/create`, {
        method:  'POST',
        headers: evoHeaders,
        body:    JSON.stringify({
          instanceName: instance,
          token:        key,
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

    console.log(`[connect/step-4] Re-fetching QR code after creation...`);
    try {
      const retryRes = await fetch(`${url}/instance/connect/${instance}`, {
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
      { error: 'Unable to connect or create instance. Check Evolution API status.' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('[connect] Top-level crash error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
