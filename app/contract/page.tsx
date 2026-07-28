"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Share2,
  CreditCard,
  Building2,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Lock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function ContractContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId") || "";

  // Query param fallbacks for instant offline link generation
  const paramClientName = searchParams.get("client") || "Valued Client";
  const paramEvent = searchParams.get("event") || "Luxury Sangeet / Gala Event";
  const paramDate = searchParams.get("date") || "14th December 2026";
  const paramVenue = searchParams.get("venue") || "Taj West End, Indiranagar, Bengaluru";
  const paramServices = searchParams.get("services") || "Instant Photo Booth, Custom Fridge Magnets";
  const paramAmount = Number(searchParams.get("amount")) || 38000;

  const [clientName, setClientName] = useState(paramClientName);
  const [eventType, setEventType] = useState(paramEvent);
  const [eventDate, setEventDate] = useState(paramDate);
  const [venue, setVenue] = useState(paramVenue);
  const [services, setServices] = useState<string[]>(
    paramServices.split(",").map((s) => s.trim())
  );
  const [totalAmount, setTotalAmount] = useState<number>(paramAmount);
  const [loading, setLoading] = useState<boolean>(Boolean(leadId));

  // Branding & GST state
  const [customHashtag, setCustomHashtag] = useState("");
  const [clientLogoUrl, setClientLogoUrl] = useState("");
  const [isGstInvoice, setIsGstInvoice] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyGstin, setCompanyGstin] = useState("");

  // Signature state
  const [signatureName, setSignatureName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  // Fetch lead data from Firestore if leadId provided
  useEffect(() => {
    if (!leadId) return;
    async function fetchLead() {
      try {
        const docRef = doc(db, "bookings", leadId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.clientName) setClientName(data.clientName);
          if (data.eventType) setEventType(data.eventType);
          if (data.eventDate) setEventDate(data.eventDate);
          if (data.venue) setVenue(data.venue);
          if (data.customHashtag) setCustomHashtag(data.customHashtag);
          if (data.clientLogoUrl) setClientLogoUrl(data.clientLogoUrl);
          if (data.companyName) setCompanyName(data.companyName);
          if (data.companyGstin) setCompanyGstin(data.companyGstin);
          if (data.isGstInvoice !== undefined) setIsGstInvoice(data.isGstInvoice);
          if (data.services && Array.isArray(data.services)) setServices(data.services);
          if (data.estimatedBudget) {
            const num = parseInt(data.estimatedBudget.replace(/[^0-9]/g, ""), 10);
            if (!isNaN(num) && num > 0) setTotalAmount(num);
          }
        }
      } catch (err) {
        console.warn("Contract fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLead();
  }, [leadId]);

  const depositAmount = Math.round(totalAmount * 0.4);
  const balanceAmount = totalAmount - depositAmount;
  const invoiceNumber = `VIS-2026-${leadId ? leadId.slice(0, 6).toUpperCase() : "8848"}`;
  const currentDateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleSignAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName.trim() || !termsAccepted) return;
    setIsSigned(true);
  };

  const handlePayDeposit = () => {
    const message = `Hello Visriva Team! I am confirming the booking for *${clientName}* (${eventType} on ${eventDate} at ${venue}). I have reviewed Invoice *${invoiceNumber}* for Total Amount ₹${totalAmount.toLocaleString("en-IN")}. Please share the UPI / Bank details for 40% Deposit (₹${depositAmount.toLocaleString("en-IN")}).`;
    const whatsappUrl = `https://wa.me/918884484828?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#011F15] flex items-center justify-center text-white font-mono">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-[#D4AF37] animate-spin" />
          <span>Generating Digital Contract &amp; Invoice...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
      
      {/* Print Hide Navbar */}
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        
        {/* Floating Action Controls Bar (Print & WhatsApp Pay) */}
        <div className="print:hidden mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 glass-card">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#D4AF37]">
            <Lock className="w-4 h-4 text-[#D4AF37]" />
            <span>Official Client Agreement &amp; Itemized Invoice</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/20 transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handlePayDeposit}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay 40% Deposit (₹{depositAmount.toLocaleString("en-IN")})</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE LUXURY INVOICE & CONTRACT DOCUMENT */}
        <div className="bg-[#041a12] border-2 border-[#D4AF37]/50 rounded-3xl p-6 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white space-y-10 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
          
          {/* DOCUMENT HEADER */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-[#D4AF37]/30 pb-8">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-serif font-black text-xl shadow-md">
                  V
                </div>
                <h1 className="font-serif text-2xl font-extrabold tracking-tight text-white print:text-black">
                  VISRIVA LIVE STATION
                </h1>
              </div>
              <p className="text-xs text-emerald-100/70 font-sans print:text-gray-600">
                Experiential Event Tech &amp; Instant Live Keepsake Stations
              </p>
              <p className="text-[11px] text-emerald-100/60 font-mono print:text-gray-500">
                Bengaluru &amp; Pune, India • +91 88844 84828 • visriva.work@gmail.com
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 font-mono">
              <span className="inline-block px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-wider print:bg-gray-100 print:text-black">
                OFFICIAL SERVICE AGREEMENT
              </span>
              <div className="text-xs text-white/80 font-bold mt-2 print:text-black">
                Invoice #: <span className="text-[#D4AF37] font-bold">{invoiceNumber}</span>
              </div>
              <div className="text-[11px] text-white/60 print:text-gray-600">Date Issued: {currentDateStr}</div>
            </div>
          </div>

          {/* CLIENT & EVENT OVERVIEW GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/30 p-6 rounded-2xl border border-white/10 print:bg-gray-50 print:border-gray-300">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block font-mono">
                CLIENT &amp; BRANDING INFORMATION
              </span>
              <h3 className="font-serif text-lg font-bold text-white print:text-black">{companyName || clientName}</h3>
              {companyName && (
                <div className="text-xs text-white/80 font-mono">Attn: <strong>{clientName}</strong></div>
              )}
              {isGstInvoice && companyGstin && (
                <div className="text-xs text-[#D4AF37] font-mono font-bold">
                  GSTIN: <span className="uppercase">{companyGstin}</span>
                </div>
              )}
              {customHashtag && (
                <div className="text-xs text-emerald-300 font-mono">
                  Hashtag/Monogram: <strong>{customHashtag}</strong>
                </div>
              )}
              <div className="space-y-1 text-xs text-emerald-100/80 font-mono print:text-gray-700 pt-1">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Event Date: <strong>{eventDate}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Venue: <strong>{venue}</strong></span>
                </div>
              </div>
            </div>

            <div className="space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block font-mono">
                  SERVICE SCOPE &amp; TIER
                </span>
                <h3 className="font-serif text-lg font-bold text-white print:text-black">{eventType}</h3>
                <div className="space-y-1 text-xs text-emerald-100/80 font-mono print:text-gray-700">
                  <div>Services Included: <strong>{services.join(", ") || "Instant Photo Booth"}</strong></div>
                  <div>Operational Hours: <strong>Up to 4 Hours Live Printing</strong></div>
                </div>
              </div>

              {clientLogoUrl && (
                <div className="pt-2">
                  <span className="text-[9px] uppercase font-mono text-white/50 block">Uploaded Brand Logo:</span>
                  <div className="w-16 h-12 rounded-lg border border-[#D4AF37]/40 bg-black/50 p-1 mt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={clientLogoUrl} alt="Brand Logo" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ITEMIZED PRICING & PAYMENT BREAKDOWN */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-bold text-white border-b border-white/10 pb-2 print:text-black print:border-gray-300">
              {isGstInvoice ? "Official Tax Invoice & Payment Breakdown (18% GST)" : "Itemized Quotation & Payment Schedule"}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#D4AF37]/30 text-[#D4AF37] uppercase text-[10px] tracking-wider print:border-gray-400 print:text-black">
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-2">Qty</th>
                    <th className="py-3 px-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 print:divide-gray-200">
                  {isGstInvoice ? (
                    <>
                      <tr>
                        <td className="py-3 px-2">
                          <strong className="text-white block print:text-black">{eventType} Live Setup (Taxable Subtotal)</strong>
                          <span className="text-[11px] text-emerald-100/60 block print:text-gray-600">
                            {services.join(" + ")} with 2 uniformed operators
                          </span>
                        </td>
                        <td className="py-3 px-2">1 Event</td>
                        <td className="py-3 px-2 text-right font-bold text-white print:text-black">
                          ₹{Math.round(totalAmount / 1.18).toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 text-white/80">CGST (9%)</td>
                        <td className="py-3 px-2">9%</td>
                        <td className="py-3 px-2 text-right text-white/80">₹{Math.round((totalAmount / 1.18) * 0.09).toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 text-white/80">SGST (9%)</td>
                        <td className="py-3 px-2">9%</td>
                        <td className="py-3 px-2 text-right text-white/80">₹{Math.round((totalAmount / 1.18) * 0.09).toLocaleString("en-IN")}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td className="py-3 px-2">
                        <strong className="text-white block print:text-black">{eventType} Live Setup</strong>
                        <span className="text-[11px] text-emerald-100/60 block print:text-gray-600">
                          {services.join(" + ")} with 2 uniformed operators &amp; 8-second dye-sub printer
                        </span>
                      </td>
                      <td className="py-3 px-2">1 Event</td>
                      <td className="py-3 px-2 text-right font-bold text-white print:text-black">
                        ₹{totalAmount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-3 px-2">
                      <strong className="text-[#D4AF37] block">Travel &amp; Venue Logistics (15 km Policy)</strong>
                      <span className="text-[11px] text-emerald-100/60 block print:text-gray-600">
                        Complimentary venue transport within 15 km of Bengaluru City Center
                      </span>
                    </td>
                    <td className="py-3 px-2">Included</td>
                    <td className="py-3 px-2 text-right font-bold text-emerald-400">₹0 (FREE)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TOTALS SUMMARY CARD */}
            <div className="bg-black/50 p-5 rounded-2xl border border-[#D4AF37]/40 space-y-2 max-w-sm ml-auto text-xs font-mono print:bg-gray-100 print:border-gray-400">
              <div className="flex items-center justify-between text-white/80 print:text-black">
                <span>Total Contract Value:</span>
                <span className="font-bold text-sm text-white print:text-black">₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between text-[#D4AF37] font-bold border-t border-white/10 pt-2 print:text-black">
                <span>40% Advance Deposit Required:</span>
                <span className="text-base text-[#D4AF37] font-extrabold print:text-black">
                  ₹{depositAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between text-white/60 text-[11px] print:text-gray-600">
                <span>60% Balance (Due on Event Day):</span>
                <span>₹{balanceAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* TERMS & CONDITIONS CLAUSES */}
          <div className="space-y-3 pt-4 border-t border-white/10 text-xs text-emerald-100/80 leading-relaxed font-sans print:text-gray-700">
            <h4 className="font-serif font-bold text-sm text-white print:text-black">Key Service Rules &amp; Responsibilities</h4>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong>Travel &amp; Distance Policy:</strong> Free transport &amp; logistics within <strong>15 km</strong> from Bengaluru City Center. Venues beyond 15 km are billed travel &amp; toll at actuals.
              </li>
              <li>
                <strong>Power Access:</strong> Venue organizer must provide 1 dedicated 5A / 230V standard power plug point within 15 meters of setup location.
              </li>
              <li>
                <strong>Setup Time:</strong> Visriva technical staff requires access to the venue 60–90 minutes prior to event reporting time.
              </li>
              <li>
                <strong>Booking Confirmation:</strong> Dates are reserved upon receipt of the 40% advance deposit.
              </li>
            </ul>
          </div>

          {/* DIGITAL SIGNATURE FORM */}
          <div className="pt-6 border-t border-[#D4AF37]/30 space-y-4">
            <h4 className="font-serif font-bold text-sm text-white print:text-black flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Client Acceptance &amp; Legal Signature</span>
            </h4>

            {isSigned ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono text-xs space-y-1">
                <div className="flex items-center space-x-2 font-bold text-sm text-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>AGREEMENT DIGITALLY ACCEPTED &amp; SIGNED</span>
                </div>
                <div>Signed By: <strong>{signatureName}</strong></div>
                <div>Signed Date: {currentDateStr}</div>
              </div>
            ) : (
              <form onSubmit={handleSignAgreement} className="space-y-4 print:hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] font-mono">
                      Type Your Full Legal Name (Signature)
                    </label>
                    <input
                      type="text"
                      required
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="e.g. Rohan Sharma"
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white font-serif text-sm focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-4">
                    <input
                      type="checkbox"
                      id="terms-check"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-5 h-5 accent-[#D4AF37] cursor-pointer"
                    />
                    <label htmlFor="terms-check" className="text-xs text-white/80 cursor-pointer">
                      I agree to the terms, 15 km travel rule, and 40% deposit schedule.
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!signatureName.trim() || !termsAccepted}
                  className="px-6 py-3 rounded-full bg-[#D4AF37] text-[#011F15] font-extrabold text-xs uppercase tracking-wider hover:scale-105 transition disabled:opacity-50 cursor-pointer"
                >
                  Sign &amp; Accept Agreement
                </button>
              </form>
            )}
          </div>

        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}

export default function ContractPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#011F15] text-white p-10 font-mono">Loading agreement...</div>}>
      <ContractContent />
    </Suspense>
  );
}
