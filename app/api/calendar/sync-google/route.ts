import { NextResponse } from "next/server";
import { isOperationsApiAuthorized } from "@/lib/operationsApiAuth";
import type { CalendarSyncSettings } from "@/lib/calendarConfig";
import { fetchGoogleCalendarEvents, mergeGoogleSyncIntoBlockedDates } from "@/lib/googleCalendarSync";
import type { BlockedDatesConfig } from "@/lib/firebase";
import { DEFAULT_BLOCKED_DATES } from "@/lib/firebase";
import { sanitizeBlockedDatesForFirestore } from "@/lib/calendarEvents";

export const runtime = "nodejs";

async function getSettings(): Promise<CalendarSyncSettings> {
  const { adminDb } = await import("@/lib/firebaseAdmin");
  if (!adminDb) return {};
  const snap = await adminDb.collection("config").doc("calendar_settings").get();
  return snap.exists ? (snap.data() as CalendarSyncSettings) : {};
}

async function getBlockedDates(): Promise<BlockedDatesConfig> {
  const { adminDb } = await import("@/lib/firebaseAdmin");
  if (!adminDb) return DEFAULT_BLOCKED_DATES;
  const snap = await adminDb.collection("config").doc("blocked_dates").get();
  return snap.exists
    ? { ...DEFAULT_BLOCKED_DATES, ...(snap.data() as BlockedDatesConfig) }
    : DEFAULT_BLOCKED_DATES;
}

export async function POST() {
  if (!isOperationsApiAuthorized()) {
    return NextResponse.json({ error: "Unauthorized — log in to Operations Hub" }, { status: 401 });
  }

  const settings = await getSettings();
  const icalUrl = settings.googleIcalUrl?.trim();
  if (!icalUrl) {
    return NextResponse.json(
      {
        error: "Google Calendar iCal URL not configured",
        hint: "Paste your secret iCal address in Operations → Availability → Google Calendar Sync",
      },
      { status: 400 }
    );
  }

  if (!icalUrl.startsWith("https://")) {
    return NextResponse.json({ error: "iCal URL must start with https://" }, { status: 400 });
  }

  try {
    const { adminDb } = await import("@/lib/firebaseAdmin");
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const google = await fetchGoogleCalendarEvents(icalUrl, settings);
    const current = await getBlockedDates();
    const merged = mergeGoogleSyncIntoBlockedDates(current, google);

    await adminDb.collection("config").doc("blocked_dates").set(
      sanitizeBlockedDatesForFirestore(merged),
      { merge: true }
    );
    await adminDb.collection("config").doc("calendar_settings").set(
      {
        lastSyncedAt: new Date().toISOString(),
        lastSyncEventCount: google.eventCount,
        lastSyncError: "",
        syncEnabled: true,
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      eventCount: google.eventCount,
      blocked: google.fullyBooked.length,
      highDemand: google.highDemand.length,
      syncedAt: merged.googleLastSyncedAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed";
    try {
      const { adminDb } = await import("@/lib/firebaseAdmin");
      if (adminDb) {
        await adminDb.collection("config").doc("calendar_settings").set(
          { lastSyncError: message.slice(0, 300) },
          { merge: true }
        );
      }
    } catch {
      // ignore
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
