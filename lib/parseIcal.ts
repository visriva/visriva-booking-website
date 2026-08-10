/** Minimal ICS parser for Google Calendar feeds (VEVENT only). */

export interface IcalEvent {
  uid: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
}

function unfoldLines(ics: string): string[] {
  const raw = ics.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines: string[] = [];
  for (const line of raw) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function parseIcalDate(value: string, params: string): { date: Date; allDay: boolean } | null {
  const allDay = /VALUE=DATE/i.test(params) || /^\d{8}$/.test(value);
  if (allDay) {
    const v = value.replace(/[^0-9]/g, "").slice(0, 8);
    if (v.length !== 8) return null;
    const y = Number(v.slice(0, 4));
    const m = Number(v.slice(4, 6)) - 1;
    const d = Number(v.slice(6, 8));
    return { date: new Date(y, m, d, 12, 0, 0), allDay: true };
  }

  const clean = value.replace(/[^0-9TZ]/gi, "");
  if (clean.length < 8) return null;

  const y = Number(clean.slice(0, 4));
  const mo = Number(clean.slice(4, 6)) - 1;
  const d = Number(clean.slice(6, 8));
  const h = clean.length >= 10 ? Number(clean.slice(9, 11)) : 0;
  const min = clean.length >= 12 ? Number(clean.slice(11, 13)) : 0;
  const sec = clean.length >= 14 ? Number(clean.slice(13, 15)) : 0;

  if (value.endsWith("Z") || /TZID=UTC/i.test(params)) {
    return { date: new Date(Date.UTC(y, mo, d, h, min, sec)), allDay: false };
  }
  return { date: new Date(y, mo, d, h, min, sec), allDay: false };
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Expand event to each calendar day it occupies (inclusive start, exclusive end for all-day). */
export function expandEventToIsoDates(event: IcalEvent): string[] {
  const dates: string[] = [];
  if (event.allDay) {
    const cursor = new Date(event.start);
    const end = new Date(event.end);
    while (cursor < end) {
      dates.push(toIsoDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    if (!dates.length) dates.push(toIsoDate(event.start));
    return dates;
  }

  return [toIsoDate(event.start)];
}

export function parseIcalFeed(ics: string): IcalEvent[] {
  const lines = unfoldLines(ics);
  const events: IcalEvent[] = [];
  let inEvent = false;
  let current: Partial<IcalEvent> & { dtStartRaw?: string; dtStartParams?: string; dtEndRaw?: string; dtEndParams?: string; description?: string } =
    {};

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current.dtStartRaw) {
        const start = parseIcalDate(current.dtStartRaw, current.dtStartParams || "");
        const end = current.dtEndRaw
          ? parseIcalDate(current.dtEndRaw, current.dtEndParams || "")
          : start;
        if (start) {
          events.push({
            uid: current.uid || `evt-${events.length}`,
            summary: current.summary || "Busy",
            description: current.description,
            start: start.date,
            end: end?.date || start.date,
            allDay: start.allDay,
          });
        }
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const left = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const key = left.split(";")[0].toUpperCase();

    if (key === "UID") current.uid = value;
    if (key === "SUMMARY") current.summary = value.replace(/\\n/g, " ").replace(/\\,/g, ",");
    if (key === "DESCRIPTION") {
      current.description = value.replace(/\\n/g, "\n").replace(/\\,/g, ",");
    }
    if (key === "DTSTART") {
      current.dtStartRaw = value;
      current.dtStartParams = left;
    }
    if (key === "DTEND") {
      current.dtEndRaw = value;
      current.dtEndParams = left;
    }
  }

  return events;
}

import type { CalendarEvent } from "@/lib/calendarEvents";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIcalUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T` +
    `${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

export function buildIcalExport(options: {
  events?: CalendarEvent[];
  fullyBookedDates: string[];
  highDemandDates: string[];
  notes?: Record<string, string>;
  siteUrl?: string;
}): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Visriva Live Station//Availability//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Visriva Operations Calendar",
  ];

  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  const addRichEvent = (ev: CalendarEvent) => {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:visriva-${ev.id}@visriva.com`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`SUMMARY:${esc(ev.title)}`);
    if (ev.description?.trim()) lines.push(`DESCRIPTION:${esc(ev.description.trim())}`);
    lines.push(`CATEGORIES:${ev.status === "high_demand" ? "HIGH_DEMAND" : "BLOCKED"}`);

    if (ev.allDay) {
      const start = ev.startDate.replace(/-/g, "");
      const endD = new Date(ev.endDate + "T12:00:00");
      endD.setDate(endD.getDate() + 1);
      const end = `${endD.getFullYear()}${pad2(endD.getMonth() + 1)}${pad2(endD.getDate())}`;
      lines.push(`DTSTART;VALUE=DATE:${start}`);
      lines.push(`DTEND;VALUE=DATE:${end}`);
    } else {
      const [sy, sm, sd] = ev.startDate.split("-").map(Number);
      const [sh, smin] = (ev.startTime || "09:00").split(":").map(Number);
      const [ey, em, ed] = ev.endDate.split("-").map(Number);
      const [eh, emin] = (ev.endTime || ev.startTime || "18:00").split(":").map(Number);
      const startDt = new Date(Date.UTC(sy, sm - 1, sd, sh - 5, smin)); // IST approx for export
      const endDt = new Date(Date.UTC(ey, em - 1, ed, eh - 5, emin));
      lines.push(`DTSTART:${toIcalUtc(startDt)}`);
      lines.push(`DTEND:${toIcalUtc(endDt)}`);
    }

    if (options.siteUrl) lines.push(`URL:${options.siteUrl}/reserve`);
    lines.push("END:VEVENT");
  };

  if (options.events?.length) {
    for (const ev of options.events) addRichEvent(ev);
  } else {
    const addEvent = (iso: string, title: string, color?: string) => {
      const start = iso.replace(/-/g, "");
      const endDate = new Date(iso + "T12:00:00");
      endDate.setDate(endDate.getDate() + 1);
      const end = `${endDate.getFullYear()}${pad2(endDate.getMonth() + 1)}${pad2(endDate.getDate())}`;
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:visriva-block-${iso}@visriva.com`);
      lines.push(`DTSTAMP:${now}`);
      lines.push(`DTSTART;VALUE=DATE:${start}`);
      lines.push(`DTEND;VALUE=DATE:${end}`);
      lines.push(`SUMMARY:${esc(title)}`);
      if (color) lines.push(`CATEGORIES:${color}`);
      if (options.siteUrl) lines.push(`URL:${options.siteUrl}/reserve`);
      lines.push("END:VEVENT");
    };

    for (const iso of options.fullyBookedDates) {
      addEvent(iso, options.notes?.[iso] || "Visriva — Fully Booked", "BLOCKED");
    }
    for (const iso of options.highDemandDates) {
      if (options.fullyBookedDates.includes(iso)) continue;
      addEvent(iso, options.notes?.[iso] || "Visriva — High Demand", "HIGH_DEMAND");
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
