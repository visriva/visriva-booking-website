"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lock, Sparkles, TrendingUp } from "lucide-react";

interface Props {
  amount: string;
  tier: string;
  lineItems: string[];
  isComboEligible: boolean;
  discountAmount: number;
  submitting: boolean;
  showSubmit?: boolean;
}

export default function BookingEstimatePanel({
  amount,
  tier,
  lineItems,
  isComboEligible,
  discountAmount,
  submitting,
  showSubmit = true,
}: Props) {
  return (
    <div className="rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#D4AF37]/10 via-[#011F15]/90 to-[#011F15] p-5 sm:p-6 shadow-[0_0_40px_rgba(212,175,55,0.12)] space-y-4">
      <div className="flex items-center gap-2 text-[#D4AF37] text-[10px] uppercase tracking-[0.2em] font-bold">
        <TrendingUp className="w-4 h-4" />
        <span>Live estimate</span>
      </div>

      {isComboEligible ? (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            10% multi-station combo applied
          </span>
          <span className="font-mono text-white bg-emerald-600/80 px-2 py-0.5 rounded text-[10px] shrink-0">
            −₹{discountAmount.toLocaleString("en-IN")}
          </span>
        </div>
      ) : (
        <p className="text-[11px] text-emerald-100/55 leading-relaxed border border-white/10 rounded-xl px-3 py-2.5 bg-black/30">
          Add one more station to unlock <strong className="text-[#D4AF37]">10% combo savings</strong>.
        </p>
      )}

      <div>
        <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Estimated investment</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={amount}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="font-serif text-3xl sm:text-4xl font-bold text-gold-gradient tracking-tight"
          >
            {amount}
          </motion.p>
        </AnimatePresence>
        <span className="inline-block mt-2 px-3 py-1 rounded-full bg-gold-gradient text-[#011F15] text-[10px] font-extrabold uppercase tracking-wider">
          {tier}
        </span>
      </div>

      {lineItems.length > 0 && (
        <div className="pt-3 border-t border-white/10 space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
          <p className="text-[10px] text-[#D4AF37] uppercase tracking-wider font-semibold mb-2">Breakdown</p>
          {lineItems.map((item, idx) => (
            <p
              key={idx}
              className={`text-[11px] font-mono leading-relaxed ${
                item.includes("10% OFF") ? "text-emerald-400 font-bold" : "text-emerald-100/75"
              }`}
            >
              {item}
            </p>
          ))}
        </div>
      )}

      {showSubmit && (
        <button
          type="submit"
          disabled={submitting}
          className="hidden xl:flex w-full py-4 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-sm shadow-gold-lg hover:scale-[1.02] active:scale-[0.98] transition-all items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? "Securing your date…" : (
            <>
              Reserve this date
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      <div className="flex items-center gap-2 text-[10px] text-emerald-200/50 font-mono pt-1">
        <Lock className="w-3 h-3 text-[#D4AF37] shrink-0" />
        <span>No payment now · Team confirms within hours</span>
      </div>
    </div>
  );
}
