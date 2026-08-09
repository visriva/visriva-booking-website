"use client";

import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mic,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { BlockedDatesConfig } from "@/lib/firebase";
import { saveBlockedDates } from "@/lib/firebase";
import { parseBlockCommand, googleCalendarBlockUrl } from "@/lib/parseBlockCommand";

type DayStatus = "available" | "blocked" | "high_demand";

interface Props {
  config: BlockedDatesConfig;
  onConfigChange: (config: BlockedDatesConfig) => void;
  onToast: (msg: string, isError?: boolean) => void;
}

function getDayStatus(dateIso: string, config: BlockedDatesConfig): DayStatus {
  if (config.fullyBookedDates?.includes(dateIso)) return "blocked";
  if (config.highDemandDates?.includes(dateIso)) return "high_demand";
  return "available";
}

function buildCalendarDays(year: number, month: number): Array<{ iso: string | null; day: number }> {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ iso: string | null; day: number }> = [];

  for (let i = 0; i < startPad; i++) cells.push({ iso: null, day: 0 });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ iso, day: d });
  }
  return cells;
}

export default function AvailabilityCalendar({ config, onConfigChange, onToast }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [command, setCommand] = useState("");
  const [saving, setSaving] = useState(false);
  const [noteInput, setNoteInput] = useState("");

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const cells = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const persist = async (next: BlockedDatesConfig, msg: string) => {
    setSaving(true);
    onConfigChange(next);
    const res = await saveBlockedDates(next);
    setSaving(false);
    if (res.success) onToast(msg);
    else onToast(res.error || "Save failed", true);
  };

  const cycleDay = async (iso: string) => {
    const status = getDayStatus(iso, config);
    let next: BlockedDatesConfig = {
      fullyBookedDates: [...(config.fullyBookedDates || [])],
      highDemandDates: [...(config.highDemandDates || [])],
      blockedNotes: { ...(config.blockedNotes || {}) },
    };

    next.fullyBookedDates = next.fullyBookedDates.filter((d) => d !== iso);
    next.highDemandDates = next.highDemandDates.filter((d) => d !== iso);

    if (status === "available") {
      next.fullyBookedDates.push(iso);
      if (noteInput.trim()) {
        next.blockedNotes![iso] = noteInput.trim();
      }
    } else if (status === "blocked") {
      next.highDemandDates.push(iso);
      delete next.blockedNotes![iso];
    }

    await persist(next, `Updated ${iso} on website calendar`);
  };

  const runCommand = async () => {
    const parsed = parseBlockCommand(command);
    if (!parsed) {
      onToast('Could not parse. Try: "block 25 dec" or "high demand 14 feb" or "unblock 10-12 jan"', true);
      return;
    }

    let next: BlockedDatesConfig = {
      fullyBookedDates: [...(config.fullyBookedDates || [])],
      highDemandDates: [...(config.highDemandDates || [])],
      blockedNotes: { ...(config.blockedNotes || {}) },
    };

    for (const iso of parsed.dates) {
      next.fullyBookedDates = next.fullyBookedDates.filter((d) => d !== iso);
      next.highDemandDates = next.highDemandDates.filter((d) => d !== iso);

      if (parsed.action === "block") {
        next.fullyBookedDates.push(iso);
        if (parsed.note) next.blockedNotes![iso] = parsed.note;
      } else if (parsed.action === "high_demand") {
        next.highDemandDates.push(iso);
      } else {
        delete next.blockedNotes![iso];
      }
    }

    next.fullyBookedDates = Array.from(new Set(next.fullyBookedDates));
    next.highDemandDates = Array.from(new Set(next.highDemandDates));

    await persist(
      next,
      `${parsed.action === "unblock" ? "Opened" : "Updated"} ${parsed.dates.length} date(s) — live on website`
    );
    setCommand("");
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const upcomingBlocked = [...(config.fullyBookedDates || [])]
    .filter((d) => d >= today.toISOString().split("T")[0])
    .sort()
    .slice(0, 12);

  return (
    <div className="space-y-6">
      {/* Command bar */}
      <div className="glass-card rounded-2xl border border-[#D4AF37]/30 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Block Command</h3>
          {saving && <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin ml-auto" />}
        </div>
        <p className="text-xs text-white/50">
          Type naturally — e.g. <code className="text-[#D4AF37]">block 25 dec</code>,{" "}
          <code className="text-[#D4AF37]">block 10-12 jan 2027</code>,{" "}
          <code className="text-[#D4AF37]">high demand 14 feb</code>,{" "}
          <code className="text-[#D4AF37]">unblock 25 dec</code>
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void runCommand()}
            placeholder='e.g. "block 25 december" or "block 10-12 dec for Sharma wedding"'
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
          />
          <button
            type="button"
            onClick={() => void runCommand()}
            disabled={saving || !command.trim()}
            className="px-5 py-3 rounded-xl bg-gold-gradient text-[#011F15] text-xs font-extrabold uppercase tracking-wider disabled:opacity-50"
          >
            Apply
          </button>
        </div>
        <input
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="Optional note when clicking calendar (e.g. client name)"
          className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-xs text-white/80 outline-none focus:border-[#D4AF37]/50"
        />
      </div>

      {/* Calendar grid */}
      <div className="glass-card rounded-2xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            {monthName}
          </h3>
          <button type="button" onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-white/40 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell.iso) return <div key={`pad-${i}`} className="aspect-square" />;
            const status = getDayStatus(cell.iso, config);
            const isToday = cell.iso === today.toISOString().split("T")[0];
            const note = config.blockedNotes?.[cell.iso];

            const bg =
              status === "blocked"
                ? "bg-rose-500/30 border-rose-400/50 text-rose-100"
                : status === "high_demand"
                  ? "bg-amber-500/25 border-amber-400/40 text-amber-100"
                  : "bg-white/5 border-white/10 text-white/80 hover:bg-emerald-500/15 hover:border-emerald-400/30";

            return (
              <button
                key={cell.iso}
                type="button"
                title={note || cell.iso}
                onClick={() => void cycleDay(cell.iso!)}
                className={`aspect-square rounded-lg border text-sm font-mono font-bold transition ${bg} ${
                  isToday ? "ring-2 ring-[#D4AF37]/60" : ""
                }`}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-[10px] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-400/40" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-400/50" /> Fully booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/25 border border-amber-400/40" /> High demand
          </span>
          <span className="text-white/40">Click day: available → blocked → high demand → available</span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4" />
          Synced live to /reserve — customers see status instantly
        </div>
      </div>

      {/* Upcoming blocked + Google Calendar */}
      <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upcoming Blocked Dates</h3>
        {upcomingBlocked.length === 0 ? (
          <p className="text-xs text-white/40">No upcoming blocked dates.</p>
        ) : (
          <ul className="space-y-2">
            {upcomingBlocked.map((d) => (
              <li
                key={d}
                className="flex flex-wrap items-center justify-between gap-2 text-xs bg-black/30 rounded-xl px-3 py-2 border border-white/5"
              >
                <div>
                  <span className="font-mono font-bold text-rose-300">{d}</span>
                  {config.blockedNotes?.[d] && (
                    <span className="text-white/50 ml-2">— {config.blockedNotes[d]}</span>
                  )}
                </div>
                <a
                  href={googleCalendarBlockUrl(d, config.blockedNotes?.[d] || "Visriva — Fully Booked")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#D4AF37] hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Google Calendar
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
