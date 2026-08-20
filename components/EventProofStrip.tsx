"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Sparkles, Users } from "lucide-react";
import {
  subscribeLiveImpactStats,
  DEFAULT_LIVE_IMPACT_STATS,
  type LiveImpactStatsConfig,
} from "@/lib/firebase";

export interface EventProofItem {
  venue: string;
  eventType: string;
  detail: string;
}

/** Curated recent-style proofs — edit in Admin → Real Impact when CMS fields are used. */
export const DEFAULT_EVENT_PROOFS: EventProofItem[] = [
  {
    venue: "Taj West End, Bengaluru",
    eventType: "Wedding reception",
    detail: "Instant photo booth · custom monogram strips",
  },
  {
    venue: "ITC Gardenia",
    eventType: "Corporate gala",
    detail: "Live fridge magnets · brand-matched frames",
  },
  {
    venue: "Private farmhouse, Sarjapur",
    eventType: "Sangeet night",
    detail: "400+ keepsakes delivered on-site",
  },
];

interface Props {
  /** Tight layout above forms / CTA buttons */
  compact?: boolean;
  className?: string;
  proofs?: EventProofItem[];
}

export default function EventProofStrip({
  compact = false,
  className = "",
  proofs = DEFAULT_EVENT_PROOFS,
}: Props) {
  const [stats, setStats] = useState<LiveImpactStatsConfig>(DEFAULT_LIVE_IMPACT_STATS);

  useEffect(() => {
    return subscribeLiveImpactStats((data) => {
      if (data) setStats(data);
    });
  }, []);

  const eventsLabel =
    stats.eventsExecuted > 0 ? `${stats.eventsExecuted}+ events` : "Live on-site stations";
  const guestsLabel =
    stats.guestsServed > 0
      ? `${stats.guestsServed.toLocaleString("en-IN")}+ guests`
      : "Weddings & corporates";
  const brands = (stats.clientBrands || []).slice(0, 6);

  return (
    <div
      className={`rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/8 via-black/20 to-emerald-500/5 ${
        compact ? "p-4 sm:p-5" : "p-5 sm:p-6"
      } ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
          <Sparkles className="w-3.5 h-3.5" />
          Real events · Bengaluru &amp; beyond
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-emerald-100/75 font-mono">
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3 text-[#D4AF37]" />
            {eventsLabel}
          </span>
          <span className="text-white/20">·</span>
          <span>{guestsLabel}</span>
          <span className="text-white/20">·</span>
          <span>No payment to get a quote</span>
        </div>
      </div>

      <div
        className={`grid gap-3 ${
          compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 md:grid-cols-3"
        }`}
      >
        {proofs.slice(0, 3).map((proof) => (
          <div
            key={`${proof.venue}-${proof.eventType}`}
            className="rounded-xl bg-black/35 border border-white/10 px-3.5 py-3 space-y-1"
          >
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white leading-snug">{proof.venue}</p>
                <p className="text-[11px] text-[#D4AF37]/90 font-medium mt-0.5">{proof.eventType}</p>
                <p className="text-[10px] text-emerald-100/60 mt-1 leading-relaxed">{proof.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {brands.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold mr-1">
            Brands we&apos;ve hosted
          </span>
          {brands.map((brand) => (
            <span
              key={brand}
              className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/70 font-medium"
            >
              {brand}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
