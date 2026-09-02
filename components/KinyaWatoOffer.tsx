"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Camera, CheckCircle2, Coffee, Sparkles } from "lucide-react";

const WA_CREW =
  "https://wa.me/918884484828?text=" +
  encodeURIComponent(
    "Hi Visriva! I claimed the Kinya Coffee / WATO ₹100 photo-strip offer. Ready at the booth."
  );

type Stage = "hub" | "reveal";

export default function KinyaWatoOffer() {
  const [stage, setStage] = useState<Stage>("hub");
  const [claimed, setClaimed] = useState(false);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#01140e] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,#063322_0%,#01140e_68%)]" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-24 h-64 w-64 rounded-full bg-amber-700/20 blur-3xl"
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-10 bottom-16 h-72 w-72 rounded-full bg-[#D4AF37]/12 blur-3xl"
        animate={{ opacity: [0.2, 0.5, 0.2], y: [0, -16, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-lg flex-col px-4 pb-12 pt-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/qr"
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Guest hub
          </Link>
          <span className="rounded-full border border-[#D4AF37]/30 bg-black/30 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[#D4AF37]">
            Photo booth
          </span>
        </div>

        <AnimatePresence mode="wait">
          {stage === "hub" ? (
            <motion.section
              key="hub"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="flex flex-1 flex-col"
            >
              <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.32em] text-[#D4AF37]/90">
                Tonight at the Live Station
              </p>
              <h1 className="text-center font-serif text-4xl font-bold leading-tight sm:text-5xl">
                Kinya Coffee
                <span className="block text-2xl font-medium text-[#D4AF37] sm:text-3xl">× WATO</span>
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-emerald-100/70">
                Grab a coffee at the stall, then tap the offer below for your photo-strip deal at the Visriva booth.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center">
                  <Coffee className="mx-auto mb-2 h-6 w-6 text-amber-300" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Stall</p>
                  <p className="mt-1 font-serif text-lg font-bold">Kinya Coffee</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center">
                  <Camera className="mx-auto mb-2 h-6 w-6 text-[#D4AF37]" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Booth</p>
                  <p className="mt-1 font-serif text-lg font-bold">2 photo strips</p>
                </div>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setStage("reveal")}
                className="relative mt-8 overflow-hidden rounded-[28px] border border-[#D4AF37]/50 bg-gradient-to-br from-[#D4AF37] via-[#e8c75a] to-[#B89223] px-5 py-6 text-center shadow-[0_16px_40px_rgba(212,175,55,0.35)]"
              >
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/30"
                  animate={{ x: ["0%", "420%"] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
                  style={{ transform: "skewX(-18deg)" }}
                />
                <span className="relative block text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#01140e]/70">
                  Tap to claim
                </span>
                <span className="relative mt-1 block font-serif text-2xl font-bold text-[#01140e] sm:text-3xl">
                  Kinya Coffee · WATO Offer
                </span>
                <span className="relative mt-1 block text-xs font-semibold text-[#01140e]/80">
                  ₹100 off photo strips
                </span>
              </motion.button>

              <p className="mt-5 text-center text-[11px] text-white/40">
                Show this screen at the Visriva photo booth after you claim.
              </p>
            </motion.section>
          ) : (
            <motion.section
              key="reveal"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col"
            >
              <div className="mb-5 flex items-center justify-center gap-2 text-[#D4AF37]">
                <Sparkles className="h-4 w-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.28em]">Your booth deal</p>
              </div>

              <div className="space-y-3">
                <PriceStep
                  delay={0.15}
                  badge="1"
                  label="Photo strips (2 steps)"
                  amount="₹200"
                  tone="muted"
                />
                <PriceStep
                  delay={0.55}
                  badge="2"
                  label="Kinya Coffee / WATO gift"
                  amount="− ₹100"
                  tone="gold"
                  highlight
                />
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.05, type: "spring", stiffness: 160, damping: 16 }}
                  className="relative overflow-hidden rounded-[28px] border border-emerald-400/40 bg-emerald-500/15 p-6 text-center"
                >
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.22),transparent_60%)]"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                  />
                  <p className="relative text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200">
                    You pay at the booth
                  </p>
                  <p className="relative mt-2 font-serif text-6xl font-bold text-white">₹100</p>
                  <p className="relative mt-2 text-sm leading-relaxed text-emerald-100/80">
                    That’s <strong className="text-[#D4AF37]">two photo strips</strong> after the ₹100 coffee stall discount.
                  </p>
                </motion.div>
              </div>

              <motion.ol
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="mt-7 space-y-2.5 text-sm text-emerald-100/75"
              >
                {[
                  "Visit the Kinya Coffee stall (WATO partner).",
                  "Come to the Visriva photo booth.",
                  "Show this offer — pay ₹100 for 2 strips.",
                ].map((step, i) => (
                  <li key={step} className="flex gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <span className="font-serif text-lg font-bold text-[#D4AF37]">{i + 1}</span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </motion.ol>

              <div className="mt-8 space-y-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setClaimed(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-gradient px-5 py-4 text-sm font-extrabold uppercase tracking-[0.12em] text-[#011F15] shadow-gold-md"
                >
                  {claimed ? <CheckCircle2 className="h-5 w-5" /> : <Coffee className="h-5 w-5" />}
                  {claimed ? "Offer claimed — show this screen" : "I’ve got the ₹100 offer"}
                </motion.button>
                <a
                  href={WA_CREW}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white/80"
                >
                  Message booth crew
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setStage("hub");
                    setClaimed(false);
                  }}
                  className="w-full py-2 text-[11px] font-semibold uppercase tracking-wider text-white/40"
                >
                  Back to tap button
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function PriceStep({
  delay,
  badge,
  label,
  amount,
  tone,
  highlight,
}: {
  delay: number;
  badge: string;
  label: string;
  amount: string;
  tone: "muted" | "gold";
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.45 }}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 ${
        highlight
          ? "border-[#D4AF37]/45 bg-[#D4AF37]/12"
          : "border-white/10 bg-black/35"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D4AF37]/40 font-serif text-sm font-bold text-[#D4AF37]">
          {badge}
        </span>
        <span className="text-sm font-medium text-white/85">{label}</span>
      </div>
      <span
        className={`font-serif text-xl font-bold ${
          tone === "gold" ? "text-[#D4AF37]" : "text-white/70 line-through decoration-white/30"
        }`}
      >
        {amount}
      </span>
    </motion.div>
  );
}
