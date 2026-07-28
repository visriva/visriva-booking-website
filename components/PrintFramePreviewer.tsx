"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Palette, Crown, Heart, Briefcase, Camera, Check, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  subscribePrintPreviewerConfig,
  PrintPreviewerConfig,
  DEFAULT_PRINT_PREVIEWER_CONFIG,
} from "@/lib/firebase";

const THEMES = [
  {
    id: "royal-gold",
    name: "Royal Gold Monogram",
    icon: Crown,
    badgeBg: "bg-[#D4AF37] text-[#011F15]",
    borderStyle: "border-[#D4AF37]",
    bgGradient: "from-[#041a12] via-[#011F15] to-[#082e20]",
    titleFont: "font-cinzel text-[#D4AF37]",
    subFont: "font-serif text-[#ffe97a]",
    watermarkColor: "text-[#D4AF37]/80",
    previewImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "floral-luxury",
    name: "Floral Luxury Sangeet",
    icon: Heart,
    badgeBg: "bg-rose-400 text-rose-950",
    borderStyle: "border-rose-300/80",
    bgGradient: "from-[#290a18] via-[#1a0510] to-[#3b0f24]",
    titleFont: "font-playfair text-rose-200",
    subFont: "font-cormorant text-rose-300/90",
    watermarkColor: "text-rose-300/70",
    previewImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "corporate-summit",
    name: "Corporate Tech Summit",
    icon: Briefcase,
    badgeBg: "bg-cyan-400 text-cyan-950",
    borderStyle: "border-cyan-400/80",
    bgGradient: "from-[#051829] via-[#020b14] to-[#0a2742]",
    titleFont: "font-sans font-extrabold text-cyan-200 uppercase tracking-widest",
    subFont: "font-mono text-cyan-300/80 text-xs",
    watermarkColor: "text-cyan-300/70",
    previewImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "retro-polaroid",
    name: "Vintage Polaroid Keepsake",
    icon: Camera,
    badgeBg: "bg-amber-200 text-amber-950",
    borderStyle: "border-amber-100",
    bgGradient: "from-[#1c1813] via-[#0f0d0a] to-[#2e271f]",
    titleFont: "font-cormorant italic text-amber-100 text-xl sm:text-2xl",
    subFont: "font-mono text-amber-200/70 text-xs",
    watermarkColor: "text-amber-200/70",
    previewImage: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
  },
];

export default function PrintFramePreviewer() {
  const [config, setConfig] = useState<PrintPreviewerConfig>(DEFAULT_PRINT_PREVIEWER_CONFIG);
  const [eventName, setEventName] = useState("Ananya & Rohan's Sangeet");
  const [eventDate, setEventDate] = useState("14th December 2026 • The Leela Palace");
  const [selectedThemeId, setSelectedThemeId] = useState("royal-gold");
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [activeSize, setActiveSize] = useState<"4x6" | "2x6" | "3x4" | "2x4" | "custom">("4x6");

  // Subscribe to Admin Firestore CMS Config
  useEffect(() => {
    const unsub = subscribePrintPreviewerConfig((data) => {
      if (data) {
        setConfig(data);
        if (data.defaultSize) setActiveSize(data.defaultSize);
      }
    });
    return () => unsub();
  }, []);

  // Hides cleanly if master toggle turned OFF in Admin Panel
  if (config.isVisible === false) {
    return null;
  }

  const activeTheme = THEMES.find((t) => t.id === selectedThemeId) || THEMES[0];
  const sampleImage = config.previewImageUrl || activeTheme.previewImage;

  const handleUseInBooking = (e: React.MouseEvent) => {
    e.preventDefault();
    const elem = document.getElementById("booking-engine");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 4000);
  };

  return (
    <section className="py-20 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-bold uppercase tracking-widest backdrop-blur-md font-cinzel">
            <Palette className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Interactive Custom Branding Studio</span>
          </div>
          <h2 className="font-playfair text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Design Your <span className="text-gold-gradient">Custom Print Template</span>
          </h2>
          <p className="font-sans text-emerald-100/80 text-sm sm:text-base font-light leading-relaxed">
            Type your wedding couple names or corporate event title below to preview your high-gloss dye-sublimation print overlay in real-time.
          </p>

          {/* Size Selector Bar */}
          <div className="flex items-center justify-center space-x-2 pt-2">
            {[
              { id: "4x6", label: "4×6 Classic Card" },
              { id: "2x6", label: "2×6 Photo Strip" },
              { id: "3x4", label: "3×4 Magnet Acrylic" },
            ].map((sz) => (
              <button
                key={sz.id}
                onClick={() => setActiveSize(sz.id as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold font-mono transition-all cursor-pointer ${
                  activeSize === sz.id
                    ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm"
                    : "bg-white/5 text-white/70 hover:text-white border border-white/10"
                }`}
              >
                {sz.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
          
          {/* LEFT: Controls & Input Options */}
          <div className="lg:col-span-5 space-y-6 glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl bg-white/5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                1. Event Title / Couple Names
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Ananya & Rohan's Sangeet"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-serif text-sm focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                2. Subtitle / Venue &amp; Date
              </label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="e.g. 14th Dec 2026 • The Leela Palace"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-sans text-xs focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {/* Size Format Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                3. Choose Physical Print Dimensions
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "4x6", label: "4×6 Classic Card" },
                  { id: "2x6", label: "2×6 Photo Strip" },
                  { id: "3x4", label: "3×4 Magnet Acrylic" },
                  { id: "2x4", label: "2×4 Mini Card" },
                ].map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setActiveSize(sz.id as "4x6" | "2x6" | "3x4")}
                    className={`px-3 py-2 rounded-xl text-[11px] font-mono font-bold transition cursor-pointer border ${
                      activeSize === sz.id
                        ? "bg-[#D4AF37] text-[#011F15] border-[#D4AF37] shadow-gold-sm"
                        : "bg-black/40 text-white/70 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selector Grid */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                4. Choose Luxury Frame Theme
              </label>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((theme) => {
                  const isSelected = theme.id === selectedThemeId;
                  const Icon = theme.icon;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? "bg-[#D4AF37]/20 border-[#D4AF37] shadow-gold-sm"
                          : "bg-black/30 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-[#D4AF37]" : "text-white/50"}`} />
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                      </div>
                      <span className="text-xs font-bold text-white block leading-tight font-serif">
                        {theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleUseInBooking}
              className="w-full py-3.5 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-widest shadow-gold-sm hover:scale-105 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Use This Custom Design in Booking</span>
            </button>

            {copiedMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold text-center animate-fade-in">
                ✨ Custom design saved! Scrolled down to Booking Engine.
              </div>
            )}
          </div>

          {/* RIGHT: Live High-Gloss Print Card Preview */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4AF37] mb-1 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                {activeSize === "2x6"
                  ? "2×6 Photo Strip Bookmark Render"
                  : activeSize === "3x4"
                  ? "3×4 Magnet Acrylic Render"
                  : (activeSize as string) === "2x4"
                  ? "2×4 Mini Card Render"
                  : "4×6 High-Gloss Print Card Render"}
              </span>
            </div>

            {activeSize === "2x6" && (
              <div className="text-[11px] font-mono text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 rounded-full mb-3 shadow-sm">
                ✂️ Default: Prints 2 Duplicate Strips Per Session (1 for Guest + 1 for Album)
              </div>
            )}

            {/* DYNAMIC SIZE PRINT CARDS */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedThemeId + activeSize + sampleImage}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`relative rounded-2xl overflow-hidden border-4 ${activeTheme.borderStyle} shadow-[0_20px_50px_rgba(0,0,0,0.8)] bg-gradient-to-br ${activeTheme.bgGradient} p-4 flex flex-col justify-between select-none ${
                  activeSize === "2x6"
                    ? "w-48 h-[440px] aspect-[2/6] items-center"
                    : activeSize === "3x4"
                    ? "w-64 h-[340px] aspect-[3/4]"
                    : (activeSize as string) === "2x4"
                    ? "w-48 h-[340px] aspect-[2/4]"
                    : "w-full max-w-lg aspect-[3/2]"
                }`}
              >
                {/* Gold Corner Filigree Accent Ornaments */}
                <div className="absolute top-2 left-2 text-[10px] font-serif text-[#D4AF37]/40 pointer-events-none">✦ ✤</div>
                <div className="absolute top-2 right-2 text-[10px] font-serif text-[#D4AF37]/40 pointer-events-none">✤ ✦</div>
                <div className="absolute bottom-2 left-2 text-[10px] font-serif text-[#D4AF37]/40 pointer-events-none">✦ ✤</div>
                <div className="absolute bottom-2 right-2 text-[10px] font-serif text-[#D4AF37]/40 pointer-events-none">✤ ✦</div>

                {/* LAYOUT 1: 2x6 TALL PHOTO STRIP (3 Stacked Photo Slots) */}
                {activeSize === "2x6" ? (
                  <div className="w-full h-full flex flex-col justify-between space-y-2">
                    <div className="flex-1 space-y-2 overflow-hidden flex flex-col">
                      {[1, 2, 3].map((num) => (
                        <div key={num} className="flex-1 rounded-lg overflow-hidden bg-black/70 border border-white/20 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={sampleImage} alt="Strip slot" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    
                    {/* Bottom Strip Title Overlay */}
                    <div className="text-center pt-1 space-y-0.5">
                      <h4 className={`text-xs font-bold leading-tight truncate ${activeTheme.titleFont}`}>
                        {eventName || "Ananya & Rohan"}
                      </h4>
                      <p className={`text-[8px] truncate ${activeTheme.subFont}`}>
                        {eventDate || "14th Dec 2026"}
                      </p>
                      <span className={`text-[7px] font-cinzel font-black uppercase tracking-widest block pt-0.5 ${activeTheme.watermarkColor}`}>
                        {config.customWatermarkText || "Visriva Live"}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* LAYOUT 2 & 3: 4x6 Card or 3x4 Magnet Frame */
                  <>
                    <div className="relative flex-1 rounded-xl overflow-hidden bg-black/70 border border-white/20 shadow-inner group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sampleImage}
                        alt="Live Print Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-60 pointer-events-none" />
                    </div>

                    <div className="pt-3 flex items-end justify-between gap-4">
                      <div className="space-y-0.5 max-w-[75%]">
                        <h4 className={`text-base sm:text-xl font-bold leading-tight truncate ${activeTheme.titleFont}`}>
                          {eventName || "Ananya & Rohan's Sangeet"}
                        </h4>
                        <p className={`text-[10px] sm:text-xs truncate ${activeTheme.subFont}`}>
                          {eventDate || "14th December 2026 • Bengaluru"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[9px] sm:text-[10px] font-cinzel uppercase tracking-widest font-black block ${activeTheme.watermarkColor}`}>
                          {config.customWatermarkText || "Visriva Live"}
                        </span>
                        <span className="text-[7px] text-white/50 font-mono uppercase block tracking-tighter">
                          {config.customNotes || "8-Sec Print"}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            
            <p className="text-[11px] text-emerald-100/60 font-mono mt-3">
              *Printed live on-site in 8 seconds using dye-sublimation heat transfer engines.
            </p>

            <div className="pt-4">
              <a
                href="/frame-customizer"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-widest shadow-gold-sm hover:shadow-gold-md hover:scale-105 transition-all"
              >
                <span>🎨 Launch Full Design Studio &amp; Export PNG</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
