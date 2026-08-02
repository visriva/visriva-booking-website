import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "status";
    
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "https://api.visriva.com";
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "VisrivaSecretKey2026_SecureKey";
    const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || "visriva-live";

    if (action === "status") {
      // Fetch connection status from Evolution API
      const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionStatus/${INSTANCE_NAME}`, {
        headers: { apikey: EVOLUTION_API_KEY }
      });
      
      if (!res.ok) {
        return NextResponse.json({ state: "close", status: "disconnected" });
      }

      const data = await res.json();
      return NextResponse.json({
        state: data.instance?.state || "close",
        status: data.instance?.state === "open" ? "connected" : "disconnected",
      });
    }

    if (action === "connect") {
      // Connect / Generate QR Code
      const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: { apikey: EVOLUTION_API_KEY }
      });
      
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Evolution Instance GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "https://api.visriva.com";
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "VisrivaSecretKey2026_SecureKey";
    const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || "visriva-live";

    if (action === "logout") {
      const res = await fetch(`${EVOLUTION_API_URL}/instance/logout/${INSTANCE_NAME}`, {
        method: "DELETE",
        headers: { apikey: EVOLUTION_API_KEY }
      });
      
      const data = await res.json();
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Evolution Instance POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
