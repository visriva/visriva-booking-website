"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Camera,
  Sparkles,
  CheckCircle2,
  Calendar,
  Check,
  X,
  Star,
  Smartphone,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WhatsIncluded from "@/components/WhatsIncluded";
import CameraFlash from "@/components/CameraFlash";
import StaggerText from "@/components/StaggerText";
import FloatingPolaroid from "@/components/FloatingPolaroid";
import MagneticButton from "@/components/MagneticButton";
import Magnetic3DButton from "@/components/Magnetic3DButton";
import TiltCard from "@/components/TiltCard";
import ServicePortfolio from "@/components/ServicePortfolio";
import {
  subscribePricingMatrix,
  DEFAULT_PRICING_MATRIX,
  GlobalPricingMatrix,
  ServicePackage,
  subscribeGalleryVisibility,
  DEFAULT_VISIBILITY_CONFIG,
  GalleryVisibilityConfig,
  subscribeFeatureToggles,
  DEFAULT_FEATURE_TOGGLES,
  FeatureTogglesConfig,
} from "@/lib/firebase";
import GalleryModal from "@/components/GalleryModal";
import SharedTerms from "@/components/SharedTerms";
import MaskedText from "@/components/MaskedText";

export default function PhotoBoothServicePage() {
  const [matrix, setMatrix] = useState<GlobalPricingMatrix>(DEFAULT_PRICING_MATRIX);
  const [hardware, setHardware] = useState<"dslr" | "ipad">("dslr");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [visibility, setVisibility] = useState<GalleryVisibilityConfig>(DEFAULT_VISIBILITY_CONFIG);
  const [toggles, setToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);

  useEffect(() => {
    const unsubMatrix = subscribePricingMatrix((data) => {
      if (data) setMatrix(data);
    });
    const unsubVis = subscribeGalleryVisibility((config) => {
      if (config) setVisibility(config);
    });
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) setToggles(data);
    });
    return () => {
      unsubMatrix();
      unsubVis();
      unsubToggles();
    };
  }, []);

  if (toggles.enablePhotoBoothService === false) {
    return (
      <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
        <Navbar />
        <div className="pt-44 pb-28 px-4 text-center max-w-md mx-auto space-y-4">
          <Lock className="w-12 h-12 text-[#D4AF37] mx-auto opacity-70" />
          <h2 className="font-serif text-2xl font-bold text-white">Instant Photo Booth Offline</h2>
          <p className="text-xs text-emerald-100/70">
            This service is currently under maintenance or turned OFF by the Administrator.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  const pbData = matrix.photoBooth || DEFAULT_PRICING_MATRIX.photoBooth;
  const dslrPackages = pbData.dslrPackages || pbData.packages || DEFAULT_PRICING_MATRIX.photoBooth.packages;
  const ipadPackages = pbData.ipadPackages || DEFAULT_PRICING_MATRIX.photoBooth.ipadPackages;

  const activePackages: ServicePackage[] = hardware === "dslr" ? dslrPackages : ipadPackages;

  const PRICING_TIERS = activePackages.map((pkg) => ({
    name: pkg.name,
    price: `₹${(pkg.price || 0).toLocaleString("en-IN")}`,
    subtitle: pkg.subtitle || pkg.duration || "Standard Coverage",
    popular: Boolean(pkg.popular),
    features: pkg.features.map((feat) => ({
      text: feat,
      included: true,
    })),
  }));

  return (
    <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15] overflow-x-hidden w-full max-w-full">
      {/* 1. CINEMATIC CAMERA FLASH EFFECT ON PAGE MOUNT */}
      <CameraFlash />

      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        {/* Soft Background Gold Glows */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/15 via-transparent to-transparent pointer-events-none blur-3xl" />

        <motion.div layoutId="service-card-photo-booth" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/5 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-md shadow-gold-sm">
            <Camera className="w-4 h-4 text-[#D4AF37]" />
            <span>Virtual Assistant Station #1</span>
          </div>

          <motion.div layoutId="service-title-photo-booth" className="mb-6">
            <MaskedText
              text="Instant Photo Booth"
              className="font-catilya text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tight leading-[1.05]"
            />
          </motion.div>

          <p className="font-conya text-base sm:text-lg md:text-xl text-emerald-100/90 font-light max-w-3xl leading-relaxed mb-8">
            Full-frame studio cameras paired with studio strobe illumination and instant dye-sublimation print engines. Guests receive high-gloss 4×6 photo prints within 8 seconds alongside instant QR digital album access.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <MagneticButton href="/#booking-engine">
              <div className="px-8 py-4 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-sm uppercase tracking-wider shadow-gold-md hover:shadow-gold-lg transition-all flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#011F15]" />
                <span>Check Photo Booth Availability</span>
              </div>
            </MagneticButton>

            {visibility.isGlobalGalleryVisible !== false && visibility.isPhotoBoothGalleryVisible && (
              <button
                onClick={() => setIsGalleryOpen(true)}
                className="px-6 py-3.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#011F15] font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-gold-sm hover:scale-105 active:scale-95 cursor-pointer"
              >
                🖼️ View Photo Booth Gallery
              </button>
            )}
          </div>
        </motion.div>
      </section>

      {/* 2. FLOATING 3D POLAROIDS INTERACTIVE SHOWCASE */}
      <section className="py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <StaggerText
              text="Live 3D Print Highlights"
              goldIndex={[1, 2]}
              className="font-aylia text-3xl sm:text-4xl font-bold text-white"
            />
            <p className="text-xs sm:text-sm text-emerald-100/70 font-light mt-2">
              Move your cursor over the polaroids to experience real-time 3D tilt interaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-items-center">
            <FloatingPolaroid
              title="Studio Optics &amp; Lighting"
              subtitle="Full-frame camera body paired with studio strobe illumination."
              badge="4K Optics"
              rotation={-4}
            />

            <FloatingPolaroid
              title="Custom Branding Overlay"
              subtitle="Personalized event graphics, logos, and frame borders."
              badge="Custom Frame"
              rotation={2}
            />

            <FloatingPolaroid
              title="8-Second Print Output"
              subtitle="High-speed dye-sublimation printer producing glossy prints."
              badge="8-Sec Dye-Sub"
              rotation={-2}
            />
          </div>
        </div>
      </section>

      {/* 3. THE VIP EXPERIENCE */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl p-8 sm:p-12 border border-white/10 space-y-6">
            <div className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">The VIP Experience</div>
            <StaggerText
              text="Studio Optics Meets Instant Gratification"
              goldIndex={[0, 1]}
              className="font-aylia text-3xl sm:text-4xl font-bold text-white"
            />
            <p className="font-conya text-emerald-100/80 leading-relaxed font-light text-base">
              The moment your guests step into the Visriva Photo Booth, they are met with studio-grade lighting and high-definition optics. Every shot is instantly rendered onto lab-quality thermal dye-sublimation paper with customized event frame overlays, preserving their memory for a lifetime.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs text-emerald-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                <span>4×6 High-Gloss Prints</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Instant QR Digital Album</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Custom Brand Overlays</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED SPLIT-SECTION */}
      <WhatsIncluded />

      {/* 4. DUAL-HARDWARE TOGGLE & PRICING CARDS */}
      {toggles.showPricing !== false && (
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header & Subheader */}
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Transparent Investment</span>
            </div>
            <StaggerText
              text="Rental Package Investments"
              goldIndex={[0, 1]}
              className="font-catilya text-3xl sm:text-5xl font-bold text-white tracking-tight"
            />
            <p className="font-conya text-emerald-100/80 text-sm sm:text-base font-light leading-relaxed">
              Choose your preferred hardware setup. Select between full-frame Studio DSLR photography or compact Digital iPad Ring Lights.
            </p>
          </div>

          {/* HARDWARE TOGGLE PILL */}
          <div className="flex items-center justify-center mb-12">
            <div className="inline-flex items-center p-1.5 rounded-full bg-black/50 border border-[#D4AF37]/40 backdrop-blur-xl shadow-gold-sm">
              <button
                onClick={() => setHardware("dslr")}
                className={`px-6 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center space-x-2 transition-all duration-300 ${
                  hardware === "dslr"
                    ? "bg-gold-gradient text-[#011F15] shadow-gold-md scale-105"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>📸 DSLR Studio Booth</span>
              </button>

              <button
                onClick={() => setHardware("ipad")}
                className={`px-6 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center space-x-2 transition-all duration-300 ${
                  hardware === "ipad"
                    ? "bg-gold-gradient text-[#011F15] shadow-gold-md scale-105"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>📱 iPad Ring Light Booth</span>
              </button>
            </div>
          </div>

          {/* ANIMATED PRICING CARDS SWAP */}
          <AnimatePresence mode="wait">
            <motion.div
              key={hardware}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch"
            >
              {PRICING_TIERS.map((tier, idx) => (
                <TiltCard
                  key={tier.name || idx}
                  className={`relative glass-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                    tier.popular
                      ? "border-2 border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.25)] lg:scale-105 z-10 bg-white/10"
                      : "border border-white/10 hover:border-[#D4AF37]/40 bg-white/5"
                  }`}
                >
                  {/* Most Popular Badge */}
                  {tier.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#011F15] font-extrabold text-[11px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center space-x-1 whitespace-nowrap z-20">
                      <Star className="w-3 h-3 fill-[#011F15]" />
                      <span>Most Popular</span>
                    </div>
                  )}

                  {/* Top Content */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-aylia text-2xl font-bold text-white mb-1">{tier.name}</h3>
                      <div className="font-graven text-xs text-emerald-200/70 font-light uppercase tracking-wider">
                        {tier.subtitle}
                      </div>
                    </div>

                    <div className="py-2 border-y border-white/10">
                      <div className="font-cavona text-4xl sm:text-5xl font-extrabold text-gold-gradient tracking-tight">
                        {tier.price}
                      </div>
                      <div className="text-[11px] text-emerald-100/60 mt-1 font-light">All inclusive event setup</div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 text-xs text-emerald-100/90 font-light">
                      {tier.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start space-x-2.5">
                          {feat.included ? (
                            <Check className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 text-emerald-200/30 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={feat.included ? "text-emerald-100" : "text-emerald-200/40 line-through"}>
                            {feat.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* MAGNETIC 3D BUTTON CTA */}
                  <div className="pt-8 w-full flex justify-center">
                    <Magnetic3DButton href="/#booking-engine" className="w-full">
                      <div
                        className={`w-full py-3.5 px-6 rounded-full font-bold text-xs uppercase tracking-wider text-center transition-all duration-300 ${
                          tier.popular
                            ? "bg-gold-gradient text-[#011F15] shadow-gold-sm"
                            : "bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-[#D4AF37]"
                        }`}
                      >
                        Book {tier.name}
                      </div>
                    </Magnetic3DButton>
                  </div>

                </TiltCard>
              ))}
            </motion.div>
          </AnimatePresence>

        </div>
      </section>
      )}

      {/* 5. SHARED LOGISTICS & TERMS */}
      <SharedTerms serviceType="photo-booth" />

      {/* GALLERY MODAL */}
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        serviceName="Photo Booth"
        category="photo-booth"
      />

      <Footer />
    </main>
  );
}
