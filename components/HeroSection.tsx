"use client";

import React from "react";
import { ArrowDown, Sparkles, ShieldCheck, Zap, Star, Play } from "lucide-react";

export default function HeroSection() {
  const scrollToBooking = (e: React.MouseEvent) => {
    e.preventDefault();
    const bookingElem = document.getElementById("booking-engine");
    if (bookingElem) {
      bookingElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden bg-emerald-950">
      {/* Background Video / Visual Atmosphere Placeholder Container */}
      <div className="absolute inset-0 z-0">
        {/* HTML5 Background Video Placeholder with fallback background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1920&q=80"
          className="w-full h-full object-cover opacity-20 filter contrast-125 saturate-150"
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-party-crowd-raising-hands-under-lights-41551-large.mp4"
            type="video/mp4"
          />
        </video>
        {/* Dark Emerald & Radial Gold Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 via-emerald-950/90 to-emerald-950" />
        <div className="absolute inset-0 bg-gold-glow pointer-events-none opacity-60" />
        
        {/* Decorative Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Live Status Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-900/80 border border-gold-500/40 text-gold-400 text-xs sm:text-sm font-semibold tracking-wide shadow-gold-sm mb-8 backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold-500"></span>
          </span>
          <span className="uppercase tracking-wider text-[11px] sm:text-xs">
            BENGALURU’S #1 LUXURY EVENT TECH STATION
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6">
          Bengaluru’s Premium <br className="hidden sm:inline" />
          <span className="text-gold-gradient drop-shadow-md">
            Live Event Station
          </span>
        </h1>

        {/* Subheadline */}
        <p className="font-sans text-xl sm:text-2xl md:text-3xl text-gold-400/90 font-medium tracking-wide mb-10 max-w-3xl animate-shimmer">
          Instant Photos • Magnets • Keychains • Mugs
        </p>

        {/* Value Proposition bullets */}
        <p className="text-emerald-200/80 text-base sm:text-lg max-w-2xl mb-12 font-light leading-relaxed">
          Transform weddings, corporate galas, and VIP brand activations into unforgettable experiences. Studio-grade quality delivered on-site within seconds.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full max-w-md mb-16">
          <a
            href="#booking-engine"
            onClick={scrollToBooking}
            className="w-full sm:w-auto min-w-[240px] px-8 py-4 rounded-full bg-gold-gradient text-emerald-950 font-bold text-lg shadow-gold-lg hover:shadow-gold-md hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-3 group"
          >
            <span>Check Availability</span>
            <ArrowDown className="w-5 h-5 text-emerald-950 group-hover:translate-y-1 transition-transform" />
          </a>

          <a
            href="#services"
            className="w-full sm:w-auto min-w-[200px] px-8 py-4 rounded-full bg-emerald-900/60 border border-gold-500/30 text-gold-300 font-semibold text-base hover:bg-emerald-850 hover:border-gold-500/60 hover:text-white transition-all duration-300 backdrop-blur-md flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4 text-gold-500 fill-gold-500" />
            <span>Explore Services</span>
          </a>
        </div>

        {/* Trust & Spec Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl pt-8 border-t border-gold-500/20">
          <div className="flex items-center justify-center space-x-3 text-emerald-200/90 text-sm">
            <Zap className="w-5 h-5 text-gold-500 flex-shrink-0" />
            <span><strong className="text-white font-semibold">8-Second</strong> Ultra-Fast Printing</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-emerald-200/90 text-sm">
            <ShieldCheck className="w-5 h-5 text-gold-500 flex-shrink-0" />
            <span><strong className="text-white font-semibold">Studio DSLR</strong> Camera Setup</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-emerald-200/90 text-sm">
            <Star className="w-5 h-5 text-gold-500 flex-shrink-0" />
            <span><strong className="text-white font-semibold">500+</strong> Premier Events Served</span>
          </div>
        </div>
      </div>
    </section>
  );
}
