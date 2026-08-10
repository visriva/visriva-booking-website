"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Sparkles,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import BookingEngine from "@/components/BookingEngine";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import Link from "next/link";
import {
  subscribeGlobalContactSettings,
  GlobalSettingsConfig,
  DEFAULT_GLOBAL_SETTINGS,
  subscribeFeatureToggles,
  FeatureTogglesConfig,
  DEFAULT_FEATURE_TOGGLES,
  subscribeReservePageConfig,
  type ReservePageConfig,
  subscribeWebsiteText,
  WebsiteTextConfig,
  DEFAULT_WEBSITE_TEXT,
} from "@/lib/firebase";
import { DEFAULT_RESERVE_PAGE_CONFIG } from "@/lib/reservePage";

// Service badge map — only shown if toggle is ON in Admin Panel
const SERVICE_BADGE_MAP: { id: keyof FeatureTogglesConfig; label: string }[] = [
  { id: "enablePhotoBoothService", label: "📸 Instant Photo Booth" },
  { id: "enableMagnetService", label: "🧲 Custom Magnets" },
  { id: "enableKeychainService", label: "🔑 Acrylic Keychains" },
  { id: "enableMugService", label: "☕ Live Mug Printing" },
  { id: "enableToteTshirtService", label: "👕 Tote & T-Shirt Press" },
];

export default function ReservePage() {
  const [settings, setSettings] = useState<GlobalSettingsConfig>(DEFAULT_GLOBAL_SETTINGS);
  const [reservePage, setReservePage] = useState<ReservePageConfig>(DEFAULT_RESERVE_PAGE_CONFIG);
  const [websiteText, setWebsiteText] = useState<WebsiteTextConfig>(DEFAULT_WEBSITE_TEXT);
  const [toggles, setToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);

  useEffect(() => {
    const unsubSettings = subscribeGlobalContactSettings((data) => {
      if (data) setSettings(data);
    });
    const unsubReserve = subscribeReservePageConfig(setReservePage);
    const unsubText = subscribeWebsiteText((data) => {
      if (data) setWebsiteText(data);
    });
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) setToggles(data);
    });

    return () => {
      unsubSettings();
      unsubReserve();
      unsubText();
      unsubToggles();
    };
  }, []);

  // Active services (only ones enabled in admin)
  const activeServices = SERVICE_BADGE_MAP.filter(
    (s) => toggles[s.id] !== false
  );

  // Contact info — always from Admin Panel Global Settings
  const phone = settings.phoneNumber || DEFAULT_GLOBAL_SETTINGS.phoneNumber;
  const email = settings.contactEmail || DEFAULT_GLOBAL_SETTINGS.contactEmail;
  const whatsappLink =
    settings.whatsappLogoLink || `https://wa.me/${settings.whatsappNumber || "918884484828"}?text=Hello%20Visriva!%20I%20want%20to%20reserve%20a%20Live%20Station.`;
  const instagramUrl = settings.instagramUrl || DEFAULT_GLOBAL_SETTINGS.instagramUrl || "https://instagram.com/visriva.co";
  const linkedinUrl = settings.linkedinUrl || DEFAULT_GLOBAL_SETTINGS.linkedinUrl;
  const address = settings.physicalAddress || DEFAULT_GLOBAL_SETTINGS.physicalAddress;

  return (
    <main className="min-h-screen bg-[#011F15] text-white overflow-x-hidden">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#D4AF37]/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />
        <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full bg-[#D4AF37]/3 blur-[80px]" />
      </div>

      {/* ── SLIM TOP HEADER ───────────────────────────────────────── */}
      <header className="relative z-50 border-b border-white/10 bg-[#011F15]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center shadow-gold-sm group-hover:scale-105 transition">
              <Camera className="w-4 h-4 text-[#011F15]" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-white tracking-tight">Visriva</span>
              <span className="text-[#D4AF37] font-light text-xs block leading-none -mt-0.5">Live Station</span>
            </div>
          </Link>

          {/* Live contact from Admin Global Settings */}
          <div className="hidden sm:flex items-center space-x-4 text-xs">
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="flex items-center space-x-1.5 text-white/70 hover:text-white transition"
            >
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{phone}</span>
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center space-x-1.5 text-white/70 hover:text-white transition"
            >
              <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{email}</span>
            </a>
          </div>

          <Link
            href="/"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition"
          >
            <span>← Back to Site</span>
          </Link>
        </div>
      </header>

      {/* ── HERO STRIP ────────────────────────────────────────────── */}
      <section className="relative z-10 pt-12 pb-8 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4 max-w-3xl mx-auto"
        >
          {/* Badge — uses Admin heroTagline */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{reservePage.heroBadge}</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          {/* Title — uses Admin heroTitle */}
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white leading-tight">
            {reservePage.heroTitle}{" "}
            <span className="text-[#D4AF37]">{reservePage.heroTitleHighlight}</span>
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/75 max-w-xl mx-auto leading-relaxed">
            {reservePage.heroSubtitle}
          </p>

          {/* Live Service Badges — only active services from Admin toggles */}
          {activeServices.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {activeServices.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-white/80"
                >
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* ── USP STRIP ─────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {reservePage.uspItems.map((usp, i) => (
            <motion.div
              key={`${usp.title}-${i}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1"
            >
              <div className="text-2xl">{usp.icon}</div>
              <div className="font-bold text-sm text-white">{usp.title}</div>
              <div className="text-[10px] text-emerald-100/60">{usp.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BOOKING ENGINE ────────────────────────────────────────── */}
      {/* BookingEngine itself already subscribes to:
          - GlobalPricingMatrix (pricing per service)
          - BlockedDatesConfig (fully booked / high demand dates)
          - FeatureTogglesConfig (which services are shown)
          All managed from Admin Panel Options 5, 7, 10 */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="rounded-3xl border border-[#D4AF37]/20 overflow-hidden shadow-2xl"
        >
          <BookingEngine />
        </motion.div>
      </section>

      {/* ── QUICK CONTACT FOOTER ──────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10 bg-[#011F15] py-10 px-4 text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gold-gradient flex items-center justify-center">
            <Camera className="w-4 h-4 text-[#011F15]" />
          </div>
          <span className="font-serif font-bold text-lg text-white">Visriva Live Station</span>
        </div>

        {/* Address from Admin Global Settings */}
        <p className="text-xs text-emerald-100/60">{address}</p>

        {/* All contacts from Admin Global Settings */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="flex items-center space-x-1.5 text-white/70 hover:text-[#D4AF37] transition"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{phone}</span>
          </a>
          <a
            href={`mailto:${email}`}
            className="flex items-center space-x-1.5 text-white/70 hover:text-[#D4AF37] transition"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{email}</span>
          </a>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-white/70 hover:text-[#25D366] transition"
          >
            <FaWhatsapp className="w-3.5 h-3.5" />
            <span>WhatsApp Us</span>
          </a>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-white/70 hover:text-pink-400 transition"
          >
            <FaInstagram className="w-3.5 h-3.5" />
            <span>@visriva.co</span>
          </a>
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-white/70 hover:text-blue-400 transition"
          >
            <FaLinkedin className="w-3.5 h-3.5" />
            <span>LinkedIn</span>
          </a>
        </div>

        {/* Footer description from Admin Website Text */}
        <p className="text-[10px] text-white/40 max-w-lg mx-auto leading-relaxed pt-1">
          {websiteText.footerDescription}
        </p>

        <p className="text-[10px] text-white/30">
          © {new Date().getFullYear()} Visriva. All rights reserved.
        </p>
      </footer>

      {/* WhatsApp Floating Widget — uses Admin whatsappLogoLink */}
      <WhatsAppWidget />
    </main>
  );
}
