"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import type { GuestEventConfig, ItineraryItem } from "@/lib/guestExperience";
import { getItineraryStatus } from "@/lib/guestExperience";
import { getSupabaseGuestBrowser, type AgendaItemRow } from "@/lib/supabaseGuest";

interface Props {
  event: GuestEventConfig;
}

function formatHm(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function rowToItem(row: AgendaItemRow): ItineraryItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    startTime: formatHm(row.start_time),
    endTime: formatHm(row.end_time),
    location: row.location_name || undefined,
  };
}

/** Live status using absolute timestamptz from Supabase when present. */
function statusFromIso(startIso: string, endIso: string, now: Date): "upcoming" | "live" | "past" {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "live";
}

export default function ItineraryTimeline({ event }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [remote, setRemote] = useState<AgendaItemRow[] | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseGuestBrowser();
    if (!supabase) return;

    const load = async () => {
      const { data } = await supabase
        .from("agenda_items")
        .select("*")
        .order("start_time", { ascending: true });
      if (data?.length) setRemote(data as AgendaItemRow[]);
    };
    void load();

    const channel = supabase
      .channel("guest-agenda-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agenda_items" },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const items = useMemo(() => {
    if (remote?.length) {
      return remote.map((row) => ({
        item: rowToItem(row),
        status: statusFromIso(row.start_time, row.end_time, now),
      }));
    }
    return event.itinerary.map((item) => ({
      item,
      status: getItineraryStatus(item, event.eventDate, now),
    }));
  }, [event, now, remote]);

  return (
    <section className="px-4 py-6">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--guest-gold)]">
          Tonight
        </p>
        <h2 className="font-serif text-2xl font-bold">Live itinerary</h2>
      </div>

      <div className="relative pl-2">
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-[var(--guest-border)]" />
        <ul className="space-y-3">
          {items.map(({ item, status }, idx) => {
            const dim = status === "past";
            const live = status === "live";
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: idx * 0.04 }}
                className={`relative flex gap-3 ${dim ? "opacity-45" : "opacity-100"}`}
              >
                <div className="relative z-10 mt-3 flex h-5 w-5 shrink-0 items-center justify-center">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      live
                        ? "bg-emerald-400 guest-live-dot shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                        : "bg-[var(--guest-gold)]"
                    }`}
                  />
                </div>
                <div
                  className={`guest-glass flex-1 rounded-2xl p-4 ${
                    live ? "ring-1 ring-emerald-400/50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-serif text-base font-bold">{item.title}</h3>
                    {live && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 guest-live-dot" />
                        Live now
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--guest-muted)] leading-relaxed">{item.description}</p>
                  <div className="mt-2.5 flex flex-wrap gap-3 text-[10px] font-mono text-[var(--guest-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[var(--guest-gold)]" />
                      {item.startTime} – {item.endTime}
                    </span>
                    {item.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[var(--guest-gold)]" />
                        {item.location}
                      </span>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
