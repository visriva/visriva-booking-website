"use client";

import React, { useState, useEffect } from "react";
import { Star, ShieldCheck, Sparkles, Building2, Crown, Heart, CheckCircle2 } from "lucide-react";
import { subscribeLiveImpactStats, DEFAULT_LIVE_IMPACT_STATS, LiveImpactStatsConfig } from "@/lib/firebase";

export default function TrustBar() {
  const [stats, setStats] = useState<LiveImpactStatsConfig>(DEFAULT_LIVE_IMPACT_STATS);

  useEffect(() => {
    const unsub = subscribeLiveImpactStats((data) => {
      if (data) setStats(data);
    });
    return () => unsub();
  }, []);

  return (
    <section className="w-full py-5 bg-white/5 backdrop-blur-xl border-y border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3 text-xs uppercase tracking-widest font-catilya text-[#D4AF37] whitespace-nowrap">
            <Crown className="w-4 h-4 text-[#D4AF37]" />
            <span>Trusted Luxury Event Printing Partner</span>
          </div>

          <div className="flex items-center space-x-6 sm:space-x-10 text-xs text-emerald-100/90 overflow-x-auto no-scrollbar py-1 font-graven">
            <div className="flex items-center space-x-2 whitespace-nowrap">
              <Star className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                {stats.eventsExecuted > 0 ? `${stats.eventsExecuted}+ Completed Events` : "Studio-Grade On-Site Optics"}
              </span>
            </div>

            <div className="flex items-center space-x-2 whitespace-nowrap">
              <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                {stats.souvenirsDelivered > 0 ? `${stats.souvenirsDelivered.toLocaleString("en-IN")}+ Keepsakes Created` : "Corporate Galas & Launch Events"}
              </span>
            </div>

            <div className="flex items-center space-x-2 whitespace-nowrap">
              <Heart className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                {stats.guestsServed > 0 ? `${stats.guestsServed.toLocaleString("en-IN")}+ Guests Served` : "Weddings & Milestone Celebrations"}
              </span>
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
