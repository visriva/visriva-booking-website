import { NextResponse } from "next/server";
import { configureEvolutionTls } from "@/lib/evolutionApi";
import { runAiAutoReply, storeCustomerMessage } from "@/lib/whatsappAiEngine";

configureEvolutionTls();

export async function POST(req: Request) {
  try {
    const { phone, customerMessage, messageType, mediaUrl, mediaMimeType, pushName } = await req.json();

    if (!phone || !customerMessage) {
      return NextResponse.json({ error: "phone and customerMessage required" }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, "");
    console.log(`[AI Generating] manual trigger for ${cleanPhone}`);

    await storeCustomerMessage(cleanPhone, pushName || cleanPhone, customerMessage);

    const result = await runAiAutoReply(cleanPhone, customerMessage, pushName || cleanPhone);

    if (!result.replied) {
      return NextResponse.json({ error: result.reason || "AI reply failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reply: result.replyText,
      sentViaApi: result.sentViaApi,
    });
  } catch (error: any) {
    console.error("[Error] AI reply route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
