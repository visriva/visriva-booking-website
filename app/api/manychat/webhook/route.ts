import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  parseManyChatPayload,
  toBookingLead,
  verifyManyChatWebhookSecret,
  getManyChatWebhookSecret,
  type ManyChatWebhookPayload,
} from "@/lib/manychatLead";
import { notifyInstagramLead } from "@/lib/instagramLeadNotify";

export const runtime = "nodejs";

const SUBSCRIBER_INDEX_COLLECTION = "manychat_subscribers";

export async function GET() {
  const secretConfigured = !!getManyChatWebhookSecret();
  return NextResponse.json({
    ok: true,
    endpoint: "/api/manychat/webhook",
    secretConfigured,
    webhookUrl: secretConfigured
      ? "https://www.visriva.com/api/manychat/webhook?secret=YOUR_SECRET"
      : "Set MANYCHAT_WEBHOOK_SECRET on Vercel first",
    docs: "/docs/marketing/manychat-firestore-setup.md",
  });
}

export async function POST(req: Request) {
  if (!verifyManyChatWebhookSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ManyChatWebhookPayload;
  try {
    body = (await req.json()) as ManyChatWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseManyChatPayload(body);
  if (!parsed) {
    return NextResponse.json(
      { error: "Missing subscriber id — include subscriber_id or id in payload" },
      { status: 400 }
    );
  }

  const { adminDb } = await import("@/lib/firebaseAdmin");
  if (!adminDb) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const lead = toBookingLead(parsed);
  const indexRef = adminDb.collection(SUBSCRIBER_INDEX_COLLECTION).doc(parsed.manychatSubscriberId);
  const indexSnap = await indexRef.get();

  let leadId: string;
  let isNew = false;

  if (indexSnap.exists) {
    leadId = String(indexSnap.data()?.bookingId || "");
    const existingRef = adminDb.collection("bookings").doc(leadId);
    const existingSnap = await existingRef.get();

    if (existingSnap.exists) {
      const existing = existingSnap.data() as Record<string, unknown>;
      const mergedNotes = [existing.leadNotes, lead.leadNotes].filter(Boolean).join("\n---\n");

      await existingRef.set(
        {
          clientName: lead.clientName || existing.clientName,
          clientPhone: lead.clientPhone || existing.clientPhone,
          clientEmail: lead.clientEmail || existing.clientEmail,
          eventDate: lead.eventDate !== "TBD" ? lead.eventDate : existing.eventDate,
          venue: lead.venue !== "TBD" ? lead.venue : existing.venue,
          eventType: lead.eventType || existing.eventType,
          pax: lead.pax && lead.pax > 0 ? lead.pax : existing.pax,
          leadKeyword: lead.leadKeyword || existing.leadKeyword,
          leadNotes: mergedNotes || existing.leadNotes,
          instagramUsername: lead.instagramUsername || existing.instagramUsername,
          manychatLiveChatUrl: lead.manychatLiveChatUrl || existing.manychatLiveChatUrl,
          profilePicUrl: lead.profilePicUrl || existing.profilePicUrl,
          source: "instagram_manychat",
          updatedAt: FieldValue.serverTimestamp(),
          lastManyChatAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      const docRef = await adminDb.collection("bookings").add({
        ...lead,
        createdAt: FieldValue.serverTimestamp(),
        lastManyChatAt: FieldValue.serverTimestamp(),
      });
      leadId = docRef.id;
      isNew = true;
      await indexRef.set({ bookingId: leadId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
  } else {
    const docRef = await adminDb.collection("bookings").add({
      ...lead,
      createdAt: FieldValue.serverTimestamp(),
      lastManyChatAt: FieldValue.serverTimestamp(),
    });
    leadId = docRef.id;
    isNew = true;
    await indexRef.set({
      bookingId: leadId,
      instagramUsername: lead.instagramUsername || null,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  const notifications = await notifyInstagramLead(lead, leadId, parsed, { isNew });

  return NextResponse.json({
    success: true,
    id: leadId,
    isNew,
    manychatSubscriberId: parsed.manychatSubscriberId,
    notifications,
  });
}
