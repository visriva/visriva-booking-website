"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <button type="button" onClick={prev} className="p-1 rounded hover:bg-white/10">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-white">{monthLabel}</span>
        <button type="button" onClick={next} className="p-1 rounded hover:bg-white/10">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-[9px] text-center text-white/40 font-bold">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={`${d}-${i}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((c, i) => {
          if (!c.iso) return <div key={`p-${i}`} />;
          const blocked = blockedDates.fullyBookedDates?.includes(c.iso);
          const high = blockedDates.highDemandDates?.includes(c.iso);
          const past = minDate && c.iso < minDate;
          const selected = value === c.iso;

          return (
            <button
              key={c.iso}
              type="button"
              disabled={!!past}
              onClick={() => onChange(c.iso!)}
              className={`aspect-square rounded-md text-[11px] font-mono font-bold transition ${
                past
                  ? "opacity-30 cursor-not-allowed"
                  : blocked
                    ? "bg-rose-500/40 text-rose-100 line-through"
                    : high
                      ? "bg-amber-500/30 text-amber-100"
                      : "bg-white/5 text-white/80 hover:bg-emerald-500/20"
              } ${selected ? "ring-2 ring-[#D4AF37]" : ""}`}
            >
              {c.day}
            </button>
          );
        })}
      </div>
      {value && (
        <p className="text-[10px] text-center font-mono text-[#D4AF37]">Selected: {value}</p>
      )}
    </div>
  );
}
