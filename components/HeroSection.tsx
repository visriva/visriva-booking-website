"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Camera, Play, Layers, Printer, Magnet, Key, Coffee } from "lucide-react";
import { motion } from "framer-motion";
import {
  subscribeSiteSettings,
  DEFAULT_SITE_SETTINGS,
  SiteSettings,
  subscribeWebsiteText,
  DEFAULT_WEBSITE_TEXT,
  WebsiteTextConfig,
} from "@/lib/firebase";
import Magnetic3DButton from "@/components/Magnetic3DButton";
import TiltCard from "@/components/TiltCard";
import MaskedText from "@/components/MaskedText";

export default function HeroSection() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [webText, setWebText] = useState<WebsiteTextConfig>(DEFAULT_WEBSITE_TEXT);
  const containerRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    const unsub = subscribeSiteSettings((newSettings) => {
      setSettings(newSettings);
    });
    const unsubText = subscribeWebsiteText((data) => {
      if (data) setWebText(data);
    });
    return () => {
      unsub();
      unsubText();
    };
  }, []);

  const scrollToBooking = (e: React.MouseEvent) => {
    e.preventDefault();
    const bookingElem = document.getElementById("booking-engine");
    if (bookingElem) {
      bookingElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={containerRef}
      style={{ perspective: "1200px" }}
      className="relative min-h-screen flex items-center pt-36 sm:pt-40 pb-20 overflow-hidden bg-transparent"
    >
      {/* Content Wrapper */}
      <div className="w-full h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* LEFT COLUMN: Editorial Headline & Actions (lg:col-span-7) */}
            <div className="lg:col-span-7 text-left space-y-6">
              
              {/* Live Status Badge */}
              <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full bg-black/50 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold tracking-widest uppercase backdrop-blur-md shadow-md font-cinzel">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4AF37]" />
                </span>
                <span>Visriva • {webText.heroTagline || "Bengaluru's Premier Live Event Station"}</span>
              </div>

              {/* H1 Hero Headline */}
              <MaskedText
                text={webText.heroTitle || settings.heroTitle || "Visriva Live Station"}
                className="font-playfair text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] text-left"
              />

              {/* Subheadline & Description */}
              <p className="font-cormorant text-xl sm:text-2xl md:text-3xl text-[#D4AF37] font-semibold tracking-wide">
                {webText.heroSubtitle || settings.heroSubtitle}
              </p>

              <p className="font-sans text-sm sm:text-base md:text-lg text-emerald-100/90 font-light leading-relaxed max-w-xl">
                {webText.aboutText}
              </p>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 w-full max-w-xl">
                <Magnetic3DButton onClick={scrollToBooking} href="#booking-engine">
                  <div className="w-full sm:w-auto min-w-[180px] px-8 py-4 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-sm shadow-gold-lg hover:shadow-gold-md flex items-center justify-center space-x-2 cursor-pointer">
                    <span>Book Station</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Magnetic3DButton>

                <Magnetic3DButton href="/photo-booth">
                  <div className="w-full sm:w-auto min-w-[180px] px-7 py-4 rounded-full bg-black/40 border border-[#D4AF37]/50 text-white font-semibold text-sm hover:border-[#D4AF37] hover:bg-black/60 backdrop-blur-xl flex items-center justify-center space-x-2 cursor-pointer">
                    <Camera className="w-4 h-4 text-[#D4AF37]" />
                    <span>Photo Booth</span>
                  </div>
                </Magnetic3DButton>

                <Magnetic3DButton href="#services">
                  <div className="w-full sm:w-auto min-w-[150px] px-6 py-4 rounded-full bg-white/5 border border-white/20 text-emerald-100 font-medium text-sm hover:text-white hover:border-[#D4AF37]/60 backdrop-blur-xl flex items-center justify-center space-x-2 cursor-pointer">
                    <Play className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                    <span>Explore All</span>
                  </div>
                </Magnetic3DButton>
              </div>

              {/* 4 SERVICE QUICK NAVIGATION BUTTONS */}
              <div className="pt-6 w-full max-w-xl">
                <div className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold mb-3 flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Our 4 Luxury Live Stations</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link
                    href="/services/photo-booth"
                    className="p-3.5 rounded-2xl bg-black/40 border border-[#D4AF37]/30 text-white hover:text-[#D4AF37] hover:bg-black/60 hover:border-[#D4AF37] transition-all duration-300 backdrop-blur-md flex flex-col items-center justify-center text-center group shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform mb-2 shadow-gold-sm">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-serif leading-tight">Photo Booth</span>
                    <span className="text-[10px] text-emerald-200/80 font-mono mt-0.5">Live Studio</span>
                  </Link>

                  <Link
                    href="/services/magnet-station"
                    className="p-3.5 rounded-2xl bg-black/40 border border-[#D4AF37]/30 text-white hover:text-[#D4AF37] hover:bg-black/60 hover:border-[#D4AF37] transition-all duration-300 backdrop-blur-md flex flex-col items-center justify-center text-center group shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform mb-2 shadow-gold-sm">
                      <Magnet className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-serif leading-tight">Magnets</span>
                    <span className="text-[10px] text-emerald-200/80 font-mono mt-0.5">Acrylic Gloss</span>
                  </Link>

                  <Link
                    href="/services/keychain-station"
                    className="p-3.5 rounded-2xl bg-black/40 border border-[#D4AF37]/30 text-white hover:text-[#D4AF37] hover:bg-black/60 hover:border-[#D4AF37] transition-all duration-300 backdrop-blur-md flex flex-col items-center justify-center text-center group shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform mb-2 shadow-gold-sm">
                      <Key className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-serif leading-tight">Keychains</span>
                    <span className="text-[10px] text-emerald-200/80 font-mono mt-0.5">Dual-Sided</span>
                  </Link>

                  <Link
                    href="/services/mug-printing"
                    className="p-3.5 rounded-2xl bg-black/40 border border-[#D4AF37]/30 text-white hover:text-[#D4AF37] hover:bg-black/60 hover:border-[#D4AF37] transition-all duration-300 backdrop-blur-md flex flex-col items-center justify-center text-center group shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform mb-2 shadow-gold-sm">
                      <Coffee className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-serif leading-tight">Mugs</span>
                    <span className="text-[10px] text-emerald-200/80 font-mono mt-0.5">VIP Sublimation</span>
                  </Link>
                </div>
              </div>

              {/* Spec Highlights Bar */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20 max-w-xl">
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold font-serif text-[#D4AF37]">8s</div>
                  <div className="text-[10px] sm:text-xs text-emerald-200/90 uppercase tracking-wider font-semibold">Print Speed</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold font-serif text-[#D4AF37]">4K</div>
                  <div className="text-[10px] sm:text-xs text-emerald-200/90 uppercase tracking-wider font-semibold">Studio Optics</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold font-serif text-[#D4AF37]">500+</div>
                  <div className="text-[10px] sm:text-xs text-emerald-200/90 uppercase tracking-wider font-semibold">VIP Events</div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Interactive 3D Staggered Floating Cards Deck (lg:col-span-5) */}
            <div className="lg:col-span-5 w-full relative h-[480px] sm:h-[520px] flex items-center justify-center">
              <TiltCard maxDegree={12} className="w-full h-full relative flex items-center justify-center">
                
                {/* Card 1: Back Layer (Keychains & Mugs) */}
                <div className="absolute top-2 left-0 sm:left-2 w-[85%] sm:w-72 p-5 sm:p-6 rounded-2xl border border-white/10 bg-[#01281c] shadow-[0_15px_35px_rgba(0,0,0,0.6)] transform -rotate-6 transition-all duration-500 hover:rotate-0 hover:scale-[1.04] hover:z-40 hover:border-[#D4AF37]/50 hover:bg-[#023b29] hover:shadow-[0_25px_50px_rgba(0,0,0,0.85)] group cursor-pointer z-10">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/15 flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-[#011F15] transition-all">
                      <Printer className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/15 px-2.5 py-1 rounded-full border border-[#D4AF37]/30 group-hover:bg-[#D4AF37] group-hover:text-[#011F15] transition-all">
                      Sublimation
                    </span>
                  </div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-[#D4AF37] transition-colors mb-1">
                    Keychains &amp; Live Mugs
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-100/80 group-hover:text-white font-sans font-normal leading-relaxed transition-colors">
                    High-heat transfer mug &amp; dual-sided keychain station for corporate branding.
                  </p>
                </div>

                {/* Card 2: Middle Layer (Custom Fridge Magnets) */}
                <div className="absolute top-28 right-0 sm:right-2 w-[85%] sm:w-72 p-5 sm:p-6 rounded-2xl border border-white/10 bg-[#013324] shadow-[0_15px_35px_rgba(0,0,0,0.7)] transform rotate-3 transition-all duration-500 hover:rotate-0 hover:scale-[1.04] hover:z-40 hover:border-[#D4AF37]/50 hover:bg-[#02422e] hover:shadow-[0_25px_50px_rgba(0,0,0,0.85)] group cursor-pointer z-20">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/15 flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-[#011F15] transition-all">
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-400/30 group-hover:bg-[#D4AF37] group-hover:text-[#011F15] transition-all">
                      Bespoke
                    </span>
                  </div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-[#D4AF37] transition-colors mb-1">
                    Custom Fridge Magnets
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-100/80 group-hover:text-white font-sans font-normal leading-relaxed transition-colors">
                    Glossy acrylic magnetic keepsakes customized live with event branding.
                  </p>
                </div>

                {/* Card 3: Front Featured Layer (Instant Photo Booth) */}
                <div className="absolute top-56 left-2 sm:left-6 w-[90%] sm:w-80 p-6 rounded-2xl border border-[#D4AF37]/40 bg-[#022419] shadow-[0_20px_45px_rgba(0,0,0,0.8)] transform rotate-6 transition-all duration-500 hover:rotate-0 hover:scale-[1.04] hover:z-40 hover:border-[#D4AF37]/80 hover:bg-[#023624] hover:shadow-[0_30px_60px_rgba(0,0,0,0.9)] group cursor-pointer z-30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gold-gradient flex items-center justify-center text-[#011F15] shadow-md group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-[#011F15] bg-[#D4AF37] px-3.5 py-1 rounded-full shadow-md group-hover:bg-white group-hover:text-[#011F15] transition-all">
                      Flagship
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white group-hover:text-[#D4AF37] transition-colors mb-1.5">
                    Instant Photo Booth
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-50 group-hover:text-white font-sans font-normal leading-relaxed mb-4 transition-colors">
                    Studio-grade Full-Frame optics with high-speed dye-sublimation print engine.
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-white/15 text-xs font-bold text-[#D4AF37] group-hover:text-white transition-colors">
                    <span>Full-Frame Optics</span>
                    <span className="text-white/40">•</span>
                    <span>Instant QR Gallery</span>
                  </div>
                </div>

              </TiltCard>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
