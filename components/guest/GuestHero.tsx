"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Hash, Wifi, Armchair, Sparkles } from "lucide-react";
import type { GuestEventConfig, GuestIdentity } from "@/lib/guestExperience";
import { saveGuestIdentity } from "@/lib/guestExperience";

interface Props {
  event: GuestEventConfig;
  identity: GuestIdentity | null;
  onIdentitySaved: (id: GuestIdentity) => void;
}

export default function GuestHero({ event, identity, onIdentitySaved }: Props) {
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [seat, setSeat] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const next: GuestIdentity = {
      name: name.trim(),
      tableNumber: table.trim() || "—",
      seatNumber: seat.trim() || "—",
    };
    saveGuestIdentity(event.id, next);
    onIdentitySaved(next);
  };

  if (!identity) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-2"
      >
        <p className="font-serif text-xs uppercase tracking-[0.2em] text-[var(--guest-gold)] mb-2">
          Visriva Guest Experience
        </p>
        <h1 className="font-serif text-3xl font-bold leading-tight mb-2">Welcome</h1>
        <p className="text-sm text-[var(--guest-muted)] mb-5">
          Enter your name to unlock your VIP card for {event.title}.
        </p>
        <form onSubmit={handleSave} className="guest-glass rounded-3xl p-5 space-y-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[var(--guest-gold)]"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={table}
              onChange={(e) => setTable(e.target.value)}
              placeholder="Table #"
              className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[var(--guest-gold)]"
            />
            <input
              value={seat}
              onChange={(e) => setSeat(e.target.value)}
              placeholder="Seat #"
              className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[var(--guest-gold)]"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-sm py-3.5 uppercase tracking-wider"
          >
            Continue
          </motion.button>
        </form>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="px-4 pt-6 pb-2 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-[var(--guest-gold)]" />
            <p className="font-serif text-[10px] uppercase tracking-[0.22em] text-[var(--guest-gold)]">
              Visriva
            </p>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-snug">
            Welcome to the Visriva Experience,{" "}
            <span className="text-[var(--guest-gold)]">{identity.name}</span>
          </h1>
          <p className="text-xs text-[var(--guest-muted)] mt-2">{event.subtitle}</p>
        </div>
      </div>

      <div className="guest-glass rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[var(--guest-gold)]/15 blur-2xl" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--guest-gold)] mb-3">
          Your VIP card
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-black/25 px-3 py-3 text-center">
            <Hash className="h-3.5 w-3.5 mx-auto text-[var(--guest-gold)] mb-1" />
            <p className="text-[9px] uppercase tracking-wider text-[var(--guest-muted)]">Table</p>
            <p className="font-serif text-xl font-bold mt-0.5">{identity.tableNumber}</p>
          </div>
          <div className="rounded-2xl bg-black/25 px-3 py-3 text-center">
            <Armchair className="h-3.5 w-3.5 mx-auto text-[var(--guest-gold)] mb-1" />
            <p className="text-[9px] uppercase tracking-wider text-[var(--guest-muted)]">Seat</p>
            <p className="font-serif text-xl font-bold mt-0.5">{identity.seatNumber}</p>
          </div>
          <div className="rounded-2xl bg-black/25 px-3 py-3 text-center col-span-1">
            <Wifi className="h-3.5 w-3.5 mx-auto text-[var(--guest-gold)] mb-1" />
            <p className="text-[9px] uppercase tracking-wider text-[var(--guest-muted)]">WiFi</p>
            <p className="text-[10px] font-mono font-bold mt-0.5 leading-tight break-all">
              {event.wifiPassword}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-[var(--guest-muted)] mt-3 font-mono">
          Network: <span className="text-[var(--guest-fg)]">{event.wifiSsid}</span>
        </p>
      </div>
    </motion.section>
  );
}
