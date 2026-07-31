import { NextResponse } from "next/server";

// ─── GET: Meta Webhook Verification Endpoint ──────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const VERIFY_TOKEN =
      process.env.WHATSAPP_VERIFY_TOKEN || "visriva_whatsapp_verify_token_2026";

    // Meta Webhook verification protocol
    if (mode === "subscribe" && (token === VERIFY_TOKEN || token === "visriva_whatsapp_verify_token_2026")) {
      console.log("✅ Meta WhatsApp Webhook Verified Successfully!");
      return new Response(challenge || "OK", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Fallback: If Meta sends request with challenge parameter
    if (challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new Response("Forbidden", { status: 403 });
  } catch (error: any) {
    console.error("Meta Webhook Verification Error:", error);
    return new Response("Internal Error", { status: 500 });
  }
}

// ─── POST: Meta Webhook Incoming Message & Event Handler ─────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if this is a WhatsApp Business Account notification
    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;

      if (changes) {
        const metadata = changes.metadata;
        const contacts = changes.contacts;
        const messages = changes.messages;
        const statuses = changes.statuses;

        // 1. Handle Incoming Customer Message
        if (messages && messages.length > 0) {
          const message = messages[0];
          const from = message.from; // Sender WhatsApp ID / Phone Number
          const messageId = message.id;
          const timestamp = message.timestamp;
          const textBody = message.text?.body || "";
          const senderName = contacts?.[0]?.profile?.name || "Customer";

          console.log(`💬 Incoming WhatsApp message from ${senderName} (${from}): "${textBody}"`);

          // TODO: Forward to AI Assistant / Concierge or update Firestore CRM lead history
        }

        // 2. Handle Message Status Receipt (Sent / Delivered / Read)
        if (statuses && statuses.length > 0) {
          const statusObj = statuses[0];
          const recipientId = statusObj.recipient_id;
          const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'

          console.log(`📬 WhatsApp delivery status update for ${recipientId}: [${status.toUpperCase()}]`);
        }
      }

      // Always return 200 OK to Meta to confirm receipt
      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    }

    return NextResponse.json({ error: "Not a whatsapp_business_account event" }, { status: 404 });
  } catch (error: any) {
    console.error("Meta Webhook Event Processing Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
