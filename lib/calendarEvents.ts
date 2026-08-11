/**
 * Visriva operations calendar — rich events (Google Calendar–style).
 * Derives legacy blocked-date arrays for /reserve compatibility.
 */

export type CalendarEventStatus = "blocked" | "high_demand";
export type CalendarEventSource = "manual" | "google" | "command";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  /** YYYY-MM-DD inclusive */
  startDate: string;
  /** YYYY-MM-DD inclusive */
  endDate: string;
  /** HH:mm 24h — omit when allDay */
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  status: CalendarEventStatus;
  source: CalendarEventSource;
  googleUid?: string;
  createdAt: string;
  updatedAt: string;
}

export function newEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function expandDateRange(startDate: string, endDate: string): string[] {
  const out: string[] = [];
  const cursor = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime())) return out;
  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** Build legacy blocked arrays from rich events (for /reserve). */
export function deriveBlockedDatesFromEvents(events: CalendarEvent[]): {
  fullyBookedDates: string[];
  highDemandDates: string[];
  blockedNotes: Record<string, string>;
} {
  const fullySet = new Set<string>();
  const highSet = new Set<string>();
  const notes: Record<string, string> = {};

  const sorted = [...events].sort(
    (a, b) => a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
  );

  for (const ev of sorted) {
    const label = formatEventLabel(ev);
    for (const iso of expandDateRange(ev.startDate, ev.endDate)) {
      if (ev.status === "blocked") {
        fullySet.add(iso);
        highSet.delete(iso);
      } else if (!fullySet.has(iso)) {
        highSet.add(iso);
      }
      notes[iso] = label;
    }
  }

  return {
    fullyBookedDates: Array.from(fullySet).sort(),
    highDemandDates: Array.from(highSet).sort(),
    blockedNotes: notes,
  };
}

export function formatEventLabel(ev: CalendarEvent): string {
  const time =
    !ev.allDay && ev.startTime
      ? ` ${ev.startTime}${ev.endTime ? `–${ev.endTime}` : ""}`
      : "";
  const base = `${ev.title}${time}`;
  if (ev.description?.trim()) {
    return `${base} — ${ev.description.trim()}`;
  }
  return base;
}

export function formatEventTimeRange(ev: CalendarEvent): string {
  if (ev.allDay) return "All day";
  if (ev.startTime && ev.endTime) return `${ev.startTime} – ${ev.endTime}`;
  if (ev.startTime) return `From ${ev.startTime}`;
  return "Timed";
}

/** One-time migration from date-only blocked lists. */
export function migrateConfigToEvents(config: {
  events?: CalendarEvent[];
  fullyBookedDates?: string[];
  highDemandDates?: string[];
  blockedNotes?: Record<string, string>;
}): CalendarEvent[] {
  if (config.events?.length) return config.events;

  const events: CalendarEvent[] = [];
  const now = new Date().toISOString();

  for (const iso of config.fullyBookedDates || []) {
    events.push({
      id: `legacy-block-${iso}`,
      title: config.blockedNotes?.[iso] || "Fully Booked",
      startDate: iso,
      endDate: iso,
      allDay: true,
      status: "blocked",
      source: "manual",
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const iso of config.highDemandDates || []) {
    if (events.some((e) => expandDateRange(e.startDate, e.endDate).includes(iso))) continue;
    events.push({
      id: `legacy-high-${iso}`,
      title: config.blockedNotes?.[iso] || "High Demand",
      startDate: iso,
      endDate: iso,
      allDay: true,
      status: "high_demand",
      source: "manual",
      createdAt: now,
      updatedAt: now,
    });
  }

  return events;
}

export function mergeConfigWithEvents(
  config: {
    events?: CalendarEvent[];
    fullyBookedDates?: string[];
    highDemandDates?: string[];
    blockedNotes?: Record<string, string>;
    googleSyncedFullyBooked?: string[];
    googleSyncedHighDemand?: string[];
    googleSyncedNotes?: Record<string, string>;
    googleLastSyncedAt?: string;
  },
  events: CalendarEvent[]
): {
  events: CalendarEvent[];
  fullyBookedDates: string[];
  highDemandDates: string[];
  blockedNotes: Record<string, string>;
  googleSyncedFullyBooked?: string[];
  googleSyncedHighDemand?: string[];
  googleSyncedNotes?: Record<string, string>;
  googleLastSyncedAt?: string;
} {
  const derived = deriveBlockedDatesFromEvents(events);
  return {
    events: events.map(sanitizeCalendarEvent),
    ...derived,
    googleSyncedFullyBooked: config.googleSyncedFullyBooked,
    googleSyncedHighDemand: config.googleSyncedHighDemand,
    googleSyncedNotes: config.googleSyncedNotes,
    googleLastSyncedAt: config.googleLastSyncedAt,
  };
}

export function eventsOnDate(events: CalendarEvent[], iso: string): CalendarEvent[] {
  return events.filter(
    (e) => e.startDate <= iso && e.endDate >= iso
  );
}

export function googleCalendarEventUrl(ev: CalendarEvent): string {
  const title = encodeURIComponent(ev.title);
  const details = encodeURIComponent(
    [
      ev.description?.trim(),
      ev.status === "high_demand" ? "Status: High demand on Visriva booking calendar" : "Status: Fully booked — crew unavailable",
      "Managed in Visriva Operations Hub",
    ]
      .filter(Boolean)
      .join("\n\n")
  );

  const pad = (n: number) => String(n).padStart(2, "0");

  if (ev.allDay) {
    const start = ev.startDate.replace(/-/g, "");
    const endD = new Date(ev.endDate + "T12:00:00");
    endD.setDate(endD.getDate() + 1);
    const end = `${endD.getFullYear()}${pad(endD.getMonth() + 1)}${pad(endD.getDate())}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  }

  const [sy, sm, sd] = ev.startDate.split("-").map(Number);
  const [sh, smin] = (ev.startTime || "09:00").split(":").map(Number);
  const [ey, em, ed] = ev.endDate.split("-").map(Number);
  const [eh, emin] = (ev.endTime || ev.startTime || "18:00").split(":").map(Number);

  const start = `${sy}${pad(sm)}${pad(sd)}T${pad(sh)}${pad(smin)}00`;
  const end = `${ey}${pad(em)}${pad(ed)}T${pad(eh)}${pad(emin)}00`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

/** Strip optional fields Firestore rejects (undefined) from a calendar event. */
export function sanitizeCalendarEvent(ev: CalendarEvent): CalendarEvent {
  return omitUndefined({ ...ev });
}

/** Prepare blocked-dates config for Firestore writes (deep strip of undefined). */
export function sanitizeBlockedDatesForFirestore<T>(config: T): T {
  return JSON.parse(JSON.stringify(config)) as T;
}
