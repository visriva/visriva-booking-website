"use client";

import React from "react";
import Link from "next/link";
import { Camera, Magnet, Key, Coffee, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import TiltCard from "@/components/TiltCard";
import MaskedText from "@/components/MaskedText";

export default function BentoGrid() {
  return (
    <section className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 md:px-8 break-words">
        
        {/* Section Header */}
        <div className="text-left max-w-3xl mb-12 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-bold uppercase tracking-widest backdrop-blur-md font-cinzel">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Asymmetrical Live Services</span>
          </div>
          <div>
            <MaskedText text="Our Signature Live Stations" className="font-aylia text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight" />
          </div>
          <p className="font-conya text-base sm:text-lg text-emerald-100/80 font-light max-w-xl">
            Choose from an elite portfolio of live experiential setups, engineered for immediate high-density guest engagement.
          </p>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Instant Photo Booth */}
          <TiltCard className="md:col-span-2 lg:col-span-2 md:row-span-2 glass-card glass-card-hover rounded-2xl p-8 flex flex-col justify-between space-y-6 relative border-2 border-[#D4AF37]/50 shadow-gold-md">
            <div className="flex flex-col justify-between h-full space-y-6">
              <div className="flex items-center justify-between z-10 pr-16 sm:pr-20">
                <div className="w-14 h-14 rounded-2xl bg-gold-gradient flex items-center justify-center text-[#011F15] shadow-lg">
                  <Camera className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#011F15] bg-gold-gradient px-3 py-1 rounded-full shadow-sm font-cinzel">
                  Flagship Experience
                </span>
              </div>

              {/* 3D Floating Badge Seal */}
              <div className="absolute top-4 right-4 z-20" style={{ perspective: "600px" }}>
                <div
                  className="relative w-16 h-16 sm:w-20 sm:h-20"
                  style={{
                    transform: "rotateY(-14deg) rotateX(10deg) rotateZ(-6deg)",
                    transformStyle: "preserve-3d",
                    filter: "drop-shadow(0 6px 16px rgba(212,175,55,0.6))",
                    animation: "badge3dFloat 4s ease-in-out infinite",
                  }}
                >
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-[2.5px] border-[#D4AF37] opacity-90" />
                  {/* Inner ring */}
                  <div className="absolute inset-[4px] rounded-full border border-[#D4AF37]/60" />
                  {/* Gold fill */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "radial-gradient(ellipse at 38% 35%, #ffe97a 0%, #D4AF37 42%, #a07c10 100%)",
                    }}
                  />
                  {/* Shine overlay */}
                  <div
                    className="absolute inset-0 rounded-full opacity-40"
                    style={{
                      background: "radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.9) 0%, transparent 60%)",
                    }}
                  />
                  {/* Badge text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-0.5">
                    <span className="text-[#011F15] font-black text-[7px] sm:text-[8px] uppercase tracking-wider leading-none font-cinzel">Best</span>
                    <span className="text-[#011F15] font-black text-[9px] sm:text-[10px] uppercase tracking-tight leading-none font-cinzel mt-0.5">Seller</span>
                    <div className="flex items-center gap-[1px] mt-0.5">
                      {[0,1,2,3,4].map(i => (
                        <svg key={i} width="5" height="5" viewBox="0 0 10 10" fill="#011F15">
                          <polygon points="5,0 6.2,3.8 10,3.8 7,6.2 8.1,10 5,7.6 1.9,10 3,6.2 0,3.8 3.8,3.8" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>


              <div className="space-y-4 z-10">
                <h3 className="font-catilya text-3xl sm:text-4xl font-bold text-white leading-tight">
                  Instant <br />
                  <span className="text-gold-gradient">Photo Booth</span>
                </h3>
                <p className="font-graven text-emerald-100/90 text-base sm:text-lg font-light leading-relaxed">
                  Full-frame studio cameras paired with studio strobe illumination and instant dye-sublimation print engines. Guests receive high-gloss 4×6 photo prints within 8 seconds alongside instant QR digital album access.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs text-emerald-100">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-cavona">8-Second Dye-Sub Prints</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-cavona">Custom Event Frame Overlay</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-cavona">Instant QR Code Sharing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-cavona">White-Glove Tech Operator</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 z-10">
                <Link
                  href="/photo-booth"
                  className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors"
                >
                  <span>View Full Photo Booth Details</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </TiltCard>

          {/* Card 2: Custom Fridge Magnets */}
          <TiltCard className="md:col-span-1 lg:col-span-2 glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="flex flex-col justify-between h-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-black/40 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Magnet className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
                  Bespoke Keepsakes
                </span>
              </div>

              <div>
                <h3 className="font-catilya text-xl sm:text-2xl font-bold text-white mb-2">
                  Custom Fridge Magnets
                </h3>
                <p className="font-graven text-xs sm:text-sm text-emerald-100/80 font-light leading-relaxed">
                  Glossy acrylic magnetic frames crafted live on-site. Guests take home functional, high-density magnetic memories that stay on display for years.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/services/magnet-station"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#D4AF37] hover:text-white transition-colors"
                >
                  <span>Explore Station</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </TiltCard>

          {/* Card 3: Bespoke Keychains */}
          <TiltCard className="md:col-span-1 lg:col-span-1 glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="flex flex-col justify-between h-full space-y-4">
              <div className="w-12 h-12 rounded-xl bg-black/40 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Key className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-catilya text-xl font-bold text-white mb-2">
                  Bespoke Keychains
                </h3>
                <p className="font-graven text-xs text-emerald-100/80 font-light leading-relaxed">
                  Dual-sided photo keychains assembled live during the event. Compact, durable, and customized with your event branding.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/services/keychain-station"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#D4AF37] hover:text-white transition-colors"
                >
                  <span>Explore Station</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </TiltCard>

          {/* Card 4: Live Mug Printing */}
          <TiltCard className="md:col-span-1 lg:col-span-1 glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="flex flex-col justify-between h-full space-y-4">
              <div className="w-12 h-12 rounded-xl bg-black/40 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Coffee className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-catilya text-xl font-bold text-white mb-2">
                  Live Mug Printing
                </h3>
                <p className="font-graven text-xs text-emerald-100/80 font-light leading-relaxed">
                  High-temperature ceramic sublimation press station printing full-color ceramic mugs live for your VIP guests.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/services/mug-printing"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#D4AF37] hover:text-white transition-colors"
                >
                  <span>Explore Station</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </TiltCard>

        </div>
      </div>
    </section>
  );
}
