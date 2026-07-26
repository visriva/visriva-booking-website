"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SharedTerms from "@/components/SharedTerms";
import GalleryModal from "@/components/GalleryModal";
import MaskedText from "@/components/MaskedText";
import { motion } from "framer-motion";
import { Coffee, Sparkles, CheckCircle2, Calendar, ArrowRight } from "lucide-react";
import { subscribeGalleryVisibility, DEFAULT_VISIBILITY_CONFIG, GalleryVisibilityConfig } from "@/lib/firebase";

export default function MugPrintingServicePage() {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [visibility, setVisibility] = useState<GalleryVisibilityConfig>(DEFAULT_VISIBILITY_CONFIG);

  useEffect(() => {
    const unsub = subscribeGalleryVisibility((config) => {
      if (config) setVisibility(config);
    });
    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-transparent text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 relative">
        <motion.div layoutId="service-card-mug-printing" className="max-w-7xl mx-auto px-4 md:px-8 text-center flex flex-col items-center break-words">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-md">
            <Coffee className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Virtual Assistant Guide</span>
          </div>

          <motion.div layoutId="service-title-mug-printing" className="mb-6">
            <MaskedText
              text="Live Ceramic Mug Sublimation"
              className="font-catilya text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight text-white leading-[1.05]"
            />
          </motion.div>

          <p className="font-conya text-lg sm:text-xl text-emerald-100/90 font-light max-w-3xl leading-relaxed mb-6">
            High-heat ceramic sublimation press station printing full-color, dishwasher-safe ceramic mugs live on-site in under 3 minutes for corporate takeaways and VIP return gifts.
          </p>

          {visibility.isGlobalGalleryVisible !== false && visibility.isMugGalleryVisible && (
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="px-6 py-3 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#011F15] font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-gold-sm hover:scale-105 active:scale-95 cursor-pointer"
            >
              🖼️ View Live Mugs Gallery
            </button>
          )}
        </motion.div>
      </section>

      {/* 1. THE VIP EXPERIENCE */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-2xl p-8 sm:p-12 border border-white/10 space-y-6">
            <div className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">The VIP Experience</div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Vibrant, Permanent Ceramic Gifts
            </h2>
            <p className="text-emerald-100/80 leading-relaxed font-light text-base">
              Guests choose their favorite photo taken by our photo booth setup or upload a custom image. Our high-heat 200°C sublimation press bakes the design directly into the ceramic glaze within 180 seconds.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs text-emerald-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                <span>11oz Grade-A Ceramic Mugs</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Dishwasher &amp; Microwave Safe</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Luxury Gift Box Packaging</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOGISTICS & SETUP */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-2xl p-8 sm:p-12 border border-white/10 space-y-6">
            <div className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">Logistics &amp; Technical Requirements</div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Safety &amp; Thermal Power Protocol
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="space-y-2">
                <div className="font-serif text-lg font-bold text-white">Setup Time</div>
                <p className="text-xs text-emerald-100/80 font-light">15-minute setup with dual heat-press calibration.</p>
              </div>
              <div className="space-y-2">
                <div className="font-serif text-lg font-bold text-white">Space Footprint</div>
                <p className="text-xs text-emerald-100/80 font-light">Requires a clean 8ft × 8ft space with ventilation.</p>
              </div>
              <div className="space-y-2">
                <div className="font-serif text-lg font-bold text-white">Power Protocol</div>
                <p className="text-xs text-emerald-100/80 font-light">Dedicated 220V 15A AC power outlet for thermal press.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRICING & MINIMUMS */}
      <section className="py-12 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-2xl p-8 sm:p-12 border border-white/10 space-y-6">
            <div className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">Pricing &amp; Package Tiers</div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              Live Mug Sublimation Packages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="glass-card p-6 rounded-xl border border-white/10 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">MOQ 50 Mugs</div>
                <div className="text-2xl font-bold font-serif text-white">₹17,500</div>
                <p className="text-xs text-emerald-100/80 font-light">50 Custom Mugs • Gift Boxes Included</p>
              </div>
              <div className="glass-card p-6 rounded-xl border-2 border-[#D4AF37]/50 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">MOQ 100 Mugs</div>
                <div className="text-2xl font-bold font-serif text-white">₹32,000</div>
                <p className="text-xs text-emerald-100/80 font-light">100 Custom Mugs • Dual Sublimation Press</p>
              </div>
              <div className="glass-card p-6 rounded-xl border border-white/10 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">MOQ 250 Mugs</div>
                <div className="text-2xl font-bold font-serif text-white">₹70,000</div>
                <p className="text-xs text-emerald-100/80 font-light">250 Mugs • High Capacity Event Team</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Floating CTA */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="/#booking-engine"
          className="px-6 py-3.5 rounded-full bg-gold-gradient text-[#011F15] font-bold text-xs sm:text-sm shadow-gold-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2"
        >
          <Calendar className="w-4 h-4 text-[#011F15]" />
          <span>Check Availability</span>
        </a>
      </div>

      {/* SHARED LOGISTICS & TERMS */}
      <SharedTerms serviceType="mugs" />

      {/* GALLERY MODAL */}
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        serviceName="Live Mug Printing"
        category="mug-printing"
      />

      <Footer />
    </main>
  );
}
