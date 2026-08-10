"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import type { BlockedDatesConfig } from "@/lib/firebase";

interface Props {
  value: string;
  onChange: (iso: string) => void;
  blockedDates: BlockedDatesConfig;
  minDate?: string;
}

function buildDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const pad = first.getDay();
  const dim = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ iso: string | null; day: number }> = [];
  for (let i = 0; i < pad; i++) cells.push({ iso: null, day: 0 });
  for (let d = 1; d <= dim; d++) {
    cells.push({
      iso: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d,
    });
  }
  return cells;
}

function formatDisplay(iso: string) {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DateAvailabilityPicker({
  value,
  onChange,
  blockedDates,
  minDate,
}: Props) {
  const today = new Date();
  const initial = value ? new Date(value + "T12:00:00") : today;
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());

  const cells = useMemo(() => buildDays(year, month), [year, month]);
  const monthLabel = new Date(year, month, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const prev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  return (
    <div className="rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-black/50 to-[#011F15]/80 p-4 sm:p-5 space-y-4 shadow-inner">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-white/45 font-bold">Pick your date</p>
            <p className="text-sm font-serif font-bold text-white truncate">
              {value ? formatDisplay(value) : "Select on calendar"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={prev}
            className="p-2 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4 text-white/80" />
          </button>
          <span className="text-xs font-bold text-[#D4AF37] min-w-[120px] text-center">{monthLabel}</span>
          <button
            type="button"
            onClick={next}
            className="p-2 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10 transition"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4 text-white/80" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-white/40 font-bold uppercase tracking-wider">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c.iso) return <div key={`p-${i}`} className="aspect-square" />;
          const blocked = blockedDates.fullyBookedDates?.includes(c.iso);
          const high = blockedDates.highDemandDates?.includes(c.iso);
          const past = minDate && c.iso < minDate;
          const selected = value === c.iso;
          const available = !past && !blocked;

          return (
            <button
              key={c.iso}
              type="button"
              disabled={!!past || blocked}
              onClick={() => onChange(c.iso!)}
              className={`aspect-square rounded-lg text-xs font-semibold transition-all duration-200 ${
                past
                  ? "opacity-25 cursor-not-allowed text-white/30"
                  : blocked
                    ? "bg-rose-950/60 text-rose-300/80 line-through cursor-not-allowed border border-rose-500/20"
                    : high
                      ? "bg-amber-500/20 text-amber-100 border border-amber-400/30 hover:bg-amber-500/30"
                      : "bg-white/[0.04] text-white/85 border border-white/5 hover:border-emerald-400/40 hover:bg-emerald-500/15"
              } ${
                selected
                  ? "!bg-gold-gradient !text-[#011F15] !border-[#D4AF37] shadow-gold-sm scale-105 font-bold z-10"
                  : ""
              } ${available && !selected ? "hover:scale-105" : ""}`}
            >
              {c.day}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 pt-1 text-[10px] font-medium">
        <span className="flex items-center gap-1.5 text-emerald-300/90">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" /> Available
        </span>
        <span className="flex items-center gap-1.5 text-amber-200/90">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" /> High demand
        </span>
        <span className="flex items-center gap-1.5 text-rose-300/90">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" /> Booked
        </span>
      </div>
    </div>
  );
}
