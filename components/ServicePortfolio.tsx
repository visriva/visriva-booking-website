"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  subscribeGalleryVisibility,
  DEFAULT_VISIBILITY_CONFIG,
  GalleryVisibilityConfig,
} from "@/lib/firebase";
import GalleryModal from "@/components/GalleryModal";
import TiltCard from "@/components/TiltCard";

interface ServicePortfolioProps {
  serviceSlug: "photo-booth" | "magnet-station" | "keychain-station" | "mug-printing";
  title?: string;
  subtitle?: string;
}

export default function ServicePortfolio({
  serviceSlug,
  title = "Experiential Setup Gallery",
  subtitle = "High-definition event photography and VIP attendee keepsakes.",
}: ServicePortfolioProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibility, setVisibility] = useState<GalleryVisibilityConfig>(DEFAULT_VISIBILITY_CONFIG);

  useEffect(() => {
    const unsub = subscribeGalleryVisibility((config) => {
      if (config) setVisibility(config);
    });
    return () => unsub();
  }, []);

  const isVisible =
    visibility.isGlobalGalleryVisible !== false &&
    ((serviceSlug === "photo-booth" && visibility.isPhotoBoothGalleryVisible) ||
     (serviceSlug === "magnet-station" && visibility.isMagnetGalleryVisible) ||
     (serviceSlug === "keychain-station" && visibility.isKeychainGalleryVisible) ||
     (serviceSlug === "mug-printing" && visibility.isMugGalleryVisible));

  if (!isVisible) return null;

  return (
    <section className="py-12 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <TiltCard className="glass-card rounded-3xl p-8 sm:p-12 border border-[#D4AF37]/30 shadow-gold-md bg-white/5 backdrop-blur-2xl text-center space-y-6 flex flex-col items-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Dedicated Gallery Access</span>
          </div>

          <div className="space-y-2 max-w-xl">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {title}
            </h2>
            <p className="font-sans text-emerald-100/80 text-sm sm:text-base font-light leading-relaxed">
              {subtitle}
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-3.5 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-xs sm:text-sm uppercase tracking-widest shadow-gold-sm hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center space-x-2"
          >
            <span>🖼️ View Live Gallery</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </TiltCard>
      </div>

      <GalleryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceName={title}
        category={serviceSlug}
      />
    </section>
  );
}
