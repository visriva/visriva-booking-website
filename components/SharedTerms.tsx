"use client";

import React from "react";
import { ShieldCheck, Truck, CreditCard, Layout, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SharedTermsProps {
  serviceType: "photo-booth" | "keychains" | "mugs" | "magnets";
}

export default function SharedTerms({ serviceType }: SharedTermsProps) {
  const requires2x6Table = serviceType === "keychains" || serviceType === "mugs";

  const getServiceName = () => {
    switch (serviceType) {
      case "photo-booth":
        return "Photo Booth";
      case "keychains":
        return "Metal Keychains";
      case "mugs":
        return "Live Mug Printing";
      case "magnets":
        return "Custom Fridge Magnets";
      default:
        return "Live Gifting Station";
    }
  };

  return (
    <section className="py-16 px-4 md:px-8 break-words max-w-7xl mx-auto relative">
      <div className="text-center flex flex-col items-center max-w-3xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold uppercase tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Service Policy &amp; Terms</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Essential Event Logistics &amp; Guidelines
        </h2>
        <p className="text-sm text-emerald-100/70">
          Everything you need to know about setting up {getServiceName()} at your event venue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Additional Logistics */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 space-y-4 hover:border-[#D4AF37]/40 transition-all">
          <div className="flex items-center space-x-3 text-[#D4AF37]">
            <Truck className="w-5 h-5" />
            <h3 className="font-serif text-xl font-bold text-white">Additional Logistics</h3>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            <li className="flex items-start space-x-2 bg-[#D4AF37]/10 p-3 rounded-xl border border-[#D4AF37]/40 text-white font-medium">
              <Truck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong>Travel &amp; Distance Policy (15 km Rule):</strong> Free transport &amp; logistics included up to <strong>15 km</strong> from Bengaluru City Center. For venue locations beyond 15 km, extra travel, vehicle fuel &amp; toll charges will be billed at actuals.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong>Arrival &amp; Setup:</strong> Our technical team arrives 60–90 minutes before the scheduled start time for installation and testing.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong>Power Access:</strong> Requires a dedicated 5A / 230V standard power outlet within 15 meters of the setup space.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong>Operator Presence:</strong> Includes 2 uniformed professional operators for smooth guest engagement and quality checks.</span>
            </li>
          </ul>
        </div>

        {/* 2. Payment & Booking Terms */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 space-y-4 hover:border-[#D4AF37]/40 transition-all">
          <div className="flex items-center space-x-3 text-[#D4AF37]">
            <CreditCard className="w-5 h-5" />
            <h3 className="font-serif text-xl font-bold text-white">Payment &amp; Booking Terms</h3>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong>Advance Deposit:</strong> 40% advance payment required to lock your date and reserve equipment allocation.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong>Balance Settlement:</strong> Remaining 60% balance payable on the event day prior to teardown.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong>Transparent Pricing:</strong> All quotes include operational staff, equipment, and live print consumables with zero hidden fees.</span>
            </li>
          </ul>
        </div>

        {/* 3. Venue & Technical Footprint Requirements */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 space-y-4 hover:border-[#D4AF37]/40 transition-all">
          <div className="flex items-center space-x-3 text-[#D4AF37]">
            <Layout className="w-5 h-5" />
            <h3 className="font-serif text-xl font-bold text-white">Venue &amp; Technical Requirements</h3>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong>Floor Space:</strong> Minimum 8x8 ft flat, covered surface free from direct rain or high winds.</span>
            </li>
            {requires2x6Table && (
              <li className="flex items-start space-x-2 bg-[#D4AF37]/10 p-2.5 rounded-xl border border-[#D4AF37]/30 text-white font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span><strong>Table Requirement:</strong> A standard 2x6 ft sturdy table must be provided by the venue for the printing equipment.</span>
              </li>
            )}
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong>Outdoor Weather Coverage:</strong> Outdoor installations require a covered canopy or waterproof shade.</span>
            </li>
          </ul>
        </div>

        {/* 4. Liability & Cancellation */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 space-y-4 hover:border-[#D4AF37]/40 transition-all">
          <div className="flex items-center space-x-3 text-[#D4AF37]">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-serif text-xl font-bold text-white">Liability &amp; Cancellation</h3>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong>Rescheduling Policy:</strong> Date changes allowed up to 7 days prior to event date based on team availability.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong>Safety &amp; Care:</strong> Equipment protection insured by our operators. Client assumes basic responsibility for guest safety near setup.</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
