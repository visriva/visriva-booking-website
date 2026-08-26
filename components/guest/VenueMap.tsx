"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, MapPinned } from "lucide-react";
import type { GuestEventConfig, VenueZone } from "@/lib/guestExperience";

interface Props {
  event: GuestEventConfig;
}

export default function VenueMap({ event }: Props) {
  const [zoom, setZoom] = useState(1);
  const [active, setActive] = useState<VenueZone | null>(event.venueZones[0] || null);

  return (
    <section className="px-4 py-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--guest-gold)]">
            Find your way
          </p>
          <h2 className="font-serif text-2xl font-bold">Venue map</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.85, z - 0.15))}
            className="guest-glass h-9 w-9 rounded-full flex items-center justify-center"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
            className="guest-glass h-9 w-9 rounded-full flex items-center justify-center"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="guest-glass rounded-3xl p-3 overflow-hidden">
        <div className="overflow-auto touch-pan-x touch-pan-y rounded-2xl bg-black/30">
          <motion.div
            animate={{ scale: zoom }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            style={{ originX: 0.5, originY: 0.5 }}
            className="relative mx-auto w-full max-w-md aspect-[4/5] min-w-[280px]"
          >
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <rect x="4" y="4" width="92" height="92" rx="4" fill="rgba(3,53,36,0.9)" stroke="rgba(212,175,55,0.35)" strokeWidth="0.6" />
              <rect x="28" y="70" width="44" height="18" rx="1.5" fill="rgba(212,175,55,0.08)" stroke="rgba(212,175,55,0.2)" strokeWidth="0.4" />
              <text x="50" y="81" textAnchor="middle" fill="rgba(247,244,238,0.35)" fontSize="3.2" fontFamily="Montserrat, sans-serif">
                Guest seating
              </text>
              {event.venueZones.map((zone) => {
                const selected = active?.id === zone.id;
                return (
                  <g
                    key={zone.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActive(zone)}
                    onKeyDown={(e) => e.key === "Enter" && setActive(zone)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.w}
                      height={zone.h}
                      rx="2"
                      fill={selected ? "rgba(212,175,55,0.35)" : "rgba(212,175,55,0.12)"}
                      stroke={selected ? "#D4AF37" : "rgba(212,175,55,0.4)"}
                      strokeWidth={selected ? 0.8 : 0.45}
                    />
                    <text
                      x={zone.x + zone.w / 2}
                      y={zone.y + zone.h / 2 + 1}
                      textAnchor="middle"
                      fill="#F7F4EE"
                      fontSize="2.8"
                      fontFamily="Montserrat, sans-serif"
                      fontWeight="600"
                    >
                      {zone.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </motion.div>
        </div>

        {active && (
          <div className="mt-3 flex items-start gap-2 px-1 pb-1">
            <MapPinned className="h-4 w-4 text-[var(--guest-gold)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold">{active.label}</p>
              <p className="text-xs text-[var(--guest-muted)]">{active.hint}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
