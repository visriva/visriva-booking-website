/**
 * Smart calendar intent parser — understands date, time, event name, and reason
 * without requiring rigid "block 25 dec for X" syntax.
 */

import type { CalendarEventStatus } from "@/lib/calendarEvents";

export interface ParsedCalendarIntent {
  action: "create" | "delete";
  status: CalendarEventStatus;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10,
  dec: 11, december: 11,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function stripOrdinals(text: string): string {
  return text.replace(/\b(\d{1,2})(?:st|nd|rd|th)\b/gi, "$1");
}

function toIso(y: number, m: number, d: number): string | null {
  const dt = new Date(y, m, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return null;
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function resolveYear(month: number, day: number, year: number | undefined, ref: Date): string | null {
  let y = year ?? ref.getFullYear();
  let iso = toIso(y, month, day);
  if (!iso) return null;
  if (!year && new Date(iso + "T12:00:00") < new Date(ref.toISOString().split("T")[0] + "T00:00:00")) {
    iso = toIso(y + 1, month, day);
  }
  return iso;
}

function parseTimeToken(token: string): string | null {
  const t = token.trim().toLowerCase();
  const hm = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (hm) {
    let h = Number(hm[1]);
    const m = hm[2] ? Number(hm[2]) : 0;
    const ap = hm[3];
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    if (h > 23 || m > 59) return null;
    return `${pad(h)}:${pad(m)}`;
  }
  if (t === "morning") return "09:00";
  if (t === "afternoon") return "14:00";
  if (t === "evening") return "18:00";
  if (t === "night") return "20:00";
  return null;
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function extractStatus(text: string): { status: CalendarEventStatus; rest: string } {
  let rest = text;
  let status: CalendarEventStatus = "blocked";

  if (/^(unblock|open|free|available|clear|remove|delete)\b/i.test(rest)) {
    return { status: "blocked", rest: rest.replace(/^(unblock|open|free|available|clear|remove|delete)\s+/i, "").trim() };
  }
  if (/^(high[\s-]?demand|limited|tentative|hold|yellow)\b/i.test(rest)) {
    status = "high_demand";
    rest = rest.replace(/^(high[\s-]?demand|limited|tentative|hold|yellow)\s+/i, "").trim();
  } else {
    rest = rest.replace(/^(block|booked|full|close|closed|busy|reserve|reserved)\s+/i, "").trim();
  }
  return { status, rest };
}

function extractTimeRange(text: string): {
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  rest: string;
} {
  let rest = text;

  const range1 = rest.match(
    /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|until)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i
  );
  if (range1) {
    const startTime = parseTimeToken(range1[1]);
    const endTime = parseTimeToken(range1[2]);
    rest = rest.replace(range1[0], " ").replace(/\s+/g, " ").trim();
    if (startTime && endTime) {
      return { startTime, endTime, allDay: false, rest };
    }
  }

  const single = rest.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)|morning|afternoon|evening|night)\b/i);
  if (single) {
    const startTime = parseTimeToken(single[1]);
    rest = rest.replace(single[0], " ").replace(/\s+/g, " ").trim();
    if (startTime) {
      const [h] = startTime.split(":").map(Number);
      const endH = Math.min(h + 4, 23);
      return { startTime, endTime: `${pad(endH)}:00`, allDay: false, rest };
    }
  }

  return { allDay: true, rest };
}

function extractDates(
  text: string,
  ref: Date
): { startDate: string; endDate: string; rest: string } | null {
  const t = stripOrdinals(text.trim().toLowerCase());

  const range = t.match(
    /^(\d{1,2})\s*-\s*(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?(?:\s+(.+))?$/i
  );
  if (range) {
    const month = MONTHS[range[3].toLowerCase()];
    if (month === undefined) return null;
    const year = range[4] ? Number(range[4]) : undefined;
    const startIso = resolveYear(month, Number(range[1]), year, ref);
    const endIso = resolveYear(month, Number(range[2]), year, ref);
    if (!startIso || !endIso) return null;
    const rest = (range[5] || "").trim();
    return { startDate: startIso, endDate: endIso, rest };
  }

  const dmy = t.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?(?:\s+(.+))?$/i);
  if (dmy) {
    const month = MONTHS[dmy[2].toLowerCase()];
    if (month === undefined) return null;
    const iso = resolveYear(month, Number(dmy[1]), dmy[3] ? Number(dmy[3]) : undefined, ref);
    if (!iso) return null;
    return { startDate: iso, endDate: iso, rest: (dmy[4] || "").trim() };
  }

  const mdy = t.match(/^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?(?:\s+(.+))?$/i);
  if (mdy) {
    const month = MONTHS[mdy[1].toLowerCase()];
    if (month === undefined) return null;
    const iso = resolveYear(month, Number(mdy[2]), mdy[3] ? Number(mdy[3]) : undefined, ref);
    if (!iso) return null;
    return { startDate: iso, endDate: iso, rest: (mdy[4] || "").trim() };
  }

  const isoOnly = t.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(.+))?$/);
  if (isoOnly) {
    return { startDate: isoOnly[1], endDate: isoOnly[1], rest: (isoOnly[2] || "").trim() };
  }

  return null;
}

function buildTitle(rest: string): { title: string; description?: string } {
  let cleaned = rest
    .replace(/\b(for|because|reason|note)\s*[:=-]?\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return { title: "Blocked — Visriva" };
  }

  const parts = cleaned.split(/\s*[-–—]\s*/);
  if (parts.length >= 2 && parts[1].length > 3) {
    return { title: titleCase(parts[0]), description: parts.slice(1).join(" — ") };
  }

  const words = cleaned.split(/\s+/);
  if (words.length >= 4) {
    const title = titleCase(words.slice(0, 3).join(" "));
    const description = words.slice(3).join(" ");
    return { title, description };
  }

  return { title: titleCase(cleaned) };
}

export function parseCalendarIntent(input: string, ref = new Date()): ParsedCalendarIntent | null {
  const raw = input.trim();
  if (!raw) return null;

  const isDelete = /^(unblock|open|free|available|clear|remove|delete)\b/i.test(raw);

  let working = stripOrdinals(raw);
  const { status, rest: afterStatus } = extractStatus(working);
  working = afterStatus;

  const { startTime, endTime, allDay, rest: afterTime } = extractTimeRange(working);
  working = afterTime;

  const dates = extractDates(working, ref);
  if (!dates) return null;

  const { title, description } = buildTitle(dates.rest);

  return {
    action: isDelete ? "delete" : "create",
    status,
    title,
    description,
    startDate: dates.startDate,
    endDate: dates.endDate,
    startTime,
    endTime,
    allDay,
  };
}

/** Validate + normalize Gemini JSON output */
export function normalizeGeminiIntent(
  data: Record<string, unknown>,
  ref = new Date()
): ParsedCalendarIntent | null {
  const startDate = String(data.startDate || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null;

  const endDate = String(data.endDate || startDate);
  const status = data.status === "high_demand" ? "high_demand" : "blocked";
  const title = String(data.title || "Event").trim() || "Event";
  const description = data.description ? String(data.description).trim() : undefined;
  const allDay = data.allDay !== false;
  const startTime = !allDay && data.startTime ? String(data.startTime) : undefined;
  const endTime = !allDay && data.endTime ? String(data.endTime) : undefined;
  const action = data.action === "delete" ? "delete" : "create";

  return {
    action,
    status,
    title,
    description,
    startDate,
    endDate: /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : startDate,
    startTime,
    endTime,
    allDay,
  };
}
