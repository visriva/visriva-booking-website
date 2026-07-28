"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShoppingBag,
  Sparkles,
  Printer,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Flame,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Magnetic3DButton from "@/components/Magnetic3DButton";
import {
  subscribeFeatureToggles,
  DEFAULT_FEATURE_TOGGLES,
  FeatureTogglesConfig,
} from "@/lib/firebase";

export default function ToteTshirtStationPage() {
  const [guestCount, setGuestCount] = useState(150);
  const [itemChoice, setItemChoice] = useState<"tote" | "tshirt" | "both">("tote");
  const [toggles, setToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);

  React.useEffect(() => {
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) setToggles(data);
    });
    return () => unsubToggles();
  }, []);

  if (toggles.enableToteTshirtService === false) {
    return (
      <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
        <Navbar />
        <div className="pt-44 pb-28 px-4 text-center max-w-md mx-auto space-y-4">
          <Lock className="w-12 h-12 text-[#D4AF37] mx-auto opacity-70" />
          <h2 className="font-serif text-2xl font-bold text-white">Tote Bag &amp; T-Shirt Station Offline</h2>
          <p className="text-xs text-emerald-100/70">
            This service is currently under maintenance or turned OFF by the Administrator.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  const basePricePerItem = itemChoice === "tote" ? 180 : itemChoice === "tshirt" ? 280 : 220;
  const estimatedTotal = Math.round(guestCount * basePricePerItem);

  return (
    <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15] overflow-x-hidden">
      <Navbar />

      <section className="pt-36 sm:pt-40 pb-20 relative overflow-hidden">
        {/* Ambient Glow Halos */}
        <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.18)_0%,_transparent_70%)] blur-[100px] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* HERO TITLE & BADGE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black/50 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest backdrop-blur-md font-cinzel">
                <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                <span>Live Event Activation • Sublimation Press</span>
              </div>

              <h1 className="font-playfair text-4xl sm:text-6xl font-bold text-white tracking-tight leading-[1.08]">
                Live Custom <span className="text-gold-gradient">Tote Bag &amp; T-Shirt Station</span>
              </h1>

              <p className="font-cormorant text-xl sm:text-2xl text-[#D4AF37] font-semibold">
                High-Heat Dye Sublimation Pressing Live at Your Wedding or Corporate Gala
              </p>

              <p className="font-sans text-emerald-100/80 text-sm sm:text-base leading-relaxed font-light max-w-xl">
                Elevate your corporate brand summit or luxury wedding return gifts. Guests choose their custom typography or portrait graphics, which are heat-pressed onto heavy canvas tote bags or premium tees live on-site in under 3 minutes.
              </p>

              {/* SPEC HIGHLIGHTS GRID */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-xl font-bold font-serif text-[#D4AF37]">180s</div>
                  <div className="text-[10px] text-emerald-200/80 uppercase font-mono">Press Time</div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-xl font-bold font-serif text-[#D4AF37]">HD 4K</div>
                  <div className="text-[10px] text-emerald-200/80 uppercase font-mono">Transfer Color</div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-xl font-bold font-serif text-[#D4AF37]">100%</div>
                  <div className="text-[10px] text-emerald-200/80 uppercase font-mono">Washable Stock</div>
                </div>
              </div>

              {/* CTA BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Magnetic3DButton href="/#booking-engine">
                  <div className="px-8 py-4 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-sm uppercase tracking-wider shadow-gold-md hover:shadow-gold-lg flex items-center justify-center space-x-2 cursor-pointer">
                    <span>Book Tote &amp; Tee Station</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Magnetic3DButton>

                <a
                  href={`https://wa.me/918884484828?text=${encodeURIComponent(
                    "Hello Visriva! I am interested in inquiring about the Live Tote Bag & T-Shirt Sublimation Station."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-7 py-4 rounded-full bg-[#25D366] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Inquire via WhatsApp</span>
                </a>
              </div>

            </div>

            {/* RIGHT COLUMN: SHOWCASE CARD & LIVE ESTIMATOR */}
            <div className="lg:col-span-5 bg-black/40 border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/15 px-3 py-1 rounded-full border border-[#D4AF37]/30">
                  Instant Cost Estimator
                </span>
                <h3 className="font-serif text-2xl font-bold text-white">Live Tote / Tee Calculator</h3>
              </div>

              {/* ESTIMATOR CONTROLS */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-emerald-200 mb-1">Select Merch Option</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "tote", label: "Canvas Tote Bag" },
                      { id: "tshirt", label: "Premium T-Shirt" },
                      { id: "both", label: "Combo Mix" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setItemChoice(opt.id as any)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                          itemChoice === opt.id
                            ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                            : "bg-white/5 border-white/15 text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-200 mb-1">
                    <span>Expected Guest Count</span>
                    <span className="text-[#D4AF37] font-bold">{guestCount} Guests</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full accent-[#D4AF37] cursor-pointer"
                  />
                </div>
              </div>

              {/* ESTIMATED BUDGET DISPLAY */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                <div className="text-xs text-emerald-200/80 font-mono">Estimated Package Investment</div>
                <div className="text-3xl font-extrabold font-serif text-[#D4AF37]">
                  ₹{estimatedTotal.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-white/50 font-mono">*Includes live heat press, crew technician &amp; raw merch stock.</div>
              </div>

              <Link
                href="/#booking-engine"
                className="w-full py-3.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-[1.02] transition flex items-center justify-center space-x-2"
              >
                <span>Reserve Event Date Now</span>
                <ArrowRight className="w-4 h-4 text-[#011F15]" />
              </Link>

            </div>

          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
