"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import GuestThemeProvider from "@/components/guest/GuestThemeProvider";
import ThemeToggle from "@/components/guest/ThemeToggle";
import AnnouncementBanner from "@/components/guest/AnnouncementBanner";
import GuestHero from "@/components/guest/GuestHero";
import ItineraryTimeline from "@/components/guest/ItineraryTimeline";
import VenueMap from "@/components/guest/VenueMap";
import PhotoWall from "@/components/guest/PhotoWall";
import Guestbook from "@/components/guest/Guestbook";
import GuestConcierge from "@/components/guest/GuestConcierge";
import {
  getEventConfig,
  loadGuestIdentity,
  resolveGuestFromSearchParams,
  saveGuestIdentity,
  type GuestIdentity,
} from "@/lib/guestExperience";

function GuestDashboardInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = String(params?.eventId || "demo");
  const event = useMemo(() => getEventConfig(eventId), [eventId]);

  const [identity, setIdentity] = useState<GuestIdentity | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fromUrl = resolveGuestFromSearchParams(searchParams);
    const stored = loadGuestIdentity(event.id);
    if (fromUrl.name) {
      const next: GuestIdentity = {
        name: fromUrl.name,
        tableNumber: fromUrl.tableNumber || stored?.tableNumber || "—",
        seatNumber: fromUrl.seatNumber || stored?.seatNumber || "—",
      };
      saveGuestIdentity(event.id, next);
      setIdentity(next);
    } else if (stored) {
      setIdentity(stored);
    }
    setReady(true);
  }, [event.id, searchParams]);

  if (!ready) {
    return (
      <div className="guest-portal min-h-[100dvh] flex items-center justify-center text-sm text-white/50">
        Preparing your experience…
      </div>
    );
  }

  return (
    <GuestThemeProvider>
      <div className="mx-auto max-w-lg pb-8 relative">
        <header className="sticky top-0 z-40 px-4 pt-3 flex items-center justify-between gap-3 bg-gradient-to-b from-[var(--guest-bg)] via-[var(--guest-bg)]/90 to-transparent pb-2">
          <Link href="/qr" className="text-[10px] font-bold uppercase tracking-widest text-[var(--guest-muted)]">
            ← Guest hub
          </Link>
          <div className="flex items-center gap-2">
            {event.previewMode && (
              <span className="rounded-full border border-[var(--guest-gold)]/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--guest-gold)]">
                Preview
              </span>
            )}
            <ThemeToggle />
          </div>
        </header>

        <AnnouncementBanner event={event} />

        <GuestHero event={event} identity={identity} onIdentitySaved={setIdentity} />

        {identity && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <ItineraryTimeline event={event} />
            <VenueMap event={event} />
            <PhotoWall eventId={event.id} guestName={identity.name} />
            <Guestbook eventId={event.id} guestName={identity.name} />
            <GuestConcierge event={event} guestName={identity.name} />
          </motion.div>
        )}
      </div>
    </GuestThemeProvider>
  );
}

export default function GuestEventPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-[#011F15] flex items-center justify-center text-white/50 text-sm">
          Loading…
        </div>
      }
    >
      <GuestDashboardInner />
    </Suspense>
  );
}
