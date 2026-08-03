import { NextResponse } from 'next/server';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const EVO_URL      = (process.env.EVOLUTION_API_URL      || 'https://evolution-api-production-d446.up.railway.app').replace(/\/$/, '');
const EVO_KEY      = process.env.EVOLUTION_API_KEY       || 'VisrivaSecretKey2026_SecureKey';
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'visriva-live';
const WEBHOOK_URL  = 'https://visriva.com/api/whatsapp/webhook';

export async function POST() {
  const endpoint = `${EVO_URL}/webhook/set/${EVO_INSTANCE}`;

  console.log(`[sync-webhook] Setting webhook for '${EVO_INSTANCE}' → '${WEBHOOK_URL}'`);
  console.log(`[sync-webhook] Endpoint: ${endpoint}`);
  console.log(`[sync-webhook] API Key prefix: ${EVO_KEY.slice(0, 8)}...`);

  if (!EVO_URL || !EVO_KEY) {
    return NextResponse.json({ error: 'Missing EVOLUTION_API_URL or EVOLUTION_API_KEY env vars' }, { status: 500 });
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Evolution API v2 accepts both header formats
        'apikey':        EVO_KEY,
        'Authorization': `Bearer ${EVO_KEY}`,
      },
      body: JSON.stringify({
        webhook: {
          url:     WEBHOOK_URL,
          enabled: true,
          events:  ['MESSAGES_UPSERT', 'MESSAGES_SET', 'CONNECTION_UPDATE'],
        },
      }),
    });

    const responseText = await res.text();
    let data: unknown;
    try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }

    console.log(`[sync-webhook] Railway responded ${res.status}:`, responseText);

    if (!res.ok) {
      return NextResponse.json(
        {
          error:      `Railway returned HTTP ${res.status}`,
          details:    data,
          status:     res.status,
          endpoint,
          apiKeyHint: `${EVO_KEY.slice(0, 8)}...`,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success:  true,
      message:  `Webhook registered for instance '${EVO_INSTANCE}'`,
      url:      WEBHOOK_URL,
      endpoint,
      response: data,
    });

  } catch (error: any) {
    console.error('[sync-webhook] Fetch threw:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
