"use client";

import React, { useEffect, useState } from "react";
import { X, ExternalLink, Trash2, Save, Clock, CalendarDays } from "lucide-react";
import type { CalendarEvent, CalendarEventStatus } from "@/lib/calendarEvents";
import { googleCalendarEventUrl, sanitizeCalendarEvent } from "@/lib/calendarEvents";

export type EventModalMode = "create" | "edit";

interface Props {
  open: boolean;
  mode: EventModalMode;
  initial?: Partial<CalendarEvent> & { startDate: string };
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
}

const INPUT =
  "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]";

function blankEvent(startDate: string): CalendarEvent {
  const now = new Date().toISOString();
  return {
    id: "",
    title: "",
    description: "",
    startDate,
    endDate: startDate,
    allDay: true,
    status: "blocked",
    source: "manual",
    createdAt: now,
    updatedAt: now,
  };
}

export default function CalendarEventModal({
  open,
  mode,
  initial,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [form, setForm] = useState<CalendarEvent>(() =>
    blankEvent(initial?.startDate || new Date().toISOString().split("T")[0])
  );

  useEffect(() => {
    if (!open) return;
    const base = blankEvent(initial?.startDate || new Date().toISOString().split("T")[0]);
    const prefill = Object.fromEntries(
      Object.entries(initial || {}).filter(([, v]) => v !== undefined)
    ) as Partial<CalendarEvent>;
    setForm({
      ...base,
      ...prefill,
      id: initial?.id || "",
      endDate: initial?.endDate || initial?.startDate || base.startDate,
    });
  }, [open, initial]);

  if (!open) return null;

  const set = <K extends keyof CalendarEvent>(key: K, value: CalendarEvent[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    onSave(
      sanitizeCalendarEvent({
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        endDate: form.endDate >= form.startDate ? form.endDate : form.startDate,
        startTime: form.allDay ? undefined : form.startTime,
        endTime: form.allDay ? undefined : form.endTime,
        updatedAt: now,
        createdAt: form.createdAt || now,
      })
    );
  };

  const previewUrl = googleCalendarEventUrl(form);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-[#D4AF37]/30 bg-[#022419] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#011F15]/95 backdrop-blur">
          <div>
            <h3 className="font-serif text-lg font-bold text-white">
              {mode === "create" ? "New calendar event" : "Edit event"}
            </h3>
            <p className="text-[10px] text-white/45 font-mono uppercase tracking-wider">
              Blocks dates on /reserve · syncs to Google export
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-[#D4AF37] mb-1 block">
              Event name *
            </label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Missy Event, Sharma Wedding"
              className={INPUT}
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-[#D4AF37] mb-1 block">
              Description / reason for blocking
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Why is this date blocked? Crew assignment, venue, client notes…"
              rows={3}
              className={`${INPUT} resize-y min-h-[80px]`}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-[#D4AF37] mb-2 block">
              Availability impact
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["blocked", "Fully booked", "rose"],
                  ["high_demand", "High demand", "amber"],
                ] as const
              ).map(([val, label, color]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set("status", val as CalendarEventStatus)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                    form.status === val
                      ? color === "rose"
                        ? "bg-rose-500/30 border-rose-400/60 text-rose-100"
                        : "bg-amber-500/25 border-amber-400/50 text-amber-100"
                      : "bg-white/5 border-white/10 text-white/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => set("allDay", e.target.checked)}
              className="rounded"
            />
            <CalendarDays className="w-4 h-4 text-[#D4AF37]" />
            All day
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">Start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => {
                  set("startDate", e.target.value);
                  if (form.endDate < e.target.value) set("endDate", e.target.value);
                }}
                className={INPUT}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-white/40 mb-1 block">End date</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => set("endDate", e.target.value)}
                className={INPUT}
              />
            </div>
          </div>

          {!form.allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-white/40 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Start time
                </label>
                <input
                  type="time"
                  value={form.startTime || "09:00"}
                  onChange={(e) => set("startTime", e.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-white/40 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> End time
                </label>
                <input
                  type="time"
                  value={form.endTime || "18:00"}
                  onChange={(e) => set("endTime", e.target.value)}
                  className={INPUT}
                />
              </div>
            </div>
          )}

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold hover:bg-[#D4AF37]/10"
          >
            <ExternalLink className="w-4 h-4" />
            Preview in Google Calendar
          </a>
        </div>

        <div className="sticky bottom-0 flex gap-2 p-5 border-t border-white/10 bg-[#011F15]/95">
          {mode === "edit" && form.id && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(form.id)}
              className="px-4 py-3 rounded-xl border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/10 text-xs font-bold uppercase"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="flex-1 py-3 rounded-xl bg-gold-gradient text-[#011F15] text-xs font-extrabold uppercase flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save event
          </button>
        </div>
      </div>
    </div>
  );
}
