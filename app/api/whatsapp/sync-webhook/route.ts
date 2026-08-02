import { NextResponse } from 'next/server';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function POST() {
  const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'visriva-live';
  const webhookUrl = 'https://visriva.com/api/whatsapp/webhook';

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: 'Missing environment variables: EVOLUTION_API_URL or EVOLUTION_API_KEY' }, { status: 500 });
  }

  const endpoint = `${baseUrl}/webhook/set/${instanceName}`;

  try {
    console.log(`[sync-webhook] Setting webhook for '${instanceName}' → '${webhookUrl}'`);
    console.log(`[sync-webhook] Endpoint: ${endpoint}`);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify({
        webhook: {
          url: webhookUrl,
          enabled: true,
          events: ['MESSAGES_UPSERT', 'MESSAGES_SET'],
        },
      }),
    });

    const rawText = await res.text();
    console.log(`[sync-webhook] Railway responded ${res.status}: ${rawText}`);

    let data: unknown = rawText;
    try { data = JSON.parse(rawText); } catch {}

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to set webhook on Railway', details: data, status: res.status },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Webhook registered for instance '${instanceName}'`,
      url: webhookUrl,
      endpoint,
      response: data,
    });
  } catch (error: any) {
    console.error('[sync-webhook] Fetch threw:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
