import { NextResponse } from "next/server";
import { configureEvolutionTls, getEvolutionConfig, getEvolutionHeaders } from "@/lib/evolutionApi";
import { registerEvolutionWebhook } from "@/lib/registerEvolutionWebhook";

configureEvolutionTls();

async function ensureInstanceExists(config: { url: string; key: string; instance: string }) {
  try {
    let needsCreation = false;
    const checkRes = await fetch(`${config.url}/instance/connectionStatus/${config.instance}`, {
      headers: { apikey: config.key },
    });

    if (!checkRes.ok) {
      needsCreation = true;
    } else {
      const data = await checkRes.json();
      if (data.error || data.message?.includes("not found") || data.message?.includes("not exist")) {
        needsCreation = true;
      }
    }

    if (needsCreation) {
      console.log(`🔌 Evolution instance ${config.instance} not found. Re-creating...`);
      await fetch(`${config.url}/instance/create`, {
        method: "POST",
        headers: getEvolutionHeaders(config.key),
        body: JSON.stringify({
          instanceName: config.instance,
          token: config.key,
          qrcode: true,
        }),
      });
    }
  } catch (e) {
    console.warn("Failed to check or auto-create Evolution instance:", e);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "status";

    const config = await getEvolutionConfig();
    await ensureInstanceExists(config);

    if (action === "status") {
      const res = await fetch(`${config.url}/instance/connectionStatus/${config.instance}`, {
        headers: { apikey: config.key },
      });

      if (!res.ok) {
        return NextResponse.json({ state: "close", status: "disconnected", details: `HTTP error ${res.status}` });
      }

      const data = await res.json();
      return NextResponse.json({
        state: data.instance?.state || "close",
        status: data.instance?.state === "open" ? "connected" : "disconnected",
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
