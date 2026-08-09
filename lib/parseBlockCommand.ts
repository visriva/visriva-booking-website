/** Parse natural-language availability commands for admin calendar. */

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso(y: number, m: number, d: number): string | null {
  const dt = new Date(y, m, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return null;
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseOneDate(token: string, ref: Date): string | null {
  const t = token.trim().toLowerCase();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;

  // 25 dec 2026 / 25 december / dec 25
  const dmy = t.match(/^(\d{1,2})[\s\-/]+([a-z]+)(?:[\s\-/]+(\d{4}))?$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = MONTHS[dmy[2]];
    if (month === undefined) return null;
    let year = dmy[3] ? Number(dmy[3]) : ref.getFullYear();
    const candidate = toIso(year, month, day);
    if (!candidate) return null;
    if (!dmy[3] && new Date(candidate) < ref) {
      return toIso(year + 1, month, day);
    }
    return candidate;
  }

  const mdy = t.match(/^([a-z]+)[\s\-/]+(\d{1,2})(?:[\s\-/]+(\d{4}))?$/);
  if (mdy) {
    const month = MONTHS[mdy[1]];
    if (month === undefined) return null;
    const day = Number(mdy[2]);
    let year = mdy[3] ? Number(mdy[3]) : ref.getFullYear();
    const candidate = toIso(year, month, day);
    if (!candidate) return null;
    if (!mdy[3] && new Date(candidate) < ref) {
      return toIso(year + 1, month, day);
    }
    return candidate;
  }

  return null;
}

export type BlockCommandAction = "block" | "unblock" | "high_demand";

export interface ParsedBlockCommand {
  action: BlockCommandAction;
  dates: string[];
  note?: string;
}

export function parseBlockCommand(input: string, ref = new Date()): ParsedBlockCommand | null {
  const raw = input.trim();
  if (!raw) return null;

  let action: BlockCommandAction = "block";
  let rest = raw.toLowerCase();

  if (/^unblock\b|^open\b|^free\b|^available\b/.test(rest)) {
    action = "unblock";
    rest = rest.replace(/^(unblock|open|free|available)\s+/i, "");
  } else if (/^high[\s-]?demand\b|^limited\b|^yellow\b/.test(rest)) {
    action = "high_demand";
    rest = rest.replace(/^(high[\s-]?demand|limited|yellow)\s+/i, "");
  } else {
    rest = rest.replace(/^(block|booked|full|close|closed|busy|red)\s+/i, "");
  }

  // Range: 10-12 dec 2026
  const range = rest.match(
    /^(\d{1,2})\s*-\s*(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?(?:\s+(.+))?$/i
  );
  if (range) {
    const month = MONTHS[range[3].toLowerCase()];
    if (month === undefined) return null;
    const year = range[4] ? Number(range[4]) : ref.getFullYear();
    const start = Number(range[1]);
    const end = Number(range[2]);
    const dates: string[] = [];
    for (let d = start; d <= end; d++) {
      const iso = toIso(year, month, d);
      if (iso) dates.push(iso);
    }
    if (!dates.length) return null;
    return { action, dates, note: range[5]?.trim() };
  }

  // Split on "and" / commas
  const parts = rest.split(/\s+and\s+|,\s*/i).map((p) => p.trim()).filter(Boolean);
  const dates: string[] = [];
  let note: string | undefined;

  for (const part of parts) {
    const withNote = part.match(/^(.+?)\s+(?:for|because|note)\s+(.+)$/i);
    const datePart = withNote ? withNote[1] : part;
    if (withNote?.[2]) note = withNote[2].trim();
    const iso = parseOneDate(datePart, ref);
    if (iso) dates.push(iso);
  }

  if (!dates.length) return null;
  return { action, dates: Array.from(new Set(dates)), note };
}

export function googleCalendarBlockUrl(dateIso: string, title = "Visriva — Fully Booked"): string {
  const start = dateIso.replace(/-/g, "");
  const endDate = new Date(dateIso + "T12:00:00");
  endDate.setDate(endDate.getDate() + 1);
  const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details: "Blocked on Visriva admin calendar — crew unavailable",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
