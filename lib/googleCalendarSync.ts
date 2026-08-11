import type { BlockedDatesConfig } from "@/lib/firebase";
import type { CalendarSyncSettings } from "@/lib/calendarConfig";
import type { CalendarEvent } from "@/lib/calendarEvents";
import {
  deriveBlockedDatesFromEvents,
  migrateConfigToEvents,
  mergeConfigWithEvents,
} from "@/lib/calendarEvents";
import { expandEventToIsoDates, parseIcalFeed, type IcalEvent } from "@/lib/parseIcal";

export interface GoogleSyncResult {
  fullyBooked: string[];
  highDemand: string[];
  notes: Record<string, string>;
  events: CalendarEvent[];
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

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function icalToCalendarEvent(event: IcalEvent, status: "blocked" | "high_demand"): CalendarEvent | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setMonth(horizon.getMonth() + 18);

  const startDate = toIsoDate(event.start);
  let endDate = toIsoDate(event.end);

  if (event.allDay) {
    const endExclusive = new Date(event.end);
    endExclusive.setDate(endExclusive.getDate() - 1);
    if (endExclusive >= event.start) {
      endDate = toIsoDate(endExclusive);
    }
  }

  const d = new Date(startDate + "T12:00:00");
  if (d < today || d > horizon) return null;

  const now = new Date().toISOString();

  return {
    id: `google-${event.uid.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    title: event.summary || "Google Calendar event",
    ...(event.description ? { description: event.description } : {}),
    startDate,
    endDate: endDate >= startDate ? endDate : startDate,
    allDay: event.allDay,
    ...(!event.allDay
      ? { startTime: toTime(event.start), endTime: toTime(event.end) }
      : {}),
    status,
    source: "google",
    googleUid: event.uid,
    createdAt: now,
    updatedAt: now,
  };
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

  const parsed = parseIcalFeed(ics);
  const keywords = parseKeywords(settings.highDemandKeywords);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setMonth(horizon.getMonth() + 18);

  const fullySet = new Set<string>();
  const highSet = new Set<string>();
  const notes: Record<string, string> = {};
  const events: CalendarEvent[] = [];

  for (const event of parsed) {
    if (!settings.includeTimedEvents && !event.allDay) continue;

    const high = isHighDemand(event.summary, keywords);
    const calEv = icalToCalendarEvent(event, high ? "high_demand" : "blocked");
    if (!calEv) continue;

    events.push(calEv);

    for (const iso of expandEventToIsoDates(event)) {
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

  for (const iso of fullySet) highSet.delete(iso);

  return {
    fullyBooked: Array.from(fullySet).sort(),
    highDemand: Array.from(highSet).sort(),
    notes,
    events,
    eventCount: parsed.length,
  };
}

export function mergeGoogleSyncIntoBlockedDates(
  current: BlockedDatesConfig,
  google: GoogleSyncResult
): BlockedDatesConfig {
  const existing = migrateConfigToEvents(current);
  const manualEvents = existing.filter((e) => e.source !== "google");
  const mergedEvents = [...manualEvents, ...google.events];

  const base = mergeConfigWithEvents(current, mergedEvents);

  return {
    ...base,
    googleSyncedFullyBooked: google.fullyBooked,
    googleSyncedHighDemand: google.highDemand,
    googleSyncedNotes: google.notes,
    googleLastSyncedAt: new Date().toISOString(),
  };
}
