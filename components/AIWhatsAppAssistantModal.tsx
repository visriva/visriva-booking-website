"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, Sparkles, Copy, Check, ExternalLink, RefreshCw, X, Bot } from "lucide-react";

interface AIWhatsAppAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  leadData: {
    customerName?: string;
    eventType?: string;
    guestCount?: string;
    location?: string;
    eventDate?: string;
    selectedServices?: string[];
    phone?: string;
    notes?: string;
  };
}

export default function AIWhatsAppAssistantModal({ isOpen, onClose, leadData }: AIWhatsAppAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"vipQuote" | "confirmation" | "followUp">("vipQuote");
  const [messages, setMessages] = useState<{
    vipQuote?: string;
    confirmation?: string;
    followUp?: string;
  }>({});
  const [copied, setCopied] = useState(false);
  const [editableText, setEditableText] = useState("");

  const fetchAIMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gemini/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: leadData.customerName || "Valued Client",
          eventType: leadData.eventType || "Event",
          guestCount: leadData.guestCount || "TBD",
          location: leadData.location || "Bengaluru / Pune",
          eventDate: leadData.eventDate || "Upcoming Event",
          selectedServices: leadData.selectedServices || ["Photo Booth"],
          notes: leadData.notes || "",
        }),
      });

      if (!res.ok) throw new Error("Gemini API request failed");

      const data = await res.json();
      setMessages(data);
      setEditableText(data.vipQuote || "");
    } catch (err) {
      console.error("AI WhatsApp Error:", err);
      // Fallback templates
      const fallback = {
        vipQuote: `*Hi ${leadData.customerName || "there"}!* 👋\n\nThank you for reaching out to *Visriva Live Station*! 📸✨\n\nWe would love to bring our flagship *${Array.isArray(leadData.selectedServices) ? leadData.selectedServices.join(" & ") : "Live Stations"}* to your upcoming *${leadData.eventType || "Event"}* on *${leadData.eventDate || "your requested date"}* in *${leadData.location || "Bengaluru/Pune"}*.\n\nOur setups include studio-grade DSLR optics, instant 10s dye-sublimation prints, QR digital galleries, and live magnetic branding.\n\nWould you like us to lock in your date or send over our detailed pricing matrix?\n\nWarm regards,\n*Visriva Team* (+91 88844 84828)`,
        confirmation: `*Booking Confirmation & Setup Details - Visriva Live Station* 🎯\n\nDear *${leadData.customerName || "Client"}*,\n\nWe are excited to confirm your live station setup for *${leadData.eventDate || "your event"}*!\n\n*Setup Details:*\n- Services: ${Array.isArray(leadData.selectedServices) ? leadData.selectedServices.join(", ") : "Live Station"}\n- Expected Guests: ${leadData.guestCount || "TBD"}\n- Venue Location: ${leadData.location || "Bengaluru/Pune"}\n\nOur on-site technical crew will arrive 60 minutes prior to setup. Please ensure a dedicated 5A power outlet.\n\nBest regards,\n*Visriva Crew Command*`,
        followUp: `*Hi ${leadData.customerName || "there"}!* 🌟\n\nQuick follow-up from *Visriva Live Station* regarding your *${leadData.eventType || "Event"}*.\n\nWe have a special offer for your date: book this week and receive *Complimentary Custom Frame Branding & Glossy Magnetic Upgrade* for all guest souvenirs!\n\nLet us know if you would like us to reserve the team for you!\n\n*Visriva Team* (+91 88844 84828)`,
      };
      setMessages(fallback);
      setEditableText(fallback.vipQuote);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAIMessages();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messages[activeTab]) {
      setEditableText(messages[activeTab] || "");
    }
  }, [activeTab, messages]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const rawPhone = (leadData.phone || "918884484828").replace(/[^0-9]/g, "");
    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(editableText)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#040e09] border border-[#D4AF37]/40 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col gap-4 p-6 text-white space-y-2">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-lg text-white">AI WhatsApp Assistant</h3>
                <span className="text-[10px] font-mono bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/40 font-bold">
                  Gemini 1.5
                </span>
              </div>
              <p className="text-xs text-emerald-100/60">
                Lead: <span className="text-white font-bold">{leadData.customerName || "Guest"}</span> ({leadData.eventType || "Event"})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab("vipQuote")}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === "vipQuote"
                ? "bg-[#D4AF37] text-[#011F15] font-extrabold shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            1. VIP Quote Pitch
          </button>
          <button
            onClick={() => setActiveTab("confirmation")}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === "confirmation"
                ? "bg-[#D4AF37] text-[#011F15] font-extrabold shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            2. Confirmation &amp; Prep
          </button>
          <button
            onClick={() => setActiveTab("followUp")}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === "followUp"
                ? "bg-[#D4AF37] text-[#011F15] font-extrabold shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            3. Follow-up Offer
          </button>
        </div>

        {/* Message Editor Area */}
        <div className="space-y-2 relative">
          <div className="flex items-center justify-between text-xs text-emerald-100/70">
            <span>Editable WhatsApp Message Text:</span>
            <button
              onClick={fetchAIMessages}
              disabled={loading}
              className="text-[11px] text-[#D4AF37] hover:underline flex items-center space-x-1 font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              <span>Regenerate Response</span>
            </button>
          </div>

          <textarea
            rows={7}
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            disabled={loading}
            className="w-full bg-black/70 border border-white/20 rounded-2xl p-4 text-xs font-sans text-white leading-relaxed focus:border-[#D4AF37] outline-none"
          />

          {loading && (
            <div className="absolute inset-0 bg-black/80 rounded-2xl flex items-center justify-center space-x-2 text-xs font-bold text-[#D4AF37]">
              <RefreshCw className="w-5 h-5 animate-spin text-[#D4AF37]" />
              <span>Gemini AI is crafting your message...</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition flex items-center space-x-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg transition flex items-center space-x-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Launch WhatsApp &amp; Send</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
