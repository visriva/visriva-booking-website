"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Users } from "lucide-react";
import { getSupabaseGuestBrowser, type GuestGuestbookRow } from "@/lib/supabaseGuest";

interface Props {
  eventId: string;
  guestName: string;
}

const DEMO_ENTRIES: GuestGuestbookRow[] = [
  {
    id: "d1",
    event_id: "demo",
    name: "Ananya",
    message: "What a magical evening — the photo booth was unforgettable!",
    network_opt_in: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "d2",
    event_id: "demo",
    name: "Rohan",
    message: "Congratulations — sending love from table 8.",
    network_opt_in: true,
    created_at: new Date().toISOString(),
  },
];

export default function Guestbook({ eventId, guestName }: Props) {
  const [entries, setEntries] = useState<GuestGuestbookRow[]>([]);
  const [message, setMessage] = useState("");
  const [networkOptIn, setNetworkOptIn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"wishes" | "network">("wishes");

  const load = useCallback(async () => {
    const supabase = getSupabaseGuestBrowser();
    if (!supabase) {
      setEntries(DEMO_ENTRIES);
      return;
    }
    const { data } = await supabase
      .from("guest_guestbook")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(60);
    setEntries((data as GuestGuestbookRow[]) || DEMO_ENTRIES);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !guestName) return;
    setSaving(true);
    const row: GuestGuestbookRow = {
      id: `local-${Date.now()}`,
      event_id: eventId,
      name: guestName,
      message: message.trim(),
      network_opt_in: networkOptIn,
      created_at: new Date().toISOString(),
    };
    const supabase = getSupabaseGuestBrowser();
    if (supabase) {
      await supabase.from("guest_guestbook").insert({
        event_id: eventId,
        name: guestName,
        message: row.message,
        network_opt_in: networkOptIn,
      });
    }
    setEntries((prev) => [row, ...prev]);
    setMessage("");
    setSaving(false);
  };

  const wishes = entries;
  const network = entries.filter((e) => e.network_opt_in);

  return (
    <section className="px-4 py-6 pb-28">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--guest-gold)]">
          Leave a mark
        </p>
        <h2 className="font-serif text-2xl font-bold">Guestbook & networking</h2>
      </div>

      <div className="guest-glass rounded-3xl p-4 space-y-4">
        <form onSubmit={submit} className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Write a wish for the hosts…"
            className="w-full rounded-2xl bg-black/25 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[var(--guest-gold)] resize-none"
          />
          <label className="flex items-center gap-2 text-xs text-[var(--guest-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={networkOptIn}
              onChange={(e) => setNetworkOptIn(e.target.checked)}
              className="accent-[#D4AF37]"
            />
            Opt in to appear on the guest networking list
          </label>
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={saving || !message.trim()}
            type="submit"
            className="w-full rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider py-3 disabled:opacity-50"
          >
            {saving ? "Sending…" : "Post wish"}
          </motion.button>
        </form>

        <div className="flex gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => setTab("wishes")}
            className={`flex-1 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 ${
              tab === "wishes" ? "bg-[var(--guest-gold)]/20 text-[var(--guest-gold)]" : "text-[var(--guest-muted)]"
            }`}
          >
            <Heart className="h-3.5 w-3.5" /> Wishes
          </button>
          <button
            type="button"
            onClick={() => setTab("network")}
            className={`flex-1 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 ${
              tab === "network" ? "bg-[var(--guest-gold)]/20 text-[var(--guest-gold)]" : "text-[var(--guest-muted)]"
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Network
          </button>
        </div>

        <ul className="space-y-2.5 max-h-64 overflow-y-auto">
          {(tab === "wishes" ? wishes : network).map((entry) => (
            <li key={entry.id} className="rounded-2xl bg-black/20 px-3.5 py-3">
              <p className="text-xs font-bold text-[var(--guest-gold)]">{entry.name}</p>
              {tab === "wishes" ? (
                <p className="text-xs text-[var(--guest-muted)] mt-1 leading-relaxed">{entry.message}</p>
              ) : (
                <p className="text-[10px] text-[var(--guest-muted)] mt-0.5">Open to say hello</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
