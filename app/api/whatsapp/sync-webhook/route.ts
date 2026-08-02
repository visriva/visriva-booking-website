import { NextResponse } from "next/server";

// Disable TLS verification for Railway self-hosted instances
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const EVO_URL     = (process.env.EVOLUTION_API_URL     || "https://evolution-api-production-d446.up.railway.app").replace(/\/$/, "");
const EVO_KEY     = process.env.EVOLUTION_API_KEY      || "VisrivaSecretKey2026_SecureKey";
const EVO_INST    = process.env.EVOLUTION_INSTANCE_NAME || "visriva-live";
const WEBHOOK_URL = "https://visriva.com/api/whatsapp/webhook";

export async function POST() {
  const endpoint = `${EVO_URL}/webhook/set/${EVO_INST}`;

  console.log(`[sync-webhook] Registering webhook → ${endpoint}`);
  console.log(`[sync-webhook] Payload URL: ${WEBHOOK_URL}`);

  let rawBody = "";
  let status  = 0;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVO_KEY,
      },
      body: JSON.stringify({
        webhook: {
          url:     WEBHOOK_URL,
          enabled: true,
          events:  ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
        },
      }),
    });

    status  = res.status;
    rawBody = await res.text();

    console.log(`[sync-webhook] Railway responded ${status}: ${rawBody}`);

    // Try to parse JSON — Railway returns JSON on success AND on error
    let parsed: unknown = rawBody;
    try { parsed = JSON.parse(rawBody); } catch {}

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          status,
          error:   `Railway returned ${status}`,
          detail:  parsed,
          endpoint,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success:  true,
      status,
      message:  `Webhook registered on instance '${EVO_INST}'`,
      url:      WEBHOOK_URL,
      endpoint,
      response: parsed,
    });

  } catch (err: any) {
    console.error("[sync-webhook] Fetch threw:", err);
    return NextResponse.json(
      {
        success: false,
        error:   err.message || "Network error reaching Railway",
        endpoint,
      },
      { status: 500 }
    );
  }
}
