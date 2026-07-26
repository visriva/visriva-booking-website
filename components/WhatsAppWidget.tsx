"use client";

import React, { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { X, Sparkles } from "lucide-react";
import {
  subscribeGlobalContactSettings,
  DEFAULT_GLOBAL_SETTINGS,
  GlobalSettingsConfig,
} from "@/lib/firebase";

export default function WhatsAppWidget() {
  const [contact, setContact] = useState<GlobalSettingsConfig>(DEFAULT_GLOBAL_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const unsub = subscribeGlobalContactSettings((data) => {
      if (data) setContact(data);
    });
    return () => unsub();
  }, []);

  const phoneNum = contact.whatsappNumber || "918884484828";
  const message = encodeURIComponent(
    "Hello Visriva Live Station! I am interested in your luxury photo booth and live gifting services for an upcoming event."
  );
  const whatsappUrl = `https://wa.me/${phoneNum}?text=${message}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* Expanded Quick-Chat Card */}
      {isOpen && (
        <div className="mb-3 w-72 sm:w-80 rounded-2xl bg-[#011F15]/95 backdrop-blur-xl border border-[#D4AF37]/40 shadow-2xl p-4 text-white animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg">
                <FaWhatsapp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white tracking-wide">Visriva Support</h4>
                <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Online • Typically replies instantly
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors p-1"
              aria-label="Close Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-emerald-100/90 leading-relaxed mb-4 bg-white/5 rounded-xl p-3 border border-white/5">
            👋 Hi there! Looking for live photo booths, custom fridge magnets, or live event activations in Pune/Bengaluru?
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#25D366]/20"
          >
            <FaWhatsapp className="w-4 h-4" />
            <span>Start WhatsApp Chat</span>
          </a>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="relative group">
        {/* Tooltip badge on initial load */}
        {showTooltip && !isOpen && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-[#011F15]/90 border border-[#D4AF37]/40 text-emerald-100 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap backdrop-blur-md hidden sm:flex items-center space-x-1.5 pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Chat on WhatsApp</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="ml-1 text-white/50 hover:text-white pointer-events-auto"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowTooltip(false);
          }}
          aria-label="Contact on WhatsApp"
          className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center shadow-[0_0_25px_rgba(37,211,102,0.5)] border-2 border-white/20 hover:scale-110 active:scale-95 transition-all duration-300 group"
        >
          <FaWhatsapp className="w-7 h-7 drop-shadow-md" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4AF37] border-2 border-[#011F15] flex items-center justify-center text-[9px] font-bold text-black animate-pulse" />
        </button>
      </div>
    </div>
  );
}
