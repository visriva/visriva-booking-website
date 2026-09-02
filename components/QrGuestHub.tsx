"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Coffee, FolderOpen, Instagram, MessageCircle, Sparkles, CalendarCheck } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { subscribeFeatureToggles, FeatureTogglesConfig } from "@/lib/firebase";

const WA =
  "https://wa.me/918884484828?text=" +
  encodeURIComponent("Hi Visriva! I scanned your Live Station QR and want to know more.");

export default function QrGuestHub() {
  const [limited, setLimited] = useState(true);

  useEffect(() => {
    return subscribeFeatureToggles((config) => {
      const value = (config as FeatureTogglesConfig & { enableQrGuestHubLimited?: boolean }).enableQrGuestHubLimited;
      setLimited(typeof value === "boolean" ? value : true);
    });
  }, []);

  return limited ? <LimitedHub /> : <FullHub />;
}

function LimitedHub() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#01140e] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#063322_0%,#01140e_68%)]" />
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-amber-700/15 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-3xl animate-pulse" />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-lg flex-col px-4 pb-12 pt-12 sm:px-6 sm:pt-16">
        <header className="mb-8 text-center animate-[fadeIn_.5s_ease-out]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 shadow-[0_0_40px_rgba(212,175,55,0.15)]"><Sparkles className="h-7 w-7 text-[#D4AF37]" /></div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] text-[#D4AF37]">Live Station Guest Hub</p>
          <h1 className="font-serif text-4xl font-bold tracking-[0.18em] text-transparent sm:text-5xl bg-gradient-to-br from-white via-white to-[#D4AF37] bg-clip-text">VISRIVA</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-white/45">Tonight’s exclusive guest offers</p>
        </header>
        <section className="space-y-4 animate-[fadeIn_.65s_ease-out_.1s_both]">
          <Link href="/kinya-wato" className="group relative flex overflow-hidden rounded-[28px] border border-[#D4AF37]/60 bg-gradient-to-br from-[#D4AF37] via-[#e8c75a] to-[#B89223] p-5 shadow-[0_18px_45px_rgba(212,175,55,0.3)] transition-transform active:scale-[0.98]">
            <span className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-white/25 animate-[shine_2.8s_ease-in-out_infinite]" />
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#01140e]/15 text-[#01140e]"><Coffee className="h-7 w-7" /></span>
            <span className="relative ml-4 min-w-0 flex-1 text-left">
              <span className="block text-[9px] font-extrabold uppercase tracking-[0.25em] text-[#01140e]/65">Exclusive tonight</span>
              <span className="mt-1 block font-serif text-2xl font-bold leading-tight text-[#01140e]">Kinya Coffee · WATO Offer</span>
              <span className="mt-1.5 block text-xs font-bold text-[#01140e]/75">Enter code COFFEE → unlock ₹100 OFF</span>
            </span>
          </Link>
          <a href="https://instagram.com/visriva.co" target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white/85 backdrop-blur-xl transition-transform active:scale-[0.98]"><Instagram className="h-5 w-5" />Follow @visriva.co</a>
        </section>
        <p className="mt-auto pt-10 text-center text-[10px] uppercase tracking-[0.22em] text-white/25">Visriva · Luxury live keepsakes</p>
      </div>
      <style jsx>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } } @keyframes shine { 0%, 25% { transform: translateX(0) skewX(-18deg); } 65%, 100% { transform: translateX(420%) skewX(-18deg); } }`}</style>
    </main>
  );
}

function FullHub() {
  const links = [
    { href: "/kinya-wato", label: "Kinya Coffee · WATO Offer", sub: "₹100 off · pay ₹100 for 2 photo strips", icon: Coffee },
    { href: "/guest/demo", label: "Event Guest Portal", sub: "VIP card · itinerary · photo wall", icon: Sparkles },
    { href: "/gallery", label: "AI Photo Gallery", sub: "Find your face · Kwikpic unlock", icon: Camera },
    { href: "/captured-moments", label: "Captured Moments", sub: "Event albums · Drive unlock", icon: FolderOpen },
    { href: "https://instagram.com/visriva.co", label: "Instagram", sub: "@visriva.co · reels & highlights", icon: FaInstagram, external: true },
    { href: WA, label: "WhatsApp Concierge", sub: "Book · ask · instant reply", icon: MessageCircle, external: true },
    { href: "/reserve", label: "Reserve Your Date", sub: "Weddings · corporate · gifting", icon: CalendarCheck },
    { href: "/", label: "Full Website", sub: "Stations · portfolio · packages", icon: Sparkles },
  ];

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#01140e] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#032b1d_0%,#01140e_70%)]" />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-lg flex-col px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
        <header className="mb-6 text-center"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#D4AF37]/90">Live Station Guest Hub</p><h1 className="font-serif text-4xl font-bold tracking-[0.18em] text-transparent sm:text-5xl bg-gradient-to-br from-white via-white to-[#D4AF37] bg-clip-text">VISRIVA</h1><p className="mt-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/55">Luxury live keepsakes · Bengaluru</p></header>
        <section className="space-y-2.5">
          {links.map((item) => { const Icon = item.icon; return item.external ? <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"><Icon className="h-5 w-5 shrink-0 text-[#D4AF37]" /><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.label}</span><span className="block text-xs text-white/45">{item.sub}</span></span></a> : <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"><Icon className="h-5 w-5 shrink-0 text-[#D4AF37]" /><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.label}</span><span className="block text-xs text-white/45">{item.sub}</span></span></Link>; })}
        </section>
      </div>
    </main>
  );
}
