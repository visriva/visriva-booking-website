import type { BlockedDatesConfig } from "@/lib/firebase";
import type { CalendarSyncSettings } from "@/lib/calendarConfig";
import { expandEventToIsoDates, parseIcalFeed } from "@/lib/parseIcal";

export interface GoogleSyncResult {
  fullyBooked: string[];
  highDemand: string[];
  notes: Record<string, string>;
  eventCount: number;
}

function parseKeywords(raw?: string): string[] {
  return (raw || "")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
}

function isHighDemand(summary: string, keywords: string[]): boolean {
  const lower = summary.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export async function fetchGoogleCalendarEvents(
  icalUrl: string,
  settings: CalendarSyncSettings
): Promise<GoogleSyncResult> {
  const res = await fetch(icalUrl, {
    headers: { "User-Agent": "Visriva-Calendar-Sync/1.0" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Google Calendar feed returned ${res.status}. Check your secret iCal URL.`);
  }

  const ics = await res.text();
  if (!ics.includes("BEGIN:VCALENDAR")) {
    throw new Error("Invalid iCal feed — paste the secret address from Google Calendar settings.");
  }

  const events = parseIcalFeed(ics);
  const keywords = parseKeywords(settings.highDemandKeywords);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setMonth(horizon.getMonth() + 18);

  const fullySet = new Set<string>();
  const highSet = new Set<string>();
  const notes: Record<string, string> = {};

  for (const event of events) {
    if (!settings.includeTimedEvents && !event.allDay) continue;

    const dates = expandEventToIsoDates(event);
    const high = isHighDemand(event.summary, keywords);

    for (const iso of dates) {
      const d = new Date(iso + "T12:00:00");
      if (d < today || d > horizon) continue;
      if (high) {
        highSet.add(iso);
        notes[iso] = event.summary;
      } else {
        fullySet.add(iso);
        notes[iso] = event.summary;
      }
    }
  }

  // Fully booked wins over high demand on same day
  for (const iso of fullySet) highSet.delete(iso);

  return {
    fullyBooked: Array.from(fullySet).sort(),
    highDemand: Array.from(highSet).sort(),
    notes,
    eventCount: events.length,
  };
}

export function mergeGoogleSyncIntoBlockedDates(
  current: BlockedDatesConfig,
  google: GoogleSyncResult
): BlockedDatesConfig {
  const prevGoogleFully = new Set(current.googleSyncedFullyBooked || []);
  const prevGoogleHigh = new Set(current.googleSyncedHighDemand || []);

  const manualFully = (current.fullyBookedDates || []).filter((d) => !prevGoogleFully.has(d));
  const manualHigh = (current.highDemandDates || []).filter((d) => !prevGoogleHigh.has(d));

  const mergedFully = Array.from(new Set([...manualFully, ...google.fullyBooked])).sort();
  const mergedHigh = Array.from(
    new Set([...manualHigh, ...google.highDemand].filter((d) => !mergedFully.includes(d)))
  ).sort();

  const blockedNotes = { ...(current.blockedNotes || {}) };
  for (const d of prevGoogleFully) {
    if (!google.fullyBooked.includes(d) && current.googleSyncedNotes?.[d]) {
      delete blockedNotes[d];
    }
  }
  for (const d of prevGoogleHigh) {
    if (!google.highDemand.includes(d) && current.googleSyncedNotes?.[d]) {
      delete blockedNotes[d];
    }
  }
  for (const [iso, note] of Object.entries(google.notes)) {
    if (google.fullyBooked.includes(iso) || google.highDemand.includes(iso)) {
      blockedNotes[iso] = note;
    }
  }

  return {
    fullyBookedDates: mergedFully,
    highDemandDates: mergedHigh,
    blockedNotes,
    googleSyncedFullyBooked: google.fullyBooked,
    googleSyncedHighDemand: google.highDemand,
    googleSyncedNotes: google.notes,
    googleLastSyncedAt: new Date().toISOString(),
  };
}
