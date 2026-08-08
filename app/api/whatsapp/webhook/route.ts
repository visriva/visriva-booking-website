import { NextResponse } from "next/server";
import { configureEvolutionTls } from "@/lib/evolutionApi";
import { processInboundWhatsApp } from "@/lib/whatsappInbound";
import { saveBotSettings } from "@/lib/chatStore";

export const runtime = "nodejs";

configureEvolutionTls();

export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({ status: "online", webhook: "/api/whatsapp/webhook" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ status: "success", note: "empty body" });
    }

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

    // Keyword replies only in webhook — keeps under Vercel Hobby 10s limit. AI runs via /api/ai-agent/reply.
    const result = await processInboundWhatsApp(body, { skipAi: true });
    return NextResponse.json({ status: "success", ...result });
  } catch (error: any) {
    console.error("[Error] webhook:", error?.message || error);
    return NextResponse.json({ status: "success", error: error?.message });
  }
}
