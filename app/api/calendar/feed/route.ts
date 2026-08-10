import { NextResponse } from "next/server";
import { buildIcalExport } from "@/lib/parseIcal";
import { DEFAULT_BLOCKED_DATES, type BlockedDatesConfig } from "@/lib/firebase";
import type { CalendarSyncSettings } from "@/lib/calendarConfig";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim();

  const { adminDb } = await import("@/lib/firebaseAdmin");
  if (!adminDb) {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  const settingsSnap = await adminDb.collection("config").doc("calendar_settings").get();
  const settings = settingsSnap.exists ? (settingsSnap.data() as CalendarSyncSettings) : {};
  const expected = settings.exportFeedToken?.trim();

  if (!expected || token !== expected) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const blockedSnap = await adminDb.collection("config").doc("blocked_dates").get();
  const blocked: BlockedDatesConfig = blockedSnap.exists
    ? { ...DEFAULT_BLOCKED_DATES, ...(blockedSnap.data() as BlockedDatesConfig) }
    : DEFAULT_BLOCKED_DATES;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.visriva.com";
  const ics = buildIcalExport({
    events: blocked.events,
    fullyBookedDates: blocked.fullyBookedDates || [],
    highDemandDates: blocked.highDemandDates || [],
    notes: blocked.blockedNotes,
    siteUrl,
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="visriva-availability.ics"',
      "Cache-Control": "public, max-age=300",
    },
  });
}
