"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Camera,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle,
  Star,
  Shield,
  Zap,
  Gift,
  TrendingUp,
  Users,
  Calendar,
  Lock,
} from "lucide-react";
import { FaWhatsapp, FaInstagram, FaLinkedin } from "react-icons/fa";
import Link from "next/link";
import {
  subscribeGlobalContactSettings,
  GlobalSettingsConfig,
  DEFAULT_GLOBAL_SETTINGS,
  subscribeLiveImpactStats,
  LiveImpactStatsConfig,
  DEFAULT_LIVE_IMPACT_STATS,
  subscribePlannersConfig,
  PlannersPageConfig,
  DEFAULT_PLANNERS_CONFIG,
} from "@/lib/firebase";

// ─── DATA ────────────────────────────────────────────────────────────────────

const WHY_PARTNER = [
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Exclusive Net Vendor Rates",
    desc: "Registered planners and decorators receive private pricing not available to the public. Your margin, your business.",
  },
  {
    icon: <Gift className="w-6 h-6" />,
    title: "Co-Branding & Custom Overlays",
    desc: "Every print, magnet, and keychain can carry your agency's branding or your client's custom event identity — at no extra charge.",
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: "Priority Date Locking",
    desc: "As a registered partner, get advance access to lock in peak season dates before public availability opens.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Dedicated Partner Manager",
    desc: "You get a single point of contact — available on WhatsApp — to handle quotes, date changes, and event-day logistics.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Same-Day Quote Turnaround",
    desc: "Submit an event brief and receive a fully itemized quotation within hours, not days.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Volume Incentives",
    desc: "Refer 3+ events in a quarter and unlock higher commission tiers and complimentary add-on upgrades for your clients.",
  },
];

const STATIONS = [
  {
    emoji: "📸",
    name: "Instant Photo Booth",
    desc: "Full-frame DSLR, studio strobe lighting, 8-second dye-sublimation prints, instant QR digital gallery.",
    tags: ["Weddings", "Corporate Galas", "Brand Activations"],
  },
  {
    emoji: "🧲",
    name: "Custom Fridge Magnets",
    desc: "High-gloss acrylic magnets with live guest portraits. Fastest-moving souvenir at any event.",
    tags: ["Weddings", "Mehendi", "Sangeet", "Baby Showers"],
  },
  {
    emoji: "🔑",
    name: "Acrylic Keychains",
    desc: "Double-sided crystal-clear acrylic keychains with custom event frames and guest portraits.",
    tags: ["Haldi", "Engagement", "Anniversaries"],
  },
  {
    emoji: "☕",
    name: "Live Mug Printing",
    desc: "Premium ceramic mugs printed live via high-heat sublimation. Ideal luxury return gift.",
    tags: ["Corporate Events", "Product Launches", "VIP Gifting"],
  },
  {
    emoji: "👕",
    name: "Tote Bag & T-Shirt Station",
    desc: "Live heat-press canvas totes and custom apparel. A crowd-stopper at any activation.",
    tags: ["Brand Activations", "College Events", "Fests"],
  },
];

const TESTIMONIALS = [
  {
    quote: "Visriva is the one vendor I book first for every luxury wedding. Their setup is impeccable and clients always ask for the photo booth by name.",
    name: "Meghana R.",
    title: "Senior Wedding Planner, Bengaluru",
  },
  {
    quote: "The magnet station was a sellout. We had 300 guests and every single person queued up twice. The Visriva team handled it with zero drama.",
    name: "Prakash D.",
    title: "Corporate Event Coordinator, Pune",
  },
  {
    quote: "The net vendor rates are genuinely competitive and the co-branding on the prints elevated our agency's visibility at every event.",
    name: "Divya N.",
    title: "Luxury Event Stylist & Decorator",
  },
];

const FAQS = [
  {
    q: "How do I register as a Visriva partner planner?",
    a: "Simply WhatsApp us at +91 88844 84828 mentioning 'Partner Registration'. We'll set up a quick call and add you to our private planner portal.",
  },
  {
    q: "What is the minimum event size for partner rates?",
    a: "Partner rates apply for any event with a minimum of 80 guests. We handle everything from intimate 80-person ceremonies to 1,500+ guest gala dinners.",
  },
  {
    q: "Do you operate outside Bengaluru & Pune?",
    a: "Yes — we can travel to any city across India for premium events. Travel + logistics costs apply and will be included transparently in your quote.",
  },
  {
    q: "Can we run multiple stations at the same event?",
    a: "Absolutely. Most planners book 2–3 stations per event for maximum guest engagement. Bundle pricing is available for multi-station setups.",
  },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PlannersPage() {
  const [settings, setSettings] = useState<GlobalSettingsConfig>(DEFAULT_GLOBAL_SETTINGS);
  const [impactStats, setImpactStats] = useState<LiveImpactStatsConfig>(DEFAULT_LIVE_IMPACT_STATS);
  const [plannersConfig, setPlannersConfig] = useState<PlannersPageConfig>(DEFAULT_PLANNERS_CONFIG);

  useEffect(() => {
    const unsub = subscribeGlobalContactSettings((data) => {
      if (data) setSettings(data);
    });
    const unsubStats = subscribeLiveImpactStats((data) => {
      if (data) setImpactStats(data);
    });
    return () => {
      unsub();
      unsubStats();
    };
  }, []);

  const whatsappPartnerLink = `https://wa.me/${settings.whatsappNumber || "918884484828"}?text=${encodeURIComponent(
    "Hello Visriva Team! I am an event planner / decorator and I'd like to inquire about your exclusive Net Vendor Partner Rates and partnership program."
  )}`;

  const phone = settings.phoneNumber || DEFAULT_GLOBAL_SETTINGS.phoneNumber;
  const email = settings.contactEmail || DEFAULT_GLOBAL_SETTINGS.contactEmail;

  return (
    <main className="min-h-screen bg-[#011F15] text-white overflow-x-hidden">

      {/* ── AMBIENT BACKGROUND ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#D4AF37]/6 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[5%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute top-[45%] left-[35%] w-[350px] h-[350px] rounded-full bg-[#D4AF37]/4 blur-[100px]" />
        {/* Subtle particle grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #D4AF37 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
      </div>

      {/* ── SLIM HEADER ────────────────────────────────────────────── */}
      <header className="relative z-50 border-b border-white/10 bg-[#011F15]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center shadow-gold-sm group-hover:scale-105 transition">
              <Camera className="w-4 h-4 text-[#011F15]" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-white tracking-tight">Visriva</span>
              <span className="text-[#D4AF37] font-light text-xs block leading-none -mt-0.5">Planners Portal</span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center space-x-4 text-xs">
            <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              <span>Partner Portal — Not Indexed</span>
            </span>
          </div>

          <Link href="/" className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition">
            ← Main Site
          </Link>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1: HERO
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 pt-20 pb-16 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{plannersConfig.heroBadge || "Exclusive Partner Program — For Planners & Decorators Only"}</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold text-white leading-[1.05]">
            {plannersConfig.heroTitlePrefix || "Your Clients Deserve "}{" "}
            <span className="text-[#D4AF37]">{plannersConfig.heroTitleHighlight || "Visriva"}</span>
          </h1>

          <p className="text-lg sm:text-xl text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
            {plannersConfig.heroSubtitle || "Partner with Bengaluru's most sought-after live event printing stations. Exclusive net vendor rates, co-branding on every print, and a dedicated crew that makes you look brilliant."}
          </p>

          {/* DUAL CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href={whatsappPartnerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-3 px-8 py-4 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-sm shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] hover:scale-105 transition-all duration-300"
            >
              <FaWhatsapp className="w-5 h-5" />
              <span>Request Exclusive Partner Rates</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="flex items-center space-x-2 px-7 py-4 rounded-full bg-white/5 border border-white/20 text-white font-semibold text-sm hover:border-[#D4AF37]/60 hover:bg-white/10 backdrop-blur-md transition"
            >
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              <span>{phone}</span>
            </a>
          </div>

          {/* Social proof numbers */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-6 border-t border-white/10 mt-6">
            {[
              {
                val: impactStats.eventsExecuted > 0 ? `${impactStats.eventsExecuted}+` : "Live Studio",
                label: "Events Executed",
              },
              {
                val: impactStats.souvenirsDelivered > 0 ? `${impactStats.souvenirsDelivered.toLocaleString("en-IN")}+` : "On-Demand",
                label: "Souvenirs Printed",
              },
              { val: "5 Stations", label: "Live Print Options" },
              { val: "Bengaluru & Pune", label: "Primary Markets" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-serif font-bold text-[#D4AF37]">{s.val}</div>
                <div className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2: WHY PARTNER — 6-CARD GLASSMORPHISM GRID
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-20">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            {plannersConfig.whyPartnerTitle || "Why Partner With Us"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-2">
            {plannersConfig.whyPartnerSubtitle || "The Visriva Planner Advantage"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {(plannersConfig.whyPartnerCards || WHY_PARTNER).map((item: { title: string; desc: string }, i: number) => (
            <motion.div
              key={item.title || i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-[#D4AF37]/40 hover:bg-white/8 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-white mb-2">{item.title}</h3>
              <p className="text-sm text-emerald-100/70 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3: NET VENDOR RATES PITCH
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-[#D4AF37]/30 bg-white/5 backdrop-blur-xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden"
        >
          {/* Glow accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent rounded-3xl" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>{plannersConfig.netRatesTitle || "Exclusive Net Vendor Rates — Partners Only"}</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white">
              {plannersConfig.netRatesSubtitle || "Your Private Pricing Advantage"}
            </h2>

            <p className="text-base text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
              {plannersConfig.netRatesDescription || "We don't post planner pricing publicly — your competitive edge deserves to stay private. Partner rates, volume discounts, and bundle structures are shared directly over WhatsApp after a brief onboarding call."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: "💰", label: "Station Net Rates", desc: "Competitive margins on every live station booking" },
                { icon: "📦", label: "Bundle Discounts", desc: "Multi-station setups with volume-based pricing" },
                { icon: "🎁", label: "Referral Bonuses", desc: "Earn incentives for every event you refer" },
              ].map((item) => (
                <div key={item.label} className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-2 text-center">
                  <div className="text-3xl">{item.icon}</div>
                  <div className="font-bold text-sm text-[#D4AF37]">{item.label}</div>
                  <div className="text-[11px] text-emerald-100/60 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>

            <a
              href={whatsappPartnerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-3 px-10 py-5 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-base shadow-[0_0_40px_rgba(212,175,55,0.5)] hover:shadow-[0_0_60px_rgba(212,175,55,0.7)] hover:scale-105 transition-all duration-300"
            >
              <FaWhatsapp className="w-6 h-6" />
              <span>WhatsApp Us for Net Vendor Rates</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4: FAQ
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-8 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-bold text-white">Partner FAQ</h2>
        </div>
        <div className="space-y-4">
          {(plannersConfig.faqs || FAQS).map((faq: { question: string; answer: string }, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2"
            >
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <span className="text-[#D4AF37]">Q:</span>
                <span>{faq.question}</span>
              </h3>
              <p className="text-sm text-emerald-100/70 leading-relaxed pl-5">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3: NET VENDOR RATES PITCH
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-[#D4AF37]/30 bg-white/5 backdrop-blur-xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden"
        >
          {/* Glow accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent rounded-3xl" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Exclusive Net Vendor Rates — Partners Only</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white">
              Your Private{" "}
              <span className="text-[#D4AF37]">Pricing Advantage</span>
            </h2>

            <p className="text-base text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
              We don't post planner pricing publicly — your competitive edge deserves to stay private.
              Partner rates, volume discounts, and bundle structures are shared directly over WhatsApp after a brief onboarding call.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: "💰", label: "Station Net Rates", desc: "Competitive margins on every live station booking" },
                { icon: "📦", label: "Bundle Discounts", desc: "Multi-station setups with volume-based pricing" },
                { icon: "🎁", label: "Referral Bonuses", desc: "Earn incentives for every event you refer" },
              ].map((item) => (
                <div key={item.label} className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-2 text-center">
                  <div className="text-3xl">{item.icon}</div>
                  <div className="font-bold text-sm text-white">{item.label}</div>
                  <div className="text-[11px] text-emerald-100/60 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>

            <a
              href={whatsappPartnerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-3 px-10 py-5 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-base shadow-[0_0_40px_rgba(212,175,55,0.5)] hover:shadow-[0_0_60px_rgba(212,175,55,0.7)] hover:scale-105 transition-all duration-300"
            >
              <FaWhatsapp className="w-6 h-6" />
              <span>WhatsApp Us for Net Vendor Rates</span>
              <ArrowRight className="w-5 h-5" />
            </a>

            <p className="text-[10px] text-white/40">
              Typically responded to within 2 hours during business hours (9 AM – 9 PM IST)
            </p>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4: LIVE STATIONS CATALOGUE
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-20">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Our Portfolio</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-2">5 Flagship Live Stations</h2>
          <p className="text-sm text-emerald-100/70 mt-2 max-w-xl mx-auto">Every station is available for booking individually or as a curated multi-station suite.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {STATIONS.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-[#D4AF37]/40 transition-all duration-300 space-y-3"
            >
              <div className="text-4xl">{s.emoji}</div>
              <h3 className="font-serif font-bold text-lg text-white">{s.name}</h3>
              <p className="text-sm text-emerald-100/70 leading-relaxed">{s.desc}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {s.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 5: PLANNER TESTIMONIALS
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 pb-20">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Planner Testimonials</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-2">What Our Partners Say</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4"
            >
              <div className="flex text-[#D4AF37]">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#D4AF37]" />
                ))}
              </div>
              <p className="text-sm text-emerald-100/80 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="pt-2 border-t border-white/10">
                <div className="font-bold text-sm text-white">{t.name}</div>
                <div className="text-[10px] text-emerald-100/60">{t.title}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 6: FAQ
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-8 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-bold text-white">Partner FAQ</h2>
        </div>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2"
            >
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                <h3 className="font-bold text-sm text-white">{faq.q}</h3>
              </div>
              <p className="text-sm text-emerald-100/70 leading-relaxed pl-7">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 7: FINAL CTA STRIP
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-emerald-500/5 backdrop-blur-xl p-10 sm:p-14 text-center space-y-6"
        >
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white">
            Ready to <span className="text-[#D4AF37]">Partner?</span>
          </h2>
          <p className="text-base text-emerald-100/80 max-w-xl mx-auto">
            One WhatsApp message is all it takes to unlock exclusive planner rates, priority dates, and a dedicated account manager.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={whatsappPartnerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-3 px-9 py-5 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-base shadow-[0_0_40px_rgba(212,175,55,0.5)] hover:shadow-[0_0_60px_rgba(212,175,55,0.7)] hover:scale-105 transition-all duration-300"
            >
              <FaWhatsapp className="w-6 h-6" />
              <span>WhatsApp to Register as Partner</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-white/60">
            <a href={`mailto:${email}`} className="flex items-center space-x-1.5 hover:text-[#D4AF37] transition">
              <Mail className="w-3.5 h-3.5" />
              <span>{email}</span>
            </a>
            <a href={`${settings.instagramUrl || "https://instagram.com/visriva.live"}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1.5 hover:text-pink-400 transition">
              <FaInstagram className="w-3.5 h-3.5" />
              <span>@visriva.live</span>
            </a>
            <a href={`${settings.linkedinUrl || "https://linkedin.com/company/visriva"}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1.5 hover:text-blue-400 transition">
              <FaLinkedin className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-4 text-center">
        <p className="text-[10px] text-white/30">
          © {new Date().getFullYear()} Visriva Live Station · Bengaluru &amp; Pune · Partner Portal · Page Not Indexed
        </p>
      </footer>
    </main>
  );
}
