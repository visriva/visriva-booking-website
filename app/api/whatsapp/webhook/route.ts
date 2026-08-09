import { NextResponse } from "next/server";
import { configureEvolutionTls } from "@/lib/evolutionApi";
import { processInboundWhatsApp } from "@/lib/whatsappInbound";
import { saveBotSettings } from "@/lib/chatStore";
import { getMetaConfig, verifyMetaWebhookChallenge } from "@/lib/metaWhatsApp";

export const runtime = "nodejs";

configureEvolutionTls();

export const maxDuration = 60;

/** Meta webhook verification OR health check. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const meta = getMetaConfig();

  if (meta) {
    const challenge = verifyMetaWebhookChallenge(searchParams, meta.verifyToken);
    if (challenge) {
      console.log("[Webhook] Meta verification OK");
      return new NextResponse(challenge, { status: 200 });
    }
  }

  return NextResponse.json({
    status: "online",
    webhook: "/api/whatsapp/webhook",
    metaConfigured: !!meta,
    evolutionConfigured: !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ status: "success", note: "empty body" });
    }

    // ── Meta Cloud API inbound ───────────────────────────────────────────────
    if (body.object === "whatsapp_business_account") {
      const result = await processInboundWhatsApp(body, { skipAi: true });
      return NextResponse.json({ status: "success", source: "meta", ...result });
    }

    // ── Evolution API inbound ──────────────────────────────────────────────
    const event = String(body?.event || body?.type || "").toUpperCase().replace(/\./g, "_");
    if (event.includes("CONNECTION")) {
      const state = body?.data?.state || body?.data?.instance?.state || body?.state;
      console.log(`[Client Connected] connection event — state=${state}`);
      if (state === "open") {
        await saveBotSettings({ connectionStatus: "open", lastSyncedAt: new Date().toISOString() });
      } else if (state === "close") {
        await saveBotSettings({ connectionStatus: "close", lastSyncedAt: new Date().toISOString() });
      }
      return NextResponse.json({ status: "success", note: "connection_event" });
    }

    const result = await processInboundWhatsApp(body, { skipAi: true });
    return NextResponse.json({ status: "success", source: "evolution", ...result });
  } catch (error: any) {
    console.error("[Error] webhook:", error?.message || error);
    return NextResponse.json({ status: "success", error: error?.message });
  }
}
