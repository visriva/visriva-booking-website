import { NextResponse } from 'next/server';
import { configureEvolutionTls, getEvolutionConfig, getEvolutionHeaders, getWebhookUrl } from '@/lib/evolutionApi';

configureEvolutionTls();

export async function POST() {
  try {
    const { url, key, instance } = await getEvolutionConfig();
    const webhookUrl = getWebhookUrl();
    const endpoint = `${url}/webhook/set/${instance}`;

    console.log(`[sync-webhook] Setting webhook for '${instance}' → '${webhookUrl}'`);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...getEvolutionHeaders(key),
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        webhook: {
          url:     webhookUrl,
          enabled: true,
          events:  ['MESSAGES_UPSERT', 'MESSAGES_SET', 'CONNECTION_UPDATE'],
        },
      }),
      signal: AbortSignal.timeout(8000),
    });

    const responseText = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          error:   `Evolution API returned HTTP ${res.status}`,
          details: data,
          status:  res.status,
          endpoint,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success:  true,
      response: data,
      url:      webhookUrl,
      endpoint,
    });

  } catch (error: any) {
    console.error('[sync-webhook] Top-level sync-webhook error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
