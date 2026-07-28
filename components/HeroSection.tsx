"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Camera, Play, Layers, Printer, Magnet, Key, Coffee, ShoppingBag, Calendar as CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
  subscribeSiteSettings,
  DEFAULT_SITE_SETTINGS,
  SiteSettings,
  subscribeWebsiteText,
  DEFAULT_WEBSITE_TEXT,
  WebsiteTextConfig,
  subscribeFeatureToggles,
  DEFAULT_FEATURE_TOGGLES,
  FeatureTogglesConfig,
  subscribeHeroCardStackConfig,
  DEFAULT_HERO_CARD_STACK_CONFIG,
  HeroCardStackConfig,
} from "@/lib/firebase";
import Magnetic3DButton from "@/components/Magnetic3DButton";
import TiltCard from "@/components/TiltCard";
import MaskedText from "@/components/MaskedText";
import AIConciergeWidget from "@/components/AIConciergeWidget";

export default function HeroSection() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [webText, setWebText] = useState<WebsiteTextConfig>(DEFAULT_WEBSITE_TEXT);
  const [toggles, setToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);
  const [cardStackConfig, setCardStackConfig] = useState<HeroCardStackConfig>(DEFAULT_HERO_CARD_STACK_CONFIG);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeSiteSettings((newSettings) => {
      setSettings(newSettings);
    });
    const unsubText = subscribeWebsiteText((data) => {
      if (data) setWebText(data);
    });
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) setToggles(data);
    });
    const unsubCards = subscribeHeroCardStackConfig((data) => {
      if (data) setCardStackConfig(data);
    });
    return () => {
      unsub();
      unsubText();
      unsubToggles();
      unsubCards();
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
                text={webText.heroTitle || settings.heroTitle || "Bengaluru's Premium Live Keepsake Stations"}
                className="font-playfair text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] text-left"
              />

              {/* Subheadline & Description */}
              <p className="font-cormorant text-xl sm:text-2xl md:text-3xl text-[#D4AF37] font-semibold tracking-wide">
                {webText.heroSubtitle || settings.heroSubtitle || "Elevate your weddings and corporate events with instant photos, magnets, keychains, and custom apparel."}
              </p>

              <p className="font-sans text-sm sm:text-base md:text-lg text-emerald-100/90 font-light leading-relaxed max-w-xl">
                {webText.aboutText}
              </p>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 w-full max-w-xl">
                <Magnetic3DButton onClick={scrollToBooking} href="#booking-engine">
                  <div className="w-full sm:w-auto min-w-[220px] px-8 py-4 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-sm shadow-gold-lg hover:shadow-gold-md flex items-center justify-center space-x-2 cursor-pointer">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Check Date Availability</span>
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
                  <span>Our Signature Live Stations</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {toggles.enablePhotoBoothService !== false && (
                    <Link
                      href="/photo-booth"
                      className="p-3 py-2.5 rounded-2xl bg-black/40 border border-[#D4AF37]/30 text-white hover:text-[#D4AF37] hover:bg-black/60 hover:border-[#D4AF37] transition-all duration-300 backdrop-blur-md flex items-center space-x-2.5 group shadow-md"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform shadow-gold-sm">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold font-serif leading-tight block">Photo Booth</span>
                        <span className="text-[9px] text-emerald-200/80 font-mono block">8s Dye-Sub</span>
                      </div>
                    </Link>
                  )}

                  {toggles.enableMagnetService !== false && (
                    <Link
                      href="/services/magnet-station"
                      className="p-3 py-2.5 rounded-2xl bg-black/40 border border-[#D4AF37]/30 text-white hover:text-[#D4AF37] hover:bg-black/60 hover:border-[#D4AF37] transition-all duration-300 backdrop-blur-md flex items-center space-x-2.5 group shadow-md"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform shadow-gold-sm">
                        <Magnet className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold font-serif leading-tight block">Magnets</span>
                        <span className="text-[9px] text-emerald-200/80 font-mono block">Acrylic Gloss</span>
                      </div>
                    </Link>
                  )}

                  {toggles.enableKeychainService !== false && (
                    <Link
                      href="/services/keychain-station"
                      className="p-3 py-2.5 rounded-2xl bg-black/40 border border-[#D4AF37]/30 text-white hover:text-[#D4AF37] hover:bg-black/60 hover:border-[#D4AF37] transition-all duration-300 backdrop-blur-md flex items-center space-x-2.5 group shadow-md"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform shadow-gold-sm">
                        <Key className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold font-serif leading-tight block">Keychains</span>
                        <span className="text-[9px] text-emerald-200/80 font-mono block">Dual-Sided</span>
                      </div>
                    </Link>
                  )}

                  {toggles.enableMugService !== false && (
                    <Link
                      href="/services/mug-printing"
                      className="p-3 py-2.5 rounded-2xl bg-black/40 border border-[#D4AF37]/30 text-white hover:text-[#D4AF37] hover:bg-black/60 hover:border-[#D4AF37] transition-all duration-300 backdrop-blur-md flex items-center space-x-2.5 group shadow-md"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform shadow-gold-sm">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold font-serif leading-tight block">Live Mugs</span>
                        <span className="text-[9px] text-emerald-200/80 font-mono block">VIP Sublimation</span>
                      </div>
                    </Link>
                  )}

                  {toggles.enableToteTshirtService !== false && (
                    <Link
                      href="/services/tote-tshirt-station"
                      className="p-3 py-2.5 rounded-2xl bg-black/40 border border-[#D4AF37]/30 text-white hover:text-[#D4AF37] hover:bg-black/60 hover:border-[#D4AF37] transition-all duration-300 backdrop-blur-md flex items-center space-x-2.5 group shadow-md"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform shadow-gold-sm">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold font-serif leading-tight block">Tote &amp; Tees</span>
                        <span className="text-[9px] text-emerald-200/80 font-mono block">Canvas Press</span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              {/* AI Event Concierge Banner */}
              <div className="pt-2 pb-1 max-w-xl">
                <AIConciergeWidget />
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

            {/* RIGHT COLUMN: Interactive 3D Staggered & Fan-Out Deck (lg:col-span-5) */}
            <div className="lg:col-span-5 w-full relative min-h-[480px] sm:min-h-[520px] flex items-center justify-center group/deck">
              <TiltCard maxDegree={10} className="w-full h-full relative flex items-center justify-center min-h-[480px] sm:min-h-[520px]">
                {(() => {
                  const CARDS_DEF = [
                    {
                      id: "mugs",
                      title: "Live Mug Printing",
                      badge: "Sublimation",
                      badgeClass: "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30",
                      icon: Coffee,
                      desc: "High-heat transfer mug printing station live for corporate branding.",
                      href: "/services/mug-printing",
                      toggleKey: "enableMugService",
                      restClass: "top-0 left-0 sm:left-2 -rotate-6 z-10",
                      hoverClass: "group-hover/deck:-translate-y-10 group-hover/deck:-translate-x-8 group-hover/deck:-rotate-12",
                      bgColor: "bg-[#01281c]",
                      width: "w-[85%] sm:w-72",
                    },
                    {
                      id: "keychains",
                      title: "Bespoke Keychains",
                      badge: "Keepsake",
                      badgeClass: "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30",
                      icon: Key,
                      desc: "Double-sided crystal acrylic & metallic keychains with guest portraits.",
                      href: "/services/keychain-station",
                      toggleKey: "enableKeychainService",
                      restClass: "top-12 left-4 sm:left-8 -rotate-3 z-20",
                      hoverClass: "group-hover/deck:-translate-y-6 group-hover/deck:-translate-x-4 group-hover/deck:-rotate-6",
                      bgColor: "bg-[#013022]",
                      width: "w-[85%] sm:w-72",
                    },
                    {
                      id: "magnets",
                      title: "Custom Fridge Magnets",
                      badge: "Bespoke",
                      badgeClass: "bg-emerald-950/80 text-emerald-300 border border-emerald-400/30",
                      icon: Layers,
                      desc: "Glossy acrylic magnetic keepsakes customized live with event branding.",
                      href: "/services/magnet-station",
                      toggleKey: "enableMagnetService",
                      restClass: "top-24 right-0 sm:right-2 rotate-3 z-30",
                      hoverClass: "group-hover/deck:translate-x-10 group-hover/deck:-translate-y-2 group-hover/deck:rotate-6",
                      bgColor: "bg-[#013324]",
                      width: "w-[85%] sm:w-72",
                    },
                    {
                      id: "totes",
                      title: "Tote Bag & T-Shirt Station",
                      badge: "Canvas Press",
                      badgeClass: "bg-amber-950/80 text-amber-300 border border-amber-400/30",
                      icon: ShoppingBag,
                      desc: "Live heat-press canvas tote bags and custom apparel printing activation.",
                      href: "/services/tote-tshirt-station",
                      toggleKey: "enableToteTshirtService",
                      restClass: "top-36 right-2 sm:right-6 -rotate-2 z-40",
                      hoverClass: "group-hover/deck:translate-y-6 group-hover/deck:translate-x-8 group-hover/deck:-rotate-4",
                      bgColor: "bg-[#022c1e]",
                      width: "w-[88%] sm:w-76",
                    },
                    {
                      id: "photo-booth",
                      title: "Instant Photo Booth",
                      badge: "Flagship",
                      badgeClass: "bg-[#D4AF37] text-[#011F15] font-extrabold shadow-md",
                      icon: Camera,
                      desc: "Studio-grade Full-Frame optics with high-speed dye-sublimation print engine.",
                      footer: "Full-Frame Optics • Instant QR Gallery",
                      href: "/photo-booth",
                      toggleKey: "enablePhotoBoothService",
                      restClass: "top-48 left-2 sm:left-6 rotate-6 z-50",
                      hoverClass: "group-hover/deck:translate-y-10 group-hover/deck:-translate-x-4 group-hover/deck:rotate-4",
                      bgColor: "bg-[#022419]",
                      width: "w-[90%] sm:w-80",
                      isFlagship: true,
                    },
                  ];

                  const activeCards = CARDS_DEF.filter(
                    (c) => toggles[c.toggleKey as keyof FeatureTogglesConfig] !== false
                  );

                  if (activeCards.length === 0) return null;

                  return activeCards.map((card, idx) => {
                    const Icon = card.icon;
                    const cardConfig = cardStackConfig.cards[card.id];
                    const zIndex = (idx + 1) * 10;

                    const isRedirectEnabled = cardStackConfig.enableCardRedirect !== false && cardConfig?.redirectOnClick !== false;

                    // Custom Admin offsets or default fallbacks
                    const topPx = cardConfig?.topPx !== undefined ? cardConfig.topPx : (idx * 14);
                    const rotateDeg = cardConfig?.rotateDeg !== undefined ? cardConfig.rotateDeg : (idx % 2 === 0 ? -4 : 4);
                    const hOffset = cardConfig?.horizontalOffsetPx || 0;
                    const scaleVal = cardConfig?.scale || 1.0;

                    const titleText = cardConfig?.customTitle || card.title;
                    const badgeText = cardConfig?.customBadge || card.badge;
                    const descText = cardConfig?.customDesc || card.desc;
                    const footerText = cardConfig?.customFooter !== undefined ? cardConfig.customFooter : card.footer;

                    const innerContent = (
                      <>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-transform group-hover/card:scale-110 ${
                            card.isFlagship
                              ? "bg-gold-gradient text-[#011F15] shadow-md"
                              : "bg-black/50 border border-white/15 text-[#D4AF37] group-hover/card:border-[#D4AF37] group-hover/card:bg-[#D4AF37] group-hover/card:text-[#011F15]"
                          }`}>
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <span className={`text-[10px] sm:text-xs uppercase tracking-widest px-2.5 py-1 rounded-full ${card.badgeClass}`}>
                            {badgeText}
                          </span>
                        </div>

                        <h3 className={`font-serif font-bold text-white group-hover/card:text-[#D4AF37] transition-colors mb-1 ${
                          card.isFlagship ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
                        }`}>
                          {titleText}
                        </h3>

                        <p className="text-xs sm:text-sm text-emerald-100/80 group-hover/card:text-white font-sans font-normal leading-relaxed transition-colors mb-2">
                          {descText}
                        </p>

                        {footerText && (
                          <div className="flex items-center justify-between pt-2.5 border-t border-white/15 text-xs font-bold text-[#D4AF37] group-hover/card:text-white transition-colors">
                            <span>{footerText}</span>
                          </div>
                        )}
                      </>
                    );

                    const cardClasses = `absolute ${card.width} ${card.bgColor} p-5 sm:p-6 rounded-2xl border transition-all duration-500 ease-out hover:!scale-105 hover:!z-[100] group/card ${
                      isRedirectEnabled ? "cursor-pointer" : "cursor-default"
                    } ${
                      card.isFlagship
                        ? "border-[#D4AF37]/50 shadow-[0_20px_45px_rgba(0,0,0,0.8)] hover:border-[#D4AF37] hover:bg-[#023b29] hover:shadow-[0_0_50px_rgba(212,175,55,0.4)]"
                        : "border-white/15 shadow-[0_15px_35px_rgba(0,0,0,0.65)] hover:border-[#D4AF37]/80 hover:bg-[#023b29] hover:shadow-[0_0_40px_rgba(212,175,55,0.3)]"
                    }`;

                    const cardStyle: React.CSSProperties = {
                      top: `${topPx}px`,
                      transform: `translateX(${hOffset}px) rotate(${rotateDeg}deg) scale(${scaleVal})`,
                      zIndex,
                    };

                    if (isRedirectEnabled) {
                      return (
                        <Link
                          key={card.id}
                          href={card.href}
                          style={cardStyle}
                          className={cardClasses}
                        >
                          {innerContent}
                        </Link>
                      );
                    }

                    return (
                      <div
                        key={card.id}
                        style={cardStyle}
                        className={cardClasses}
                      >
                        {innerContent}
                      </div>
                    );
                  });
                })()}
              </TiltCard>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
