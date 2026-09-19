"use client";

import React from "react";
import Link from "next/link";
import { Camera, FolderOpen, MessageCircle, Sparkles, CalendarCheck } from "lucide-react";
import { FaInstagram } from "react-icons/fa";

const WA = "https://wa.me/918884484828?text=" + encodeURIComponent("Hi Visriva! I scanned your Live Station QR and want to know more.");

export default function QrGuestHub() {
  const links = [
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
        <header className="mb-6 text-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#D4AF37]/90">Live Station Guest Hub</p>
          <h1 className="font-serif text-4xl font-bold tracking-[0.18em] text-transparent sm:text-5xl bg-gradient-to-br from-white via-white to-[#D4AF37] bg-clip-text">VISRIVA</h1>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/55">Luxury live keepsakes · Bengaluru</p>
        </header>
        <section className="space-y-2.5">
          {links.map((item) => {
            const Icon = item.icon;
            return item.external ? (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
                <Icon className="h-5 w-5 shrink-0 text-[#D4AF37]" />
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.label}</span><span className="block text-xs text-white/45">{item.sub}</span></span>
              </a>
            ) : (
              <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
                <Icon className="h-5 w-5 shrink-0 text-[#D4AF37]" />
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.label}</span><span className="block text-xs text-white/45">{item.sub}</span></span>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
