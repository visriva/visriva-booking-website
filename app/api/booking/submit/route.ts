import { NextResponse } from "next/server";
import type { BookingLead } from "@/lib/firebase";
import { notifyBookingLead } from "@/lib/bookingNotify";

export const runtime = "nodejs";

function validateLead(body: unknown): BookingLead | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!b.eventDate || !b.venue || !b.eventType || !b.pax) return null;
  return body as BookingLead;
}

export async function POST(req: Request) {
  try {
    const lead = validateLead(await req.json());
    if (!lead) {
      return NextResponse.json({ error: "Invalid booking payload" }, { status: 400 });
    }

    const { adminDb } = await import("@/lib/firebaseAdmin");
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const docRef = await adminDb.collection("bookings").add({
      ...lead,
      status: "NEW_LEAD",
      createdAt: new Date(),
      source: "reserve",
    });

    const leadId = docRef.id;
    const notifications = await notifyBookingLead(lead, leadId);

    return NextResponse.json({
      success: true,
      id: leadId,
      notifications,
    });
  } catch (err: unknown) {
    console.error("[booking/submit]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submit failed" },
      { status: 500 }
    );
  }
}
