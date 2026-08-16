"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Camera,
  FolderOpen,
  MessageCircle,
  Phone,
  Sparkles,
  Users,
  Gift,
  CalendarCheck,
  ExternalLink,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import {
  DEFAULT_LIVE_IMPACT_STATS,
  LiveImpactStatsConfig,
  subscribeLiveImpactStats,
  subscribeGlobalContactSettings,
  DEFAULT_GLOBAL_SETTINGS,
  GlobalSettingsConfig,
} from "@/lib/firebase";

const WA =
  "https://wa.me/918884484828?text=" +
  encodeURIComponent("Hi Visriva! I scanned your Live Station QR and want to know more.");

type HubLink = {
  href: string;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  external?: boolean;
};

const LINKS: HubLink[] = [
  {
    href: "/gallery",
    label: "AI Photo Gallery",
    sub: "Find your face · Kwikpic unlock",
    icon: Camera,
    accent: true,
  },
  {
    href: "/captured-moments",
    label: "Captured Moments",
    sub: "Event albums · Drive unlock",
    icon: FolderOpen,
    accent: true,
  },
  {
    href: "https://instagram.com/visriva.co",
    label: "Instagram",
    sub: "@visriva.co · reels & highlights",
    icon: FaInstagram,
    external: true,
  },
  {
    href: WA,
    label: "WhatsApp Concierge",
    sub: "Book · ask · instant reply",
    icon: MessageCircle,
    external: true,
  },
  {
    href: "/reserve",
    label: "Reserve Your Date",
    sub: "Weddings · corporate · gifting",
    icon: CalendarCheck,
  },
  {
    href: "/",
    label: "Full Website",
    sub: "Stations · portfolio · packages",
    icon: Sparkles,
  },
];

function formatStat(n: number, fallback: string) {
  if (!n || n <= 0) return fallback;
  return n.toLocaleString("en-IN") + "+";
}

export default function QrGuestHub() {
  const [stats, setStats] = useState<LiveImpactStatsConfig>(DEFAULT_LIVE_IMPACT_STATS);
  const [contact, setContact] = useState<GlobalSettingsConfig>(DEFAULT_GLOBAL_SETTINGS);
  const cardRef = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 120, damping: 18 });
  const glareX = useTransform(mx, [-0.5, 0.5], [20, 80]);
  const glareY = useTransform(my, [-0.5, 0.5], [20, 80]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(212,175,55,0.22), transparent 58%)`;

  useEffect(() => {
    const unsubStats = subscribeLiveImpactStats(setStats);
    const unsubContact = subscribeGlobalContactSettings((data) => {
      if (data) setContact(data);
    });
    return () => {
      unsubStats();
      unsubContact();
    };
  }, []);

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : e;
    if (!point) return;
    const px = (point.clientX - rect.left) / rect.width - 0.5;
    const py = (point.clientY - rect.top) / rect.height - 0.5;
    mx.set(px);
    my.set(py);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const phone = (contact.phoneNumber || "+91 88844 84828").replace(/\s/g, "");
  const telHref = `tel:${phone.startsWith("+") ? phone : "+91" + phone.replace(/\D/g, "").slice(-10)}`;
  const ig = contact.instagramUrl || "https://instagram.com/visriva.co";

  const dashboard = [
    {
      label: "Guests Served",
      value: formatStat(stats.guestsServed, "Live"),
      icon: Users,
    },
    {
      label: "Keepsakes Printed",
      value: formatStat(stats.souvenirsDelivered, "On-site"),
      icon: Gift,
    },
    {
      label: "Events Executed",
      value: formatStat(stats.eventsExecuted, "Studio"),
      icon: Zap,
    },
  ];

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#01140e] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#032b1d_0%,#01140e_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[28%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.10),transparent_70%)] blur-2xl" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
        animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl"
        animate={{ opacity: [0.25, 0.55, 0.25], y: [0, -18, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-lg flex-col px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
        {/* Brand */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-6 text-center"
        >
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#D4AF37]/90">
            Live Station Guest Hub
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-[0.18em] text-transparent sm:text-5xl bg-gradient-to-br from-white via-white to-[#D4AF37] bg-clip-text">
            VISRIVA
          </h1>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/55">
            Luxury live keepsakes · Bengaluru
          </p>
        </motion.header>

        {/* 3D glass shell */}
        <div className="perspective-[1200px] mb-6 flex justify-center">
          <motion.div
            ref={cardRef}
            style={{ rotateX: rx, rotateY: ry }}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            onTouchMove={onMove}
            onTouchEnd={onLeave}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative w-full max-w-[380px] will-change-transform"
          >
            <div className="relative overflow-hidden rounded-[28px] border border-[#D4AF37]/30 bg-[rgba(3,37,26,0.55)] p-5 shadow-[0_30px_60px_rgba(0,0,0,0.55),inset_0_0_25px_rgba(212,175,55,0.05)] backdrop-blur-2xl sm:p-6">
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[28px]"
                style={{ background: glareBackground }}
              />

              {/* Live pulse */}
              <div className="relative mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200/90">
                    Live track record
                  </span>
                </div>
                <span className="rounded-full border border-[#D4AF37]/25 bg-black/30 px-2.5 py-1 font-mono text-[9px] text-[#D4AF37]">
                  REAL-TIME
                </span>
              </div>

              {/* Stats dashboard */}
              <div className="relative mb-5 grid grid-cols-3 gap-2">
                {dashboard.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.08 }}
                      className="rounded-2xl border border-white/10 bg-black/35 px-2 py-3 text-center"
                    >
                      <Icon className="mx-auto mb-1.5 h-3.5 w-3.5 text-[#D4AF37]" />
                      <p className="font-serif text-lg font-bold leading-none text-white sm:text-xl">
                        {item.value}
                      </p>
                      <p className="mt-1.5 text-[8px] font-semibold uppercase tracking-wider text-white/45">
                        {item.label}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              <p className="relative mb-4 text-center text-[11px] leading-relaxed text-emerald-100/70">
                Instant photo booths · magnets · keychains · mugs · apparel — printed live at your event.
              </p>

              {/* Work showcase strip */}
              <div className="relative mb-1 overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-3">
                  {[
                    { src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80", alt: "Wedding booth" },
                    { src: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80", alt: "Keepsake print" },
                    { src: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80", alt: "Corporate gala" },
                  ].map((img) => (
                    <div key={img.alt} className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="h-full w-full object-cover opacity-90"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#01140e]/80 to-transparent" />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                    Live work
                  </span>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-white/80"
                  >
                    Explore <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Guest links */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="space-y-2.5"
        >
          <div className="mb-1 flex items-center justify-between px-1">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
              Guest portals
            </h2>
            <span className="text-[9px] text-white/35">Tap to open</span>
          </div>

          {LINKS.map((link, i) => {
            const Icon = link.icon;
            const className = `group flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-300 ${
              link.accent
                ? "border-[#D4AF37]/45 bg-[#D4AF37]/10 hover:bg-[#D4AF37] hover:text-[#01140e]"
                : "border-[#D4AF37]/25 bg-white/[0.03] hover:border-[#D4AF37]/60 hover:bg-[#D4AF37] hover:text-[#01140e]"
            }`;

            const inner = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-[#D4AF37] transition group-hover:border-[#01140e]/20 group-hover:bg-[#01140e]/10 group-hover:text-[#01140e]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-semibold tracking-wide text-white transition group-hover:text-[#01140e]">
                    {link.label}
                  </span>
                  <span className="block text-[10px] text-white/45 transition group-hover:text-[#01140e]/70">
                    {link.sub}
                  </span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/30 transition group-hover:text-[#01140e]/70" />
              </>
            );

            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.28 + i * 0.05 }}
              >
                {link.external ? (
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
                    {inner}
                  </a>
                ) : (
                  <Link href={link.href} className={className}>
                    {inner}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </motion.section>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-5 space-y-3"
        >
          <a
            href={telHref}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-5 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-[#01140e] shadow-[0_8px_28px_rgba(212,175,55,0.28)] transition hover:bg-white"
          >
            <Phone className="h-4 w-4" />
            Call / Save Contact
          </a>

          <div className="flex items-center justify-center gap-5 pt-1">
            <a
              href={ig}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 transition hover:text-[#D4AF37]"
              aria-label="Instagram"
            >
              <FaInstagram className="h-5 w-5" />
            </a>
            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 transition hover:text-[#D4AF37]"
              aria-label="WhatsApp"
            >
              <FaWhatsapp className="h-5 w-5" />
            </a>
          </div>

          <p className="pt-2 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-white/25">
            visriva.com/qr · live station
          </p>
        </motion.div>
      </div>
    </main>
  );
}
