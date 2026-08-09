"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Clock,
  Briefcase,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  Building2,
  FileCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  saveBookingLead,
  BookingLead,
  subscribePricingMatrix,
  DEFAULT_PRICING_MATRIX,
  GlobalPricingMatrix,
  subscribeBlockedDates,
  BlockedDatesConfig,
  DEFAULT_BLOCKED_DATES,
  WheelPerk,
  compressImageFile,
  subscribeFeatureToggles,
  DEFAULT_FEATURE_TOGGLES,
  FeatureTogglesConfig,
} from "@/lib/firebase";
import CalendlySuccess from "./CalendlySuccess";
import LocationAutocomplete from "./LocationAutocomplete";
import AIConciergeWidget from "./AIConciergeWidget";

const ALL_SERVICE_OPTIONS = [
  { id: "Photos", label: "Instant Photo Booth", speed: "8-Sec Print", toggleKey: "enablePhotoBoothService" },
  { id: "Magnets", label: "Custom Fridge Magnets", speed: "Live Gloss Finish", toggleKey: "enableMagnetService" },
  { id: "Keychains", label: "Instant Keepsake Keychains", speed: "Acrylic / Metal", toggleKey: "enableKeychainService" },
  { id: "Mugs", label: "Live Mug Printing", speed: "VIP Return Gift", toggleKey: "enableMugService" },
  { id: "ToteTshirt", label: "Tote Bag & T-Shirt Station", speed: "Sublimation Press", toggleKey: "enableToteTshirtService" },
];

export default function BookingEngine() {
  // Global Pricing Matrix Firestore Subscription
  const [settings, setSettings] = useState<GlobalPricingMatrix>(DEFAULT_PRICING_MATRIX);
  const [featureToggles, setFeatureToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);

  const [blockedDates, setBlockedDates] = useState<BlockedDatesConfig>(DEFAULT_BLOCKED_DATES);
  const [appliedPerk, setAppliedPerk] = useState<WheelPerk | null>(null);

  const [selectedTotePkgId, setSelectedTotePkgId] = useState("tt_100");

  useEffect(() => {
    const unsub = subscribePricingMatrix((data) => {
      if (data) setSettings(data);
    });
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) {
        setFeatureToggles(data);
        // Auto-clean selectedServices to exclude any service turned OFF by Admin
        setSelectedServices((prev) => {
          const cleaned = prev.filter((serviceId) => {
            const match = ALL_SERVICE_OPTIONS.find((s) => s.id === serviceId);
            if (!match) return true;
            return data[match.toggleKey as keyof FeatureTogglesConfig] !== false;
          });
          // Keep empty if nothing was selected — do NOT auto-add defaults
          return cleaned;
        });
      }
    });
    const unsubBlocked = subscribeBlockedDates((data) => {
      if (data) setBlockedDates(data);
    });

    // Check localStorage for claimed Golden Wheel perk
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("visriva_wheel_claimed_perk");
      if (saved) {
        try {
          setAppliedPerk(JSON.parse(saved));
        } catch (e) {}
      }
    }

    // Listen for real-time perk application from Golden Wheel
    const handlePerkEvent = (e: Event) => {
      const customEvent = e as CustomEvent<WheelPerk>;
      if (customEvent.detail) {
        setAppliedPerk(customEvent.detail);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("visriva_perk_applied", handlePerkEvent);
    }

    return () => {
      unsub();
      unsubBlocked();
      if (typeof window !== "undefined") {
        window.removeEventListener("visriva_perk_applied", handlePerkEvent);
      }
    };
  }, []);

  // Form State & Expanded Fields
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [eventType, setEventType] = useState("");
  const [reportingTime, setReportingTime] = useState("");
  const [endingTime, setEndingTime] = useState("");
  const [pax, setPax] = useState<number>(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Station Sub-Option Package Tiers State (Includes DSLR & iPad for Photo Booth)
  const [pbHardware, setPbHardware] = useState<"dslr" | "ipad">("dslr");
  const [selectedPbPkgId, setSelectedPbPkgId] = useState<string>("");
  const [selectedMagPkgId, setSelectedMagPkgId] = useState<string>("");
  const [selectedKcPkgId, setSelectedKcPkgId] = useState<string>("");
  const [selectedMugPkgId, setSelectedMugPkgId] = useState<string>("");

  // Feature 2: Client Branding & Logo Upload State
  const [customHashtag, setCustomHashtag] = useState("");
  const [clientLogoUrl, setClientLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Feature 5: Corporate GST Invoice Mode State
  const [isGstInvoice, setIsGstInvoice] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyGstin, setCompanyGstin] = useState("");

  // Client Contact Details
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

  // MODULAR DYNAMIC PRICING CALCULATOR ENGINE (Reads directly from config/global_settings & package selections)
  const budgetInfo = useMemo(() => {
    const guestCount = Number(pax) || 0;
    let total = 0;
    const lineItems: string[] = [];

    const pbMatrix = settings.photoBooth || DEFAULT_PRICING_MATRIX.photoBooth;
    const magMatrix = settings.magnets || DEFAULT_PRICING_MATRIX.magnets;
    const mugMatrix = settings.mugs || DEFAULT_PRICING_MATRIX.mugs;
    const kcMatrix = settings.keychains || DEFAULT_PRICING_MATRIX.keychains;

    const activeSelectedServices: string[] = [];

    // 1. Photo Booth Calculation (Supports DSLR vs iPad packages)
    if (selectedServices.includes("Photos") && featureToggles.enablePhotoBoothService !== false) {
      activeSelectedServices.push("Photos");
      const pbPackages = pbHardware === "dslr"
        ? (pbMatrix.dslrPackages && pbMatrix.dslrPackages.length > 0 ? pbMatrix.dslrPackages : DEFAULT_PRICING_MATRIX.photoBooth.dslrPackages)
        : (pbMatrix.ipadPackages && pbMatrix.ipadPackages.length > 0 ? pbMatrix.ipadPackages : DEFAULT_PRICING_MATRIX.photoBooth.ipadPackages);

      const chosenPbPkg = pbPackages.find((p) => p.id === selectedPbPkgId) || pbPackages[0];
      let pbPrice = chosenPbPkg?.price || 15000;

      if (guestCount > 150) {
        const extraPax = guestCount - 150;
        const extraSteps = Math.ceil(extraPax / 50);
        pbPrice += extraSteps * 3000;
      }
      total += pbPrice;
      lineItems.push(`Photo Booth [${pbHardware.toUpperCase()} - ${chosenPbPkg?.name}]: ₹${pbPrice.toLocaleString("en-IN")}`);
    }

    // 2. Magnets Calculation
    if (selectedServices.includes("Magnets") && featureToggles.enableMagnetService !== false) {
      activeSelectedServices.push("Magnets");
      const magPackages = magMatrix.packages && magMatrix.packages.length > 0 ? magMatrix.packages : DEFAULT_PRICING_MATRIX.magnets.packages;
      const chosenMagPkg = magPackages.find((p) => p.id === selectedMagPkgId) || magPackages[0];
      let magPrice = chosenMagPkg?.price || 25000;

      if (guestCount > 100) {
        const extraPieces = guestCount - 100;
        const extraSteps = Math.ceil(extraPieces / 50);
        magPrice += extraSteps * 4000;
      }
      total += magPrice;
      lineItems.push(`Fridge Magnets [${chosenMagPkg?.name}]: ₹${magPrice.toLocaleString("en-IN")}`);
    }

    // 3. Mugs Calculation
    if (selectedServices.includes("Mugs") && featureToggles.enableMugService !== false) {
      activeSelectedServices.push("Mugs");
      const mugPackages = mugMatrix.packages && mugMatrix.packages.length > 0 ? mugMatrix.packages : DEFAULT_PRICING_MATRIX.mugs.packages;
      const chosenMugPkg = mugPackages.find((p) => p.id === selectedMugPkgId) || mugPackages[0];
      const mugPrice = chosenMugPkg?.price || 15000;
      total += mugPrice;
      lineItems.push(`Live Mugs [${chosenMugPkg?.name}]: ₹${mugPrice.toLocaleString("en-IN")}`);
    }

    // 4. Keychains Calculation
    if (selectedServices.includes("Keychains") && featureToggles.enableKeychainService !== false) {
      activeSelectedServices.push("Keychains");
      const kcPackages = kcMatrix.packages && kcMatrix.packages.length > 0 ? kcMatrix.packages : DEFAULT_PRICING_MATRIX.keychains.packages;
      const chosenKcPkg = kcPackages.find((p) => p.id === selectedKcPkgId) || kcPackages[0];
      const kcPrice = chosenKcPkg?.price || 16000;
      total += kcPrice;
      lineItems.push(`Keychains [${chosenKcPkg?.name}]: ₹${kcPrice.toLocaleString("en-IN")}`);
    }

    // 5. Tote Bag & T-Shirt Calculation
    if (selectedServices.includes("ToteTshirt") && featureToggles.enableToteTshirtService !== false) {
      activeSelectedServices.push("ToteTshirt");
      const toteMatrix = settings.toteTshirt || DEFAULT_PRICING_MATRIX.toteTshirt;
      const totePackages = toteMatrix.packages && toteMatrix.packages.length > 0 ? toteMatrix.packages : DEFAULT_PRICING_MATRIX.toteTshirt.packages;
      const chosenTotePkg = totePackages.find((p) => p.id === selectedTotePkgId) || totePackages[0];
      const totePrice = chosenTotePkg?.price || 18999;
      total += totePrice;
      lineItems.push(`Tote & T-Shirt [${chosenTotePkg?.name}]: ₹${totePrice.toLocaleString("en-IN")}`);
    }

    // 5. Idle Time Calculation
    let extraHours = 0;
    let idleFee = 0;
    if (reportingTime && endingTime) {
      const [startH, startM] = reportingTime.split(":").map(Number);
      const [endH, endM] = endingTime.split(":").map(Number);

      let startTotalMin = startH * 60 + (startM || 0);
      let endTotalMin = endH * 60 + (endM || 0);

      if (endTotalMin < startTotalMin) {
        endTotalMin += 24 * 60; // Overnight event handling
      }

      const durationHours = (endTotalMin - startTotalMin) / 60;
      if (durationHours > 4) {
        extraHours = durationHours - 4;
        const hourlyRate = pbMatrix.idleHourlyRate || 1500;
        idleFee = Math.ceil(extraHours) * hourlyRate;
        total += idleFee;
        lineItems.push(
          `Extra Operational Time (${Math.ceil(extraHours)}h @ ₹${hourlyRate}/h): ₹${idleFee.toLocaleString("en-IN")}`
        );
      }
    }

    // ── GOLDEN WHEEL PERK DISCOUNT ENGINE ──
    let perkDiscount = 0;
    let perkNote = "";
    if (appliedPerk) {
      const code = appliedPerk.code || "";
      const title = appliedPerk.title || "";
      if (code.includes("1500") || title.includes("1500")) perkDiscount = 1500;
      else if (code.includes("2000") || title.includes("2000")) perkDiscount = 2000;
      else if (code.includes("1000") || title.includes("1000")) perkDiscount = 1000;

      if (perkDiscount > 0) {
        perkNote = `🎁 Golden Wheel Perk (${code}): -₹${perkDiscount.toLocaleString("en-IN")} Discount`;
      } else {
        perkNote = `🎁 Golden Wheel Perk (${code}): ${title} Included FREE`;
      }
    }

    const subtotal = total;
    const isComboEligible = activeSelectedServices.length >= 2;
    const comboDiscount = isComboEligible ? Math.round(subtotal * 0.10) : 0;
    const totalDiscounts = comboDiscount + perkDiscount;
    const finalTotal = Math.max(0, subtotal - totalDiscounts);

    if (isComboEligible && comboDiscount > 0) {
      lineItems.push(`🎉 Multi-Station Combo Discount (10% OFF): -₹${comboDiscount.toLocaleString("en-IN")}`);
    }
    if (perkNote) {
      lineItems.push(perkNote);
    }

    // Determine Tier Badge
    let tier = "Custom Package";
    if (finalTotal >= 60000) tier = "Platinum Tier";
    else if (finalTotal >= 35000) tier = "Signature Tier";
    else tier = "Essential Tier";

    return {
      rawNumber: finalTotal,
      subtotal,
      discountAmount: comboDiscount,
      perkDiscount,
      totalDiscounts,
      isComboEligible,
      amount: `₹${finalTotal.toLocaleString("en-IN")}`,
      subtotalAmount: `₹${subtotal.toLocaleString("en-IN")}`,
      tier,
      lineItems,
      description: lineItems.length > 0 ? lineItems.join(" • ") : "Select stations to view instant calculation.",
    };
  }, [pax, selectedServices, reportingTime, endingTime, settings, pbHardware, selectedPbPkgId, selectedMagPkgId, selectedKcPkgId, selectedMugPkgId, selectedTotePkgId, appliedPerk, featureToggles]);

  const toggleService = (serviceId: string) => {
    const match = ALL_SERVICE_OPTIONS.find((s) => s.id === serviceId);
    if (match && featureToggles[match.toggleKey as keyof FeatureTogglesConfig] === false) {
      return; // Service disabled by Admin
    }
    if (selectedServices.includes(serviceId)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s !== serviceId));
      }
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleApplyAIRecommendation = (recServiceIds: string[]) => {
    const map: Record<string, string> = {
      "photo-booth": "Photos",
      magnets: "Magnets",
      keychains: "Keychains",
      mugs: "Mugs",
      totes: "ToteTshirt",
    };
    const mapped = recServiceIds.map((id) => map[id] || id).filter(Boolean);
    if (mapped.length > 0) {
      setSelectedServices(mapped);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const scrollForm = () => {
      const el = document.getElementById("booking-engine");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    if (!eventDate) {
      setErrorMsg("Please select your event date.");
      scrollForm();
      return;
    }
    if (!venue.trim()) {
      setErrorMsg("Please select your event venue location.");
      scrollForm();
      return;
    }
    if (!clientName.trim() || !clientPhone.trim()) {
      setErrorMsg("Please provide your contact name and phone number.");
      scrollForm();
      return;
    }

    setSubmitting(true);

    const leadPayload: BookingLead = {
      eventDate,
      venue,
      eventType,
      reportingTime,
      endingTime,
      pax,
      services: selectedServices,
      estimatedBudget: budgetInfo.amount,
      tier: budgetInfo.tier,
      clientName,
      clientPhone,
      clientEmail,
      customHashtag,
      clientLogoUrl,
      companyName,
      companyGstin,
      isGstInvoice,
      ...(appliedPerk ? { claimedPerk: `${appliedPerk.title} (${appliedPerk.code})` } : {}),
    };

    const res = await fetch("/api/booking/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadPayload),
    });
    const result = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));

    setSubmitting(false);

    if (result.success && result.id) {
      setSubmittedLead({ data: leadPayload, id: result.id });
      scrollForm();
    } else {
      // Fallback to direct Firestore if API unavailable
      const fallback = await saveBookingLead(leadPayload);
      if (fallback.success && fallback.id) {
        setSubmittedLead({ data: leadPayload, id: fallback.id });
        scrollForm();
      } else {
        setErrorMsg(result.error || fallback.error || "An unexpected error occurred. Please try again.");
        scrollForm();
      }
    }
  };

  return (
    <section id="booking-engine" className="py-24 bg-transparent relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title Header */}
        <div className="text-left max-w-3xl mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md font-cinzel">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Interactive Intake &amp; Live Estimator</span>
          </div>
          <h2 className="font-playfair text-4xl sm:text-6xl font-bold tracking-tight text-white mb-4">
            Reserve Your <span className="text-gold-gradient">Live Station</span>
          </h2>
          <p className="font-sans text-emerald-100/80 text-base sm:text-lg font-light">
            Check date availability, customize your live printing package, and receive an instant investment estimate.
          </p>
        </div>

        {/* If Form Submitted Successfully -> Render Calendly Widget View */}
        {submittedLead ? (
          <CalendlySuccess leadData={submittedLead.data} leadId={submittedLead.id} />
        ) : (
          /* Intake Form Card */
          <div className="glass-card rounded-2xl p-6 sm:p-10 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* ACTIVE GOLDEN PERK BANNER */}
              {appliedPerk && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#D4AF37]/20 via-amber-500/10 to-[#D4AF37]/20 border border-[#D4AF37]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-gold-sm animate-fade-in">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient text-[#011F15] flex items-center justify-center shrink-0 shadow-sm font-black text-lg">
                      🎰
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">
                          Golden Wheel Perk Active ✅
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#011F15] font-mono font-black">
                          {appliedPerk.code}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {appliedPerk.title}
                      </p>
                      <p className="text-xs text-emerald-100/70">
                        {appliedPerk.description || "Automatically applied to your booking estimate!"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAppliedPerk(null)}
                    className="text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer shrink-0"
                  >
                    Remove Perk ✕
                  </button>
                </div>
              )}

              {/* AI Concierge Widget Banner */}
              <div className="my-4">
                <AIConciergeWidget onApplyRecommendation={handleApplyAIRecommendation} />
              </div>

              {/* Form Grid Section 1: Event Details & New Expanded Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Event Date */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                    Event Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={eventDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors backdrop-blur-sm"
                    />
                    <CalendarIcon className="w-5 h-5 text-[#D4AF37] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Real-Time Availability Status Indicator */}
                  {eventDate && (
                    <div className="pt-1">
                      {blockedDates.fullyBookedDates.includes(eventDate) ? (
                        <span className="inline-flex items-center space-x-1.5 text-[11px] font-mono font-bold text-red-400 bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/40">
                          <span>🔴 Date Fully Booked (Waitlist Inquiry)</span>
                        </span>
                      ) : blockedDates.highDemandDates.includes(eventDate) ? (
                        <span className="inline-flex items-center space-x-1.5 text-[11px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/40">
                          <span>🟡 High Demand Date (Only 1 Rig Remaining)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                          <span>🟢 Date Available for Instant Reservation</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Venue Location (Google Places Swiggy-Style Autocomplete) */}
                <div className="space-y-2 md:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                    Venue / Location (Google Places Autocomplete) *
                  </label>
                  <LocationAutocomplete
                    value={venue}
                    onChange={setVenue}
                    placeholder="Search venue, address, or landmark (e.g. Taj West End, Bengaluru)..."
                  />
                  <p className="text-[11px] text-emerald-100/70 font-sans flex items-center space-x-1 pt-0.5">
                    <span className="text-[#D4AF37] font-bold">• Note:</span>
                    <span>Complimentary venue logistics included within <strong>15 km</strong> from Bengaluru City Center. Venues beyond 15 km billed extra at actuals.</span>
                  </p>
                </div>

                {/* Event Type Text Input */}
                <div className="space-y-2 md:col-span-3 lg:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                    Event Type *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. South Indian Wedding, Corporate Tech Gala"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors backdrop-blur-sm"
                    />
                    <Briefcase className="w-4 h-4 text-[#D4AF37] absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* NEW FIELD: Reporting Time (Time Picker) */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                    Reporting Time (Team Arrival) *
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      value={reportingTime}
                      onChange={(e) => setReportingTime(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors backdrop-blur-sm"
                    />
                    <Clock className="w-5 h-5 text-[#D4AF37] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* NEW FIELD: Ending Time (Time Picker) */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                    Ending Time (Station Close) *
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      value={endingTime}
                      onChange={(e) => setEndingTime(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors backdrop-blur-sm"
                    />
                    <Clock className="w-5 h-5 text-[#D4AF37] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* ── FEATURE 8: INTERACTIVE PAX GUEST COUNT SLIDER & CAPACITY ESTIMATOR ── */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                      Expected Guest Count (Pax) &amp; Print Capacity *
                    </label>
                    <span className="text-sm font-bold text-white font-mono bg-white/10 px-3 py-1 rounded-full border border-white/10">
                      {pax} Guests
                    </span>
                  </div>

                  {/* PAX Quick Preset Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-emerald-100/50 uppercase font-mono mr-1">Quick Presets:</span>
                    {[100, 250, 500, 1000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPax(preset)}
                        className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                          pax === preset
                            ? "bg-[#D4AF37] text-[#011F15] font-extrabold shadow-gold-sm scale-105"
                            : "bg-white/5 border border-white/10 text-white hover:bg-white/15"
                        }`}
                      >
                        {preset} PAX
                      </button>
                    ))}
                  </div>

                  {/* Interactive Range Slider */}
                  <div className="flex items-center space-x-3 pt-1">
                    <input
                      type="range"
                      min={0}
                      max={1000}
                      step={25}
                      value={pax}
                      onChange={(e) => setPax(Number(e.target.value))}
                      className="w-full accent-[#D4AF37] h-2.5 bg-black/50 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min={10}
                      max={5000}
                      value={pax}
                      onChange={(e) => setPax(Number(e.target.value))}
                      className="w-20 bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl px-3 py-2 text-white text-xs text-center font-mono outline-none"
                    />
                  </div>

                  {/* Live Equipment & Print Capacity Recommendation */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-[#D4AF37]/30 text-xs text-emerald-100/90 flex items-start space-x-2.5">
                    <Sparkles className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#D4AF37] block">Station Capacity Recommendation:</span>
                      {pax <= 150 ? (
                        <span>✨ 150+ High-Gloss Dye-Sub Prints • 1 Studio Strobe Rig • 1 White-Glove Operator (Ideal for Intimate VIP Galas)</span>
                      ) : pax <= 400 ? (
                        <span>✨ 350+ High-Gloss Dye-Sub Prints • 2 High-Speed Print Stations • 2 Tech Assistants (Recommended for Weddings & Galas)</span>
                      ) : (
                        <span>✨ 600+ Thermal Prints • Dual Studio Print Engines • 3 White-Glove Attendants (Recommended for Grand Corporate Galas)</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Form Grid Section 2: Services Checkboxes */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                  Select Required Stations *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {ALL_SERVICE_OPTIONS.filter((s) => {
                    const toggleVal = featureToggles[s.toggleKey as keyof FeatureTogglesConfig];
                    return toggleVal !== false;
                  }).map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 flex items-center justify-between ${
                          isSelected
                            ? "bg-white/10 border-[#D4AF37] shadow-gold-sm"
                            : "bg-black/30 border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
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

                {/* EXPANDING SUB-OPTIONS & PACKAGE TIER SELECTOR PANEL */}
                {selectedServices.length > 0 && (
                  <div className="space-y-4 pt-2">
                    {/* 1. Photo Booth Sub-Option: Hardware (DSLR vs iPad) + Package Tier Selection */}
                    {selectedServices.includes("Photos") && (
                      <div className="p-4 rounded-2xl bg-white/5 border border-[#D4AF37]/40 space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center space-x-1.5 font-mono">
                              <span>📷 Photo Booth Hardware &amp; Package Tier</span>
                            </span>
                            <span className="text-[10px] text-emerald-300 font-mono block">
                              ✂️ Default: All 2×6 photo strips print 2 duplicate strips per session (1 for guest + 1 for memory book)
                            </span>
                          </div>

                          {/* Hardware Selector Toggle: DSLR vs iPad */}
                          <div className="flex items-center space-x-2 bg-black/40 p-1 rounded-xl border border-white/10">
                            <button
                              type="button"
                              onClick={() => setPbHardware("dslr")}
                              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                                pbHardware === "dslr" ? "bg-[#D4AF37] text-[#011F15]" : "text-white/70 hover:text-white"
                              }`}
                            >
                              DSLR Studio Setup 📸
                            </button>
                            <button
                              type="button"
                              onClick={() => setPbHardware("ipad")}
                              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                                pbHardware === "ipad" ? "bg-[#D4AF37] text-[#011F15]" : "text-white/70 hover:text-white"
                              }`}
                            >
                              iPad Ring Light Kiosk 📱
                            </button>
                          </div>
                        </div>

                        {/* Render Active Hardware Packages */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {(pbHardware === "dslr"
                            ? (settings.photoBooth?.dslrPackages?.length ? settings.photoBooth.dslrPackages : DEFAULT_PRICING_MATRIX.photoBooth.dslrPackages)
                            : (settings.photoBooth?.ipadPackages?.length ? settings.photoBooth.ipadPackages : DEFAULT_PRICING_MATRIX.photoBooth.ipadPackages)
                          ).map((pkg) => {
                            const isSelectedPkg = (selectedPbPkgId || (pbHardware === "dslr" ? "dslr_essential" : "ipad_essential")) === pkg.id;
                            return (
                              <div
                                key={pkg.id}
                                onClick={() => setSelectedPbPkgId(pkg.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                                  isSelectedPkg
                                    ? "bg-[#D4AF37]/20 border-[#D4AF37] shadow-gold-sm"
                                    : "bg-black/40 border-white/10 hover:border-white/25"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-serif font-bold text-xs text-white">{pkg.name}</span>
                                    <span className="font-mono text-xs font-bold text-[#D4AF37]">₹{pkg.price.toLocaleString("en-IN")}</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-100/60 font-mono block mt-0.5">{pkg.subtitle || pkg.duration}</span>
                                </div>
                                {pkg.features && (
                                  <ul className="text-[9px] text-white/70 space-y-0.5 border-t border-white/10 pt-1 font-sans">
                                    {pkg.features.slice(0, 3).map((f, i) => (
                                      <li key={i} className="truncate">• {f}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. Custom Magnets Package Tier Selection */}
                    {selectedServices.includes("Magnets") && (
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] block font-mono">
                          🧲 Custom Fridge Magnets Package Tier
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {(settings.magnets?.packages?.length ? settings.magnets.packages : DEFAULT_PRICING_MATRIX.magnets.packages).map((pkg) => {
                            const isSelectedPkg = (selectedMagPkgId || "mag_classic") === pkg.id;
                            return (
                              <div
                                key={pkg.id}
                                onClick={() => setSelectedMagPkgId(pkg.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                                  isSelectedPkg
                                    ? "bg-[#D4AF37]/20 border-[#D4AF37] shadow-gold-sm"
                                    : "bg-black/40 border-white/10 hover:border-white/25"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-serif font-bold text-xs text-white">{pkg.name}</span>
                                    <span className="font-mono text-xs font-bold text-[#D4AF37]">₹{pkg.price.toLocaleString("en-IN")}</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-100/60 font-mono block mt-0.5">{pkg.subtitle || pkg.duration}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. Live Mugs Package Tier Selection */}
                    {selectedServices.includes("Mugs") && (
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] block font-mono">
                          ☕ Live Mug Printing Package Tier
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {(settings.mugs?.packages?.length ? settings.mugs.packages : DEFAULT_PRICING_MATRIX.mugs.packages).map((pkg) => {
                            const isSelectedPkg = (selectedMugPkgId || "mug_classic") === pkg.id;
                            return (
                              <div
                                key={pkg.id}
                                onClick={() => setSelectedMugPkgId(pkg.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                                  isSelectedPkg
                                    ? "bg-[#D4AF37]/20 border-[#D4AF37] shadow-gold-sm"
                                    : "bg-black/40 border-white/10 hover:border-white/25"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-serif font-bold text-xs text-white">{pkg.name}</span>
                                    <span className="font-mono text-xs font-bold text-[#D4AF37]">₹{pkg.price.toLocaleString("en-IN")}</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-100/60 font-mono block mt-0.5">{pkg.subtitle || pkg.duration}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4. Keychains Package Tier Selection */}
                    {selectedServices.includes("Keychains") && (
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] block font-mono">
                          🔑 Metal / Acrylic Keychains Package Tier
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {(settings.keychains?.packages?.length ? settings.keychains.packages : DEFAULT_PRICING_MATRIX.keychains.packages).map((pkg) => {
                            const isSelectedPkg = (selectedKcPkgId || "kc_classic") === pkg.id;
                            return (
                              <div
                                key={pkg.id}
                                onClick={() => setSelectedKcPkgId(pkg.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                                  isSelectedPkg
                                    ? "bg-[#D4AF37]/20 border-[#D4AF37] shadow-gold-sm"
                                    : "bg-black/40 border-white/10 hover:border-white/25"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-serif font-bold text-xs text-white">{pkg.name}</span>
                                    <span className="font-mono text-xs font-bold text-[#D4AF37]">₹{pkg.price.toLocaleString("en-IN")}</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-100/60 font-mono block mt-0.5">{pkg.subtitle || pkg.duration}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 5. Tote Bag & T-Shirt Station Package Tier Selection */}
                    {selectedServices.includes("ToteTshirt") && (
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] block font-mono">
                          👜 Canvas Tote Bag &amp; T-Shirt Sublimation Package Tier
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {((settings.toteTshirt?.packages?.length ? settings.toteTshirt.packages : DEFAULT_PRICING_MATRIX.toteTshirt?.packages) || []).map((pkg) => {
                            const isSelectedPkg = (selectedTotePkgId || "tt_100") === pkg.id;
                            return (
                              <div
                                key={pkg.id}
                                onClick={() => setSelectedTotePkgId(pkg.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                                  isSelectedPkg
                                    ? "bg-[#D4AF37]/20 border-[#D4AF37] shadow-gold-sm"
                                    : "bg-black/40 border-white/10 hover:border-white/25"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-serif font-bold text-xs text-white">{pkg.name}</span>
                                    <span className="font-mono text-xs font-bold text-[#D4AF37]">₹{pkg.price.toLocaleString("en-IN")}</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-100/60 font-mono block mt-0.5">{pkg.subtitle || pkg.duration}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DYNAMIC MODULAR PRICING MATRIX BOX */}
              <div className="glass-card border-2 border-[#D4AF37]/60 rounded-2xl p-6 shadow-gold-md relative overflow-hidden bg-white/5 space-y-4">
                
                {/* Combo Discount Banner */}
                {budgetInfo.isComboEligible ? (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold flex items-center justify-between animate-pulse">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>🎉 10% MULTI-STATION COMBO DISCOUNT APPLIED!</span>
                    </div>
                    <span className="font-mono text-white bg-emerald-600 px-2 py-0.5 rounded">
                      SAVE ₹{budgetInfo.discountAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-100/70 text-[11px] flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                    <span>💡 Tip: Select 1 more live station to unlock an instant <strong>10% Multi-Station Combo Discount</strong>!</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-[#D4AF37] text-xs uppercase tracking-widest font-bold">
                      <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                      <span>Live Modular Pricing Matrix</span>
                    </div>

                    {/* Glowing Animated Spinning Number */}
                    <div className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center space-x-2">
                      <span>Estimated Investment:</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={budgetInfo.amount}
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.25 }}
                          className="text-gold-gradient drop-shadow-md font-mono"
                        >
                          {budgetInfo.amount}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="px-4 py-2 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-sm shadow-md whitespace-nowrap self-start sm:self-center">
                    {budgetInfo.tier}
                  </div>
                </div>

                {/* Line Item Breakdown */}
                <div className="pt-3 border-t border-white/10 text-xs text-emerald-100/80 font-mono space-y-1">
                  <div className="text-[11px] text-[#D4AF37] uppercase tracking-wider font-sans font-semibold">
                    Calculation Breakdown:
                  </div>
                  {budgetInfo.lineItems.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-[#D4AF37]">•</span>
                      <span className={item.includes("10% OFF") ? "text-emerald-400 font-bold" : ""}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FEATURE 2: CLIENT BRANDING INTAKE & LOGO UPLOAD */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center space-x-2 text-[#D4AF37] text-xs font-bold uppercase tracking-wider font-mono">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>Custom Print Branding &amp; Monogram Setup</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/80 font-mono">
                      Event Hashtag / Couple Names (Printed on Frames &amp; Magnets)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. #RahulWedsAnanya2026 or Google Tech Gala"
                      value={customHashtag}
                      onChange={(e) => setCustomHashtag(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-white text-sm outline-none font-serif"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/80 font-mono">
                      Upload Corporate Logo / Monogram (PNG Format)
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37]/30 transition flex items-center space-x-2 shrink-0">
                        <Upload className="w-4 h-4" />
                        <span>{uploadingLogo ? "Compressing..." : "Choose Logo PNG"}</span>
                        <input
                          type="file"
                          accept="image/*,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingLogo(true);
                            try {
                              const compressed = await compressImageFile(file, 800, 800, 0.85);
                              setClientLogoUrl(compressed);
                            } catch (err) {
                              console.warn("Logo upload failed", err);
                            } finally {
                              setUploadingLogo(false);
                            }
                          }}
                        />
                      </label>
                      {clientLogoUrl && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#D4AF37] bg-black shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={clientLogoUrl} alt="Uploaded logo" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* FEATURE 5: CORPORATE TAX & GST INVOICE MODE */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-white text-xs font-bold uppercase tracking-wider">
                    <Building2 className="w-4 h-4 text-[#D4AF37]" />
                    <span>Need a Corporate Tax Invoice (18% GST Breakdown)?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGstInvoice(!isGstInvoice)}
                    className={`px-3.5 py-1 rounded-xl text-xs font-extrabold font-mono transition cursor-pointer ${
                      isGstInvoice ? "bg-[#D4AF37] text-[#011F15]" : "bg-white/10 text-white/70 hover:text-white"
                    }`}
                  >
                    {isGstInvoice ? "GST INVOICE MODE ENABLED ✅" : "ADD GST DETAILS +"}
                  </button>
                </div>

                {isGstInvoice && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] font-mono">
                        Company Legal Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Infosys Limited / Swiggy Private Ltd"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-white text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] font-mono">
                        Company GSTIN Number (15 Digits)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 29AAAAA0000A1Z5"
                        value={companyGstin}
                        onChange={(e) => setCompanyGstin(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-white text-xs font-mono outline-none uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Client Contact Info Section */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                  Your Contact Details
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
                        className="w-full bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                      />
                      <User className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number *"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                      />
                      <Phone className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="Email Address (Optional)"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                      />
                      <Mail className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message Display */}
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-base shadow-gold-lg hover:shadow-gold-md hover:scale-[1.02] active:scale-98 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Securing Your Date...</span>
                  ) : (
                    <>
                      <span>Check Availability &amp; Reserve Date</span>
                      <ArrowRight className="w-5 h-5 text-[#011F15]" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center space-x-2 text-[11px] text-emerald-200/60 font-mono">
                <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Zero Commitment • Instant Availability Check • Direct Team Response</span>
              </div>

            </form>
          </div>
        )}

      </div>
    </section>
  );
}
