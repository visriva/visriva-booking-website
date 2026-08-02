import { NextResponse } from 'next/server';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function POST() {
  const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'visriva-live';
  const webhookUrl = 'https://visriva.com/api/whatsapp/webhook';

  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const endpoint = `${baseUrl}/webhook/set/${instanceName}`;

  try {
    console.log(`[sync-webhook] Setting webhook for '${instanceName}' to '${webhookUrl}'...`);
    console.log(`[sync-webhook] Endpoint: ${endpoint}`);
    console.log(`[sync-webhook] API Key (first 8 chars): ${apiKey.slice(0, 8)}...`);

    // Note: Evolution API v2 requires 'apikey' (lowercase) in headers
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        webhook: {
          url: webhookUrl,
          enabled: true,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_SET',
            'CONNECTION_UPDATE',
          ],
        },
      }),
    });

    const responseText = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }

    console.log('[sync-webhook] Railway response status:', res.status);
    console.log('[sync-webhook] Railway response body:', responseText);

    if (!res.ok) {
      return NextResponse.json({
        error: `Railway returned HTTP ${res.status}`,
        details: data,
        status: res.status,
        endpoint,
        apiKeyHint: `${apiKey.slice(0, 8)}...`,
      }, { status: res.status });
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
