"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import type { GuestEventConfig } from "@/lib/guestExperience";
import { getItineraryStatus } from "@/lib/guestExperience";

interface Props {
  event: GuestEventConfig;
}

export default function ItineraryTimeline({ event }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const items = useMemo(
    () =>
      event.itinerary.map((item) => ({
        item,
        status: getItineraryStatus(item, event.eventDate, now),
      })),
    [event, now]
  );

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
