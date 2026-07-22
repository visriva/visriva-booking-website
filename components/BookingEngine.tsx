"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Lock,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { saveBookingLead, BookingLead } from "@/lib/firebase";
import CalendlySuccess from "./CalendlySuccess";

const EVENT_TYPES = [
  "Corporate Event / Gala",
  "Wedding & Pre-Wedding",
  "Brand Activation",
  "Private Party / Celebration",
];

const SERVICE_OPTIONS = [
  { id: "Photos", label: "Instant DSLR Photo Booth", speed: "8-Sec Print" },
  { id: "Magnets", label: "Custom Fridge Magnets", speed: "Live Gloss Finish" },
  { id: "Keychains", label: "Instant Keepsake Keychains", speed: "Acrylic / Metal" },
  { id: "Mugs", label: "Live Mug Printing", speed: "VIP Return Gift" },
];

export default function BookingEngine() {
  // Form State
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [eventType, setEventType] = useState("Corporate Event / Gala");
  const [pax, setPax] = useState<number>(200);
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "Photos",
    "Magnets",
  ]);

  // Client Details
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedLead, setSubmittedLead] = useState<{
    data: BookingLead;
    id: string;
  } | null>(null);

  // Dynamic Budget Logic (Strict User Requirements)
  const budgetInfo = useMemo(() => {
    const p = Number(pax) || 0;
    if (p < 150) {
      return {
        amount: "~₹15,000",
        tier: "Essential Tier",
        displayText: "Estimated Investment: ~₹15,000 (Essential Tier)",
        description: "Ideal for intimate celebrations & exclusive private parties.",
      };
    } else if (p >= 150 && p <= 300) {
      return {
        amount: "~₹25,000",
        tier: "Signature Tier",
        displayText: "Estimated Investment: ~₹25,000 (Signature Tier)",
        description: "Our most popular tier for weddings, corporate activations & product launches.",
      };
    } else {
      return {
        amount: "~₹45,000",
        tier: "Platinum Tier",
        displayText: "Estimated Investment: ~₹45,000 (Platinum Tier)",
        description: "High-capacity dual-printer setup for large galas & multi-day conventions.",
      };
    }
  }, [pax]);

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s !== serviceId));
      }
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!eventDate) {
      setErrorMsg("Please select your event date.");
      return;
    }
    if (!venue.trim()) {
      setErrorMsg("Please enter your venue or city location.");
      return;
    }
    if (!clientName.trim() || !clientPhone.trim()) {
      setErrorMsg("Please provide your contact name and phone number.");
      return;
    }

    setSubmitting(true);

    const leadPayload: BookingLead = {
      eventDate,
      venue,
      eventType,
      pax,
      services: selectedServices,
      estimatedBudget: budgetInfo.amount,
      tier: budgetInfo.tier,
      clientName,
      clientPhone,
      clientEmail,
    };

    const res = await saveBookingLead(leadPayload);

    setSubmitting(false);

    if (res.success && res.id) {
      setSubmittedLead({ data: leadPayload, id: res.id });
    } else {
      setErrorMsg(res.error || "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <section id="booking-engine" className="py-24 bg-emerald-950 relative">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-radial-emerald opacity-50 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-900/80 border border-gold-500/30 text-gold-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Intake & Live Estimator</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
            Reserve Your <span className="text-gold-gradient">Live Station</span>
          </h2>
          <p className="text-emerald-200/80 text-base sm:text-lg font-light">
            Check date availability, customize your live printing package, and get an instant investment estimate.
          </p>
        </div>

        {/* If Form Submitted Successfully -> Render Calendly Widget View */}
        {submittedLead ? (
          <CalendlySuccess leadData={submittedLead.data} leadId={submittedLead.id} />
        ) : (
          /* Intake Form Card */
          <div className="glass-card rounded-3xl p-6 sm:p-10 border border-gold-500/40 shadow-gold-lg">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Form Grid Section 1: Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event Date */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gold-300">
                    Event Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={eventDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-emerald-950/90 border border-emerald-800 focus:border-gold-500 rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors"
                    />
                    <CalendarIcon className="w-5 h-5 text-gold-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Venue / Location */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gold-300">
                    Venue / Location *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Taj West End, Bengaluru"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full bg-emerald-950/90 border border-emerald-800 focus:border-gold-500 rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors"
                    />
                    <MapPin className="w-5 h-5 text-gold-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Event Type Dropdown */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gold-300">
                    Type of Event *
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-emerald-950/90 border border-emerald-800 focus:border-gold-500 rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type} className="bg-emerald-950 text-white">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Approximate Guest Count / Pax */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gold-300">
                      Approximate Guest Count (Pax) *
                    </label>
                    <span className="text-xs font-bold text-gold-400 bg-emerald-900/90 px-2.5 py-1 rounded-md border border-gold-500/30">
                      {pax} Guests
                    </span>
                  </div>
                  <div className="relative flex items-center space-x-3">
                    <input
                      type="number"
                      required
                      min={20}
                      max={2000}
                      value={pax}
                      onChange={(e) => setPax(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full bg-emerald-950/90 border border-emerald-800 focus:border-gold-500 rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors"
                    />
                    <Users className="w-5 h-5 text-gold-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Services Required (Checkboxes) */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gold-300">
                  Services Required *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {SERVICE_OPTIONS.map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 flex items-center justify-between ${
                          isSelected
                            ? "bg-emerald-900/90 border-gold-500 shadow-gold-sm"
                            : "bg-emerald-950/60 border-emerald-800/80 hover:border-emerald-700"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-gold-500 flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          )}
                          <div>
                            <span className="block text-sm font-semibold text-white">
                              {service.label}
                            </span>
                            <span className="block text-[11px] text-emerald-300/70">
                              {service.speed}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DYNAMIC BUDGET ESTIMATOR BOX (Core Strict Feature) */}
              <div className="bg-emerald-900/80 border-2 border-gold-500/60 rounded-2xl p-6 shadow-gold-md relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gold-400 text-xs uppercase tracking-widest font-bold">
                      <TrendingUp className="w-4 h-4 text-gold-500" />
                      <span>Live Automated Budget Estimator</span>
                    </div>
                    {/* Explicit user format string */}
                    <div className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {budgetInfo.displayText}
                    </div>
                    <p className="text-emerald-200/80 text-xs sm:text-sm font-light">
                      {budgetInfo.description} Includes all personnel, equipment, & unlimited premium prints.
                    </p>
                  </div>

                  <div className="px-4 py-2 rounded-xl bg-gold-gradient text-emerald-950 font-extrabold text-sm shadow-md whitespace-nowrap self-start sm:self-center">
                    {budgetInfo.tier}
                  </div>
                </div>
              </div>

              {/* Client Contact Info Section */}
              <div className="pt-4 border-t border-emerald-800/80 space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-300">
                  Your Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Full Name *"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-emerald-950/90 border border-emerald-800 focus:border-gold-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                      />
                      <User className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="Phone / WhatsApp Number *"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-emerald-950/90 border border-emerald-800 focus:border-gold-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                      />
                      <Phone className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="Email Address (Optional)"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-emerald-950/90 border border-emerald-800 focus:border-gold-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                      />
                      <Mail className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-sm">
                  {errorMsg}
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-xs text-emerald-300/70">
                  <Lock className="w-4 h-4 text-gold-500" />
                  <span>Instant confirmation & Calendly consultation call access</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-10 py-4 rounded-full bg-gold-gradient text-emerald-950 font-bold text-base shadow-gold-lg hover:shadow-gold-md hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
                      <span>Saving Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit & Book Consultation</span>
                      <ArrowRight className="w-5 h-5 text-emerald-950" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
