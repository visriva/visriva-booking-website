"use client";

import React, { useState } from "react";
import { CheckCircle2, Calendar as CalendarIcon, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { BookingLead } from "@/lib/firebase";

interface CalendlySuccessProps {
  leadData: Partial<BookingLead>;
  leadId?: string;
  onReset?: () => void;
}

export default function CalendlySuccess({ leadData, leadId }: CalendlySuccessProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Calendly embed placeholder URL (as requested by user)
  const calendlyUrl = "https://calendly.com/visriva/15min";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Confirmation Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-gold-500/50 shadow-gold-lg text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-gold-500/10 pointer-events-none">
          <Sparkles className="w-32 h-32" />
        </div>

        <div className="w-16 h-16 rounded-full bg-gold-gradient text-emerald-950 flex items-center justify-center mx-auto mb-6 shadow-gold-md">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <h3 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
          Booking Inquiry Received!
        </h3>

        <p className="text-gold-300 text-base sm:text-lg max-w-xl mx-auto mb-6 font-light">
          Your request for <strong className="text-white">{leadData.eventType || "your event"}</strong> on{" "}
          <strong className="text-white">{leadData.eventDate || "selected date"}</strong> has been logged into our VIP queue.
        </p>

        {/* Lead Reference Details Box */}
        <div className="bg-emerald-950/70 border border-emerald-800 rounded-2xl p-4 sm:p-6 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-left text-xs sm:text-sm">
          <div>
            <span className="text-emerald-400 block text-[11px] uppercase tracking-wider">Estimated Tier</span>
            <span className="font-bold text-gold-400">{leadData.tier || "Essential"}</span>
          </div>
          <div>
            <span className="text-emerald-400 block text-[11px] uppercase tracking-wider">Pax Count</span>
            <span className="font-bold text-white">{leadData.pax || 150} Guests</span>
          </div>
          <div>
            <span className="text-emerald-400 block text-[11px] uppercase tracking-wider">Ref ID</span>
            <span className="font-mono text-emerald-200 truncate block">{leadId || "REF-CONFIRMED"}</span>
          </div>
        </div>

        {/* Instant WhatsApp Alert Trigger Button */}
        <div className="pt-4 flex justify-center">
          <a
            href={`https://wa.me/918884484828?text=${encodeURIComponent(
              `Hello Visriva Live Station! I just submitted a booking inquiry (Ref: ${leadId || "CONFIRMED"}). My event is on ${leadData.eventDate || "selected date"} at ${leadData.venue || "Bengaluru"}. Please confirm availability!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all flex items-center space-x-2"
          >
            <span>💬 Instant Chat &amp; Confirm on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Step 2: Calendly Consultation Section */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-gold-500/30">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-900 border border-gold-500/30 text-gold-400 text-xs font-semibold uppercase tracking-wider">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Final Step: Lock In Your Call</span>
          </div>
          <h4 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Schedule Your 15-Minute Consultation
          </h4>
          <p className="text-emerald-200/80 text-sm font-light">
            Select a convenient time slot below to confirm custom branding frame designs, gear setup, and on-site logistics with our event lead.
          </p>
        </div>

        {/* Embedded Calendly Frame Container */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-emerald-950 border border-emerald-800 shadow-2xl min-h-[600px]">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-emerald-950/90 z-10">
              <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gold-400 text-sm font-medium">Loading VIP Calendar Widget...</p>
            </div>
          )}

          <iframe
            src={`${calendlyUrl}?embed_domain=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "visriva.com"
            )}&embed_type=Inline`}
            width="100%"
            height="650"
            frameBorder="0"
            title="Select Consultation Time - Visriva Live Station"
            onLoad={() => setIframeLoaded(true)}
            className="w-full h-[650px]"
          />
        </div>

        {/* Direct Link Alternative */}
        <div className="mt-6 text-center">
          <p className="text-xs text-emerald-300/70 mb-3">
            Trouble loading the interactive calendar?
          </p>
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-sm text-gold-400 hover:text-gold-300 underline underline-offset-4 font-semibold"
          >
            <span>Open Calendly in a New Window</span>
            <Clock className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
