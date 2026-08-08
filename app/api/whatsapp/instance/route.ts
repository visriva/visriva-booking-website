import { NextResponse } from "next/server";
import { configureEvolutionTls, getEvolutionConfig, getEvolutionHeaders } from "@/lib/evolutionApi";
import { registerEvolutionWebhook } from "@/lib/registerEvolutionWebhook";
import { fetchEvolutionState, resetEvolutionInstance } from "@/lib/evolutionConnect";

configureEvolutionTls();

async function ensureInstanceExists(config: { url: string; key: string; instance: string }) {
  const state = await fetchEvolutionState(config);
  if (state === "unknown" || state === "close") {
    console.log(`🔌 Evolution instance ${config.instance} missing or closed — recreating...`);
    await resetEvolutionInstance(config);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "status";

    const config = await getEvolutionConfig();
    await ensureInstanceExists(config);

    if (action === "status") {
      const state = await fetchEvolutionState(config);
      return NextResponse.json({
        state,
        status: state === "open" ? "connected" : state === "connecting" ? "connecting" : "disconnected",
      });
    }

    if (action === "connect") {
      const webhookResult = await registerEvolutionWebhook(req.headers.get("host"));
      if (!webhookResult.ok) {
        console.warn("Webhook registration warning:", webhookResult.error);
      }

      const res = await fetch(`${config.url}/instance/connect/${config.instance}`, {
        headers: { apikey: config.key },
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Evolution server connect failed (${res.status}): ${errText.slice(0, 100)}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Evolution Instance GET Error:", error);
    return NextResponse.json({ error: error.message || "Failed to reach Evolution server" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    const config = await getEvolutionConfig();

    if (action === "logout") {
      const res = await fetch(`${config.url}/instance/logout/${config.instance}`, {
        method: "DELETE",
        headers: { apikey: config.key },
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `Evolution logout failed (${res.status}): ${errText}` }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Evolution Instance POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
