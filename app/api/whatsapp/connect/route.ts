import { NextResponse } from "next/server";
import { configureEvolutionTls, getEvolutionConfig } from "@/lib/evolutionApi";
import { registerEvolutionWebhook } from "@/lib/registerEvolutionWebhook";
import {
  fetchEvolutionQr,
  fetchEvolutionState,
  resetEvolutionInstance,
} from "@/lib/evolutionConnect";

export const runtime = "nodejs";

configureEvolutionTls();

async function syncStatusToFirestore(status: string) {
  try {
    const { saveBotSettings } = await import("@/lib/chatStore");
    await saveBotSettings({
      connectionStatus: status,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("[connect] Status sync skipped:", e);
  }
}

function statusPayload(state: string) {
  const connected = state === "open";
  const status = connected ? "connected" : state === "connecting" ? "connecting" : "disconnected";
  return { status, connected, state };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "status";

    if (action !== "status") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const config = await getEvolutionConfig();
    const state = await fetchEvolutionState(config);
    await syncStatusToFirestore(state === "open" ? "open" : state === "connecting" ? "connecting" : "close");
    return NextResponse.json(statusPayload(state));
  } catch (error: any) {
    return NextResponse.json(
      { status: "disconnected", connected: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const config = await getEvolutionConfig();
    const body = await req.json().catch(() => ({}));
    const action: string = body.action || "connect";

    if (action === "setup_webhook") {
      const result = await registerEvolutionWebhook();
      if (!result.ok) {
        return NextResponse.json({ error: result.error, url: result.url }, { status: 500 });
      }
      return NextResponse.json({ success: true, url: result.url });
    }

    const state = await fetchEvolutionState(config);
    console.log(`[connect] state=${state}`);

    if (state === "open") {
      await registerEvolutionWebhook();
      await syncStatusToFirestore("open");
      return NextResponse.json({ connected: true, state: "open" });
    }

    let qr = await fetchEvolutionQr(config);
    console.log(`[connect] qr from connect endpoint: ${qr ? "yes" : "no"}`);

    if (!qr) {
      console.log("[connect] resetting stale instance for fresh QR...");
      qr = await resetEvolutionInstance(config);
      console.log(`[connect] qr after reset: ${qr ? "yes" : "no"}`);
    }

    if (qr) {
      await registerEvolutionWebhook();
      await syncStatusToFirestore("connecting");
      return NextResponse.json({ connected: false, base64: qr, state: "connecting" });
    }

    return NextResponse.json(
      {
        error:
          "Could not generate QR code. Evolution session may be stuck — try again in 30 seconds or reset from Railway.",
        state,
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("[connect] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
