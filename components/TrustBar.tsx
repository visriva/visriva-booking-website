"use client";

import React from "react";
import { Star, ShieldCheck, Award, Sparkles, Building2, Crown, Heart, CheckCircle2 } from "lucide-react";

export default function TrustBar() {
  const brandPartners = [
    "Luxury Event Agencies",
    "Corporate Galas & Summits",
    "Destination Weddings",
    "Tech Summits & Product Launches",
    "VIP Private Celebrations",
    "High-Fashion Activations",
  ];

  return (
    <section className="w-full py-5 bg-white/5 backdrop-blur-xl border-y border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3 text-xs uppercase tracking-widest font-catilya text-[#D4AF37] whitespace-nowrap">
            <Crown className="w-4 h-4 text-[#D4AF37]" />
            <span>Trusted for High-Profile Celebrations</span>
          </div>

          <div className="flex items-center space-x-6 sm:space-x-10 text-xs text-emerald-100/90 overflow-x-auto no-scrollbar py-1 font-graven">
            <div className="flex items-center space-x-2 whitespace-nowrap">
              <Star className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>500+ Luxury Events</span>
            </div>

            <div className="flex items-center space-x-2 whitespace-nowrap">
              <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Corporate Galas</span>
            </div>

            <div className="flex items-center space-x-2 whitespace-nowrap">
              <Heart className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Destination Weddings</span>
            </div>

            <div className="flex items-center space-x-2 whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>100% On-Site Uptime Guarantee</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
