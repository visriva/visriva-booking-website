"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Camera, Magnet, Key, Coffee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  subscribeSiteSettings,
  DEFAULT_SITE_SETTINGS,
  SiteSettings,
  subscribeGalleryVisibility,
  DEFAULT_VISIBILITY_CONFIG,
  GalleryVisibilityConfig,
  subscribeFeatureToggles,
  DEFAULT_FEATURE_TOGGLES,
  FeatureTogglesConfig,
} from "@/lib/firebase";
import TiltCard from "@/components/TiltCard";
import GalleryModal from "@/components/GalleryModal";

const CATEGORIES = [
  { id: "photo-booth", label: "Photo Booth", icon: Camera, category: "photo-booth" as const, toggleKey: "enablePhotoBoothService" },
  { id: "magnet-station", label: "Custom Magnets", icon: Magnet, category: "magnet-station" as const, toggleKey: "enableMagnetService" },
  { id: "keychain-station", label: "Metal Keychains", icon: Key, category: "keychain-station" as const, toggleKey: "enableKeychainService" },
  { id: "mug-printing", label: "Live Mugs", icon: Coffee, category: "mug-printing" as const, toggleKey: "enableMugService" },
] as const;

const SERVICE_HIGHLIGHTS: Record<string, { title: string; subtitle: string; specs: string[] }> = {
  "photo-booth": {
    title: "Studio-Grade Instant Photo Booth",
    subtitle: "Full-frame DSLR optics with instant dye-sublimation print engine. Guests receive high-gloss 4×6 prints in seconds alongside instant digital album access.",
    specs: ["8-Second Prints", "Custom Event Overlays", "4K Studio Strobe", "Instant QR Gallery"],
  },
  "magnet-station": {
    title: "Live Custom Fridge Magnet Station",
    subtitle: "High-gloss acrylic magnetic keepsakes crafted live during your event. A tangible, high-value souvenir that stays on their fridge for years.",
    specs: ["Heavy Rubber Magnet", "Waterproof Gloss Stock", "Live On-Site Pressing", "Long-Lasting Memories"],
  },
  "keychain-station": {
    title: "Bespoke Metallic & Acrylic Keychains",
    subtitle: "Double-sided crystal clear acrylic & metallic keychains featuring high-resolution guest portraits assembled live on-site.",
    specs: ["Crystal Acrylic Frame", "Dual-Sided Portrait", "Bespoke Engraving", "Personalized Keepsake"],
  },
  "mug-printing": {
    title: "Live Ceramic Mug Sublimation",
    subtitle: "High-heat transfer press station printing full-color, dishwasher-safe ceramic mugs live in under 3 minutes for corporate takeaways and return gifts.",
    specs: ["Dishwasher Safe", "Full-Color Sublimation", "Corporate Branding", "VIP Return Gift"],
  },
};

export default function PortfolioGallery() {
  const [activeFilter, setActiveFilter] = useState<"photo-booth" | "magnet-station" | "keychain-station" | "mug-printing">("photo-booth");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [visibility, setVisibility] = useState<GalleryVisibilityConfig>(DEFAULT_VISIBILITY_CONFIG);
  const [toggles, setToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);

  useEffect(() => {
    const unsub = subscribeSiteSettings((newSettings) => {
      setSettings(newSettings);
    });
    const unsubVis = subscribeGalleryVisibility((config) => {
      if (config) setVisibility(config);
    });
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) setToggles(data);
    });
    return () => {
      unsub();
      unsubVis();
      unsubToggles();
    };
  }, []);

  if (settings.portfolioEnabled === false || visibility.isGlobalGalleryVisible === false) {
    return null;
  }

  const activeHighlight = SERVICE_HIGHLIGHTS[activeFilter];

  const isCurrentGalleryVisible =
    (activeFilter === "photo-booth" && visibility.isPhotoBoothGalleryVisible) ||
    (activeFilter === "magnet-station" && visibility.isMagnetGalleryVisible) ||
    (activeFilter === "keychain-station" && visibility.isKeychainGalleryVisible) ||
    (activeFilter === "mug-printing" && visibility.isMugGalleryVisible);

  return (
    <section id="portfolio" className="py-24 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-bold uppercase tracking-widest backdrop-blur-md font-cinzel">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Interactive Experience Visualizer</span>
          </div>
          <h2 className="font-playfair text-4xl sm:text-6xl font-bold text-gold-gradient tracking-tight">
            Our Luxury Live Stations
          </h2>
          <p className="font-sans text-emerald-100/80 text-sm sm:text-base font-light leading-relaxed">
            Select an experience category to view station specifications or unlock the live event gallery.
          </p>
        </div>

        {/* ─── PREMIUM SERVICE SELECTION CARDS ─── */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-5 max-w-5xl mx-auto mb-14 px-2">
          {CATEGORIES.filter((cat) => {
            const toggleVal = toggles[cat.toggleKey as keyof FeatureTogglesConfig];
            return toggleVal !== false;
          }).map((cat) => {
            const isActive = activeFilter === cat.id;
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                whileHover={{ scale: 1.06, y: -3 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`group relative flex flex-col items-center justify-center gap-2.5
                  w-[140px] sm:w-[160px] md:w-[168px] py-5 px-3
                  rounded-2xl border cursor-pointer
                  transition-all duration-300
                  ${isActive
                    ? "bg-[#D4AF37]/15 border-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.35)] text-[#D4AF37] font-extrabold backdrop-blur-sm"
                    : "bg-white/[0.05] border-white/15 text-white hover:bg-white/[0.10] hover:border-[#D4AF37]/60 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
                  }`}
              >
                {/* Icon container */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-300
                  ${isActive
                    ? "bg-[#D4AF37]/20"
                    : "bg-white/10 group-hover:bg-[#D4AF37]/15"
                  }`}>
                  <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? "text-[#D4AF37]" : "text-white group-hover:text-[#D4AF37]"}`} />
                </div>

                {/* Label — always bright */}
                <span className={`text-xs sm:text-sm font-bold text-center leading-tight tracking-wide font-cinzel transition-colors duration-300
                  ${isActive ? "text-[#D4AF37]" : "text-white group-hover:text-[#D4AF37]"}`}>
                  {cat.label}
                </span>

                {/* Active bottom dot */}
                {isActive && (
                  <motion.span
                    layoutId="activeDot"
                    className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* 3. DYNAMIC CONTEXT TEXT (Centered & Constrained) */}
        <div className="max-w-2xl mx-auto text-center mt-6 mb-12 px-4 min-h-[80px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-playfair text-2xl md:text-3xl font-bold text-white mb-2">
                {activeHighlight.title}
              </h3>
              <p className="text-white/90 text-base md:text-xl leading-relaxed font-cormorant font-light">
                {activeHighlight.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 4. THE GRID / CARDS LAYOUT ALIGNMENT */}
        <div className="max-w-4xl mx-auto">
          <TiltCard className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 glass-card p-8 sm:p-10 shadow-gold-md flex flex-col items-center text-center space-y-6">
            
            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full text-xs font-mono text-emerald-200">
              {activeHighlight.specs.map((spec, idx) => (
                <div key={idx} className="glass-card p-3 rounded-xl border border-white/10 text-center bg-white/5">
                  {spec}
                </div>
              ))}
            </div>

            {/* CONDITIONALLY RENDERED "VIEW LIVE GALLERY" BUTTON */}
            {isCurrentGalleryVisible && (
              <div className="pt-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-4 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-xs sm:text-sm uppercase tracking-widest shadow-gold-md hover:shadow-gold-lg hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center space-x-2"
                >
                  <span>🖼️ View Live Gallery</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </TiltCard>
        </div>

      </div>

      {/* GALLERIES SLIDER MODAL */}
      <GalleryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceName={SERVICE_HIGHLIGHTS[activeFilter].title}
        category={activeFilter}
      />
    </section>
  );
}
