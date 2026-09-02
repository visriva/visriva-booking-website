"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle2, Coffee, Instagram, Sparkles } from "lucide-react";

const WA_CREW =
  "https://wa.me/918884484828?text=" +
  encodeURIComponent(
    "Hi Visriva! I claimed the Kinya Coffee / WATO ₹100 photo-strip offer. Ready at the booth."
  );

type Stage = "code" | "checking" | "unlocked";

export default function KinyaWatoOffer() {
  const [stage, setStage] = useState<Stage>("code");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (stage !== "checking") return;
    const timer = window.setTimeout(() => setStage("unlocked"), 1800);
    return () => window.clearTimeout(timer);
  }, [stage]);

  const unlock = () => {
    if (code.trim().toLowerCase() !== "coffee") {
      setError("That code isn't valid. Enter the code from the Kinya Coffee stall.");
      return;
    }
    setError("");
    setStage("checking");
  };

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#01140e] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,#063322_0%,#01140e_68%)]" />
      <div className="pointer-events-none absolute -left-16 top-24 h-64 w-64 rounded-full bg-amber-700/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-10 bottom-16 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl animate-pulse" />

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
            Kinya Coffee
          </span>
        </div>

        {stage === "code" && (
          <section className="flex flex-1 flex-col animate-[fadeIn_.45s_ease-out]">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 shadow-[0_0_35px_rgba(212,175,55,0.16)]">
                <Coffee className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#D4AF37]">
                Exclusive booth offer
              </p>
              <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">
                Kinya Coffee
                <span className="block text-2xl font-medium text-[#D4AF37] sm:text-3xl">× WATO</span>
              </h1>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-emerald-100/70">
                Enter the discount code given at the Kinya Coffee stall to unlock your special photo-strip price.
              </p>
            </div>

            <div className="rounded-[28px] border border-[#D4AF37]/25 bg-black/35 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Discount code</p>
                  <p className="mt-1 text-sm font-semibold text-white/80">Kinya Coffee partner code</p>
                </div>
                <Sparkles className="h-5 w-5 text-[#D4AF37]" />
              </div>

              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") unlock();
                }}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                placeholder="Enter code"
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-center font-mono text-xl font-bold uppercase tracking-[0.3em] text-white outline-none placeholder:text-white/25 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/15"
              />

              {error && <p className="mt-3 text-center text-xs font-medium text-red-300">{error}</p>}

              <button
                type="button"
                onClick={unlock}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#e8c75a] to-[#B89223] px-5 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-[#011F15] shadow-[0_12px_30px_rgba(212,175,55,0.28)] transition-transform active:scale-[0.98]"
              >
                Unlock my ₹100 discount
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <Coffee className="mx-auto mb-2 h-5 w-5 text-amber-300" />
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Partner</p>
                <p className="mt-1 font-serif text-lg font-bold">Kinya Coffee</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <Camera className="mx-auto mb-2 h-5 w-5 text-[#D4AF37]" />
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Your deal</p>
                <p className="mt-1 font-serif text-lg font-bold">₹100 off</p>
              </div>
            </div>
          </section>
        )}

        {stage === "checking" && (
          <section className="flex flex-1 flex-col items-center justify-center text-center animate-[fadeIn_.35s_ease-out]">
            <div className="relative mb-7 flex h-28 w-28 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10">
              <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/30 animate-ping" />
              <Coffee className="h-11 w-11 text-[#D4AF37] animate-bounce" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">Verifying offer</p>
            <h2 className="mt-3 font-serif text-3xl font-bold">Checking your Coffee code…</h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-emerald-100/60">
              Applying your Kinya Coffee partner discount and preparing your booth pass.
            </p>
            <div className="mt-7 h-1.5 w-52 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 rounded-full bg-[#D4AF37] animate-[slide_1.1s_ease-in-out_infinite]" />
            </div>
          </section>
        )}

        {stage === "unlocked" && (
          <section className="flex flex-1 flex-col animate-[fadeIn_.55s_ease-out]">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-400/15 shadow-[0_0_50px_rgba(52,211,153,0.2)] animate-[pop_.5s_ease-out]">
                <CheckCircle2 className="h-10 w-10 text-emerald-300" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300">Offer unlocked</p>
              <h1 className="mt-2 font-serif text-4xl font-bold sm:text-5xl">You got ₹100 OFF!</h1>
              <p className="mt-3 text-sm text-emerald-100/70">Your Kinya Coffee × WATO booth discount is ready.</p>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-[#D4AF37]/45 bg-[#D4AF37]/10 p-6 text-center shadow-[0_20px_60px_rgba(212,175,55,0.15)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.22),transparent_62%)]" />
              <p className="relative text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Your photo-strip price</p>
              <div className="relative mt-3 flex items-center justify-center gap-3">
                <span className="font-serif text-3xl font-bold text-white/35 line-through">₹200</span>
                <span className="font-serif text-6xl font-bold text-[#D4AF37]">₹100</span>
              </div>
              <p className="relative mt-3 text-sm leading-relaxed text-emerald-100/80">
                <strong className="text-white">2 photo strips</strong> for ₹100 at the Visriva booth.
              </p>
              <div className="relative mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs font-semibold text-emerald-100/80">
                Show this unlocked screen to the booth crew to redeem.
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => setClaimed(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#e8c75a] to-[#B89223] px-5 py-4 text-sm font-extrabold uppercase tracking-[0.1em] text-[#011F15] shadow-[0_12px_30px_rgba(212,175,55,0.25)] active:scale-[0.98]"
              >
                {claimed ? <CheckCircle2 className="h-5 w-5" /> : <Coffee className="h-5 w-5" />}
                {claimed ? "Offer claimed — show this screen" : "I’m at the booth"}
              </button>
              <a
                href={WA_CREW}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white/80"
              >
                Message booth crew
              </a>
              <Link
                href="https://instagram.com/visriva.co"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white/70"
              >
                <Instagram className="h-4 w-4" />
                Follow @visriva.co
              </Link>
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pop { 0% { opacity: 0; transform: scale(.55); } 70% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes slide { 0% { transform: translateX(-120%); } 100% { transform: translateX(260%); } }
      `}</style>
    </main>
  );
}
