"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import type { GuestEventConfig } from "@/lib/guestExperience";
import { getSupabaseGuestBrowser, type AnnouncementRow } from "@/lib/supabaseGuest";

interface Props {
  event: GuestEventConfig;
}

export default function AnnouncementBanner({ event }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseGuestBrowser();
    let demoTimer: ReturnType<typeof setInterval> | undefined;
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | undefined;

    async function loadLatest() {
      if (!supabase) return;
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      const row = (data as AnnouncementRow[] | null)?.[0];
      if (row?.message) setMessage(row.message);
    }

    if (supabase) {
      void loadLatest();
      channel = supabase
        .channel("guest-announcements-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "announcements" },
          (payload) => {
            const row = (payload.new || payload.old) as AnnouncementRow;
            if (payload.eventType === "DELETE") {
              void loadLatest();
              return;
            }
            if (row?.is_active && row.message) setMessage(row.message);
            else void loadLatest();
          }
        )
        .subscribe();
    } else {
      const list = event.demoAnnouncements;
      let i = 0;
      setMessage(list[0] || null);
      demoTimer = setInterval(() => {
        i = (i + 1) % list.length;
        setMessage(list[i] || null);
      }, 12000);
    }

    return () => {
      if (demoTimer) clearInterval(demoTimer);
      if (supabase && channel) void supabase.removeChannel(channel);
    };
  }, [event.demoAnnouncements]);

  if (!message) return null;

  return (
    <div className="sticky top-0 z-30 px-3 pt-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="guest-glass rounded-2xl px-3.5 py-2.5 flex items-start gap-2.5 border-[var(--guest-gold)]/40"
        >
          <div className="mt-0.5 h-7 w-7 rounded-full bg-[var(--guest-gold)]/20 flex items-center justify-center shrink-0">
            <Megaphone className="h-3.5 w-3.5 text-[var(--guest-gold)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--guest-gold)]">
              Live announcement
            </p>
            <p className="text-xs leading-snug mt-0.5">{message}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
