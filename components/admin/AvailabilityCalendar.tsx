"use client";

import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mic,
  Loader2,
  CheckCircle2,
  Plus,
  Sparkles,
} from "lucide-react";
import type { BlockedDatesConfig } from "@/lib/firebase";
import { saveBlockedDates } from "@/lib/firebase";
import {
  type CalendarEvent,
  migrateConfigToEvents,
  mergeConfigWithEvents,
  eventsOnDate,
  formatEventTimeRange,
  newEventId,
} from "@/lib/calendarEvents";
import { parseCalendarIntent } from "@/lib/parseCalendarIntent";
import GoogleCalendarSyncPanel from "@/components/admin/GoogleCalendarSyncPanel";
import CalendarEventModal from "@/components/admin/CalendarEventModal";

type DayStatus = "available" | "blocked" | "high_demand";

interface Props {
  config: BlockedDatesConfig;
  onConfigChange: (config: BlockedDatesConfig) => void;
  onToast: (msg: string, isError?: boolean) => void;
  onRefresh?: () => void;
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

export default function AvailabilityCalendar({ config, onConfigChange, onToast, onRefresh }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [command, setCommand] = useState("");
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalInitial, setModalInitial] = useState<Partial<CalendarEvent> & { startDate: string }>();

  const events = useMemo(() => migrateConfigToEvents(config), [config]);

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const cells = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const persistEvents = async (nextEvents: CalendarEvent[], msg: string) => {
    setSaving(true);
    const merged = mergeConfigWithEvents(config, nextEvents);
    onConfigChange(merged);
    const res = await saveBlockedDates(merged);
    setSaving(false);
    if (res.success) onToast(msg);
    else onToast(res.error || "Save failed", true);
  };

  const openCreate = (iso: string, prefill?: Partial<CalendarEvent>) => {
    setModalMode("create");
    setModalInitial({ startDate: iso, endDate: iso, ...prefill });
    setModalOpen(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    setModalMode("edit");
    setModalInitial(ev);
    setModalOpen(true);
  };

  const handleDayClick = (iso: string) => {
    const dayEvents = eventsOnDate(events, iso);
    if (dayEvents.length === 1) {
      openEdit(dayEvents[0]);
    } else if (dayEvents.length > 1) {
      openCreate(iso);
      onToast(`${dayEvents.length} events on this day — tap one below or add new`);
    } else {
      openCreate(iso);
    }
  };

  const handleSaveEvent = async (ev: CalendarEvent) => {
    const now = new Date().toISOString();
    const saved: CalendarEvent = {
      ...ev,
      id: ev.id || newEventId(),
      source: ev.source || "manual",
      createdAt: ev.createdAt || now,
      updatedAt: now,
    };

    let next: CalendarEvent[];
    if (modalMode === "edit" && ev.id) {
      next = events.map((e) => (e.id === ev.id ? saved : e));
    } else {
      next = [...events, saved];
    }

    await persistEvents(next, `Saved "${saved.title}" — live on website & Google export`);
    setModalOpen(false);
    setCommand("");
  };

  const handleDeleteEvent = async (id: string) => {
    const next = events.filter((e) => e.id !== id);
    await persistEvents(next, "Event removed");
    setModalOpen(false);
  };

  const runCommand = async () => {
    const text = command.trim();
    if (!text) return;

    setParsing(true);
    let intent = parseCalendarIntent(text);

    if (!intent) {
      try {
        const res = await fetch("/api/calendar/parse-intent", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (res.ok && data.intent) {
          intent = data.intent;
        } else {
          onToast(data.hint || data.error || "Could not understand — try adding the date clearly", true);
          setParsing(false);
          return;
        }
      } catch {
        onToast("Could not parse command", true);
        setParsing(false);
        return;
      }
    }

    setParsing(false);

    if (!intent) {
      onToast("Could not understand command", true);
      return;
    }

    const parsed = intent;

    if (parsed.action === "delete") {
      const toRemove = events.filter(
        (e) => e.startDate <= parsed.endDate && e.endDate >= parsed.startDate
      );
      if (!toRemove.length) {
        onToast("No events found on that date to remove", true);
        return;
      }
      const next = events.filter((e) => !toRemove.some((r) => r.id === e.id));
      await persistEvents(next, `Removed ${toRemove.length} event(s)`);
      setCommand("");
      return;
    }

    openCreate(parsed.startDate, {
      title: parsed.title,
      description: parsed.description,
      endDate: parsed.endDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      allDay: parsed.allDay,
      status: parsed.status,
      source: "command",
    });
    onToast("Review the event details below, then Save");
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonthNav = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const upcomingEvents = useMemo(() => {
    const todayIso = today.toISOString().split("T")[0];
    return [...events]
      .filter((e) => e.endDate >= todayIso)
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title))
      .slice(0, 20);
  }, [events, today]);

  return (
    <div className="space-y-6">
      <GoogleCalendarSyncPanel onToast={onToast} onSynced={onRefresh} />

      {/* Smart command */}
      <div className="glass-card rounded-2xl border border-[#D4AF37]/30 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Smart calendar command</h3>
          {(saving || parsing) && <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin ml-auto" />}
        </div>
        <p className="text-xs text-white/50 leading-relaxed">
          Describe the event naturally — date, time, name, and reason. Example:{" "}
          <code className="text-[#D4AF37]">17th aug missy event</code> or{" "}
          <code className="text-[#D4AF37]">25 dec 2pm-8pm Sharma wedding corporate booth</code>
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void runCommand()}
            placeholder='e.g. "17th aug missy event" or "high demand 14 feb valentine enquiries"'
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
          />
          <button
            type="button"
            onClick={() => void runCommand()}
            disabled={saving || parsing || !command.trim()}
            className="px-5 py-3 rounded-xl bg-gold-gradient text-[#011F15] text-xs font-extrabold uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Analyze &amp; add
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="glass-card rounded-2xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            {monthName}
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => openCreate(today.toISOString().split("T")[0])}
              className="p-2 rounded-lg hover:bg-[#D4AF37]/20 text-[#D4AF37]"
              title="Add event"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button type="button" onClick={nextMonthNav} className="p-2 rounded-lg hover:bg-white/10">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-white/40 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell.iso) return <div key={`pad-${i}`} className="min-h-[72px]" />;
            const status = getDayStatus(cell.iso, config);
            const dayEvents = eventsOnDate(events, cell.iso);
            const isToday = cell.iso === today.toISOString().split("T")[0];

            const bg =
              status === "blocked"
                ? "bg-rose-500/20 border-rose-400/40 hover:bg-rose-500/30"
                : status === "high_demand"
                  ? "bg-amber-500/15 border-amber-400/30 hover:bg-amber-500/25"
                  : "bg-white/5 border-white/10 hover:bg-emerald-500/10 hover:border-emerald-400/20";

            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => handleDayClick(cell.iso!)}
                className={`min-h-[72px] rounded-lg border p-1 text-left transition flex flex-col ${bg} ${
                  isToday ? "ring-2 ring-[#D4AF37]/60" : ""
                }`}
              >
                <span className="text-xs font-mono font-bold text-white/90 px-0.5">{cell.day}</span>
                <div className="flex-1 space-y-0.5 mt-0.5 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-[8px] leading-tight px-1 py-0.5 rounded truncate font-semibold ${
                        ev.status === "high_demand"
                          ? "bg-amber-500/40 text-amber-50"
                          : "bg-rose-500/40 text-rose-50"
                      }`}
                      title={ev.description || ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[8px] text-white/40 px-1">+{dayEvents.length - 2} more</span>
                  )}
                </div>
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
          <span className="text-white/40">Click any day to view, edit, or add events</span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4" />
          Synced live to /reserve + Google Calendar export feed
        </div>
      </div>

      {/* Upcoming events */}
      <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upcoming events</h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-xs text-white/40">No events scheduled. Click a day or use the smart command above.</p>
        ) : (
          <ul className="space-y-2">
            {upcomingEvents.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => openEdit(ev)}
                  className="w-full text-left flex flex-wrap items-start justify-between gap-2 text-xs bg-black/30 rounded-xl px-3 py-3 border border-white/5 hover:border-[#D4AF37]/30 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          ev.status === "high_demand"
                            ? "bg-amber-500/20 text-amber-200"
                            : "bg-rose-500/20 text-rose-200"
                        }`}
                      >
                        {ev.status === "high_demand" ? "High demand" : "Fully booked"}
                      </span>
                      {ev.source === "google" && (
                        <span className="text-[9px] text-blue-300 font-mono">Google</span>
                      )}
                    </div>
                    <p className="font-bold text-white mt-1">{ev.title}</p>
                    <p className="text-white/50 font-mono text-[10px] mt-0.5">
                      {ev.startDate}
                      {ev.endDate !== ev.startDate ? ` → ${ev.endDate}` : ""} · {formatEventTimeRange(ev)}
                    </p>
                    {ev.description && (
                      <p className="text-white/60 mt-1.5 leading-relaxed">{ev.description}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CalendarEventModal
        open={modalOpen}
        mode={modalMode}
        initial={modalInitial}
        onClose={() => setModalOpen(false)}
        onSave={(ev) => void handleSaveEvent(ev)}
        onDelete={modalMode === "edit" ? (id) => void handleDeleteEvent(id) : undefined}
      />
    </div>
  );
}
