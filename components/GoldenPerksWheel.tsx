"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Gift, Trophy, ArrowRight, X, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import canvasConfetti from "canvas-confetti";
import {
  subscribeGoldenWheelConfig,
  GoldenWheelConfig,
  DEFAULT_GOLDEN_WHEEL_CONFIG,
  WheelPerk,
} from "@/lib/firebase";

export default function GoldenPerksWheel() {
  const [config, setConfig] = useState<GoldenWheelConfig>(DEFAULT_GOLDEN_WHEEL_CONFIG);
  const [isOpen, setIsOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningPerk, setWinningPerk] = useState<WheelPerk | null>(null);
  const [hasAlreadySpun, setHasAlreadySpun] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = subscribeGoldenWheelConfig((data) => {
      if (data) setConfig(data);
    });

    // Check device lockout in localStorage
    if (typeof window !== "undefined") {
      const savedPerk = localStorage.getItem("visriva_wheel_claimed_perk");
      if (savedPerk) {
        try {
          const parsed = JSON.parse(savedPerk);
          setWinningPerk(parsed);
          setHasAlreadySpun(true);
        } catch (e) {}
      }
    }

    return () => unsub();
  }, []);

  if (!config.enabled) return null;

  const perks = config.perks && config.perks.length > 0 ? config.perks : DEFAULT_GOLDEN_WHEEL_CONFIG.perks;
  const numPerks = perks.length;
  const sliceAngle = 360 / numPerks;

  const handleSpin = () => {
    if (spinning || hasAlreadySpun) return;
    setSpinning(true);
    setWinningPerk(null);

    // Pick random target slice (0 to numPerks-1)
    const randomIndex = Math.floor(Math.random() * numPerks);
    const targetPerk = perks[randomIndex];

    // Extra full spins (5 to 8 full spins)
    const extraSpins = (5 + Math.floor(Math.random() * 4)) * 360;

    // Angle offset to land in middle of target slice
    const sliceCenterAngle = randomIndex * sliceAngle + sliceAngle / 2;
    const finalAngle = rotation + extraSpins + (360 - sliceCenterAngle);

    setRotation(finalAngle);

    setTimeout(() => {
      setSpinning(false);
      setWinningPerk(targetPerk);
      setHasAlreadySpun(true);

      // Lock this device permanently in localStorage & notify Booking Engine
      if (typeof window !== "undefined") {
        localStorage.setItem("visriva_wheel_claimed_perk", JSON.stringify(targetPerk));
        window.dispatchEvent(new CustomEvent("visriva_perk_applied", { detail: targetPerk }));
      }

      // Fire gold confetti burst
      try {
        canvasConfetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#D4AF37", "#FFD700", "#10B981", "#FFFFFF"],
        });
      } catch (e) {}
    }, 4000);
  };

  const handleCopyCode = () => {
    if (!winningPerk) return;
    navigator.clipboard.writeText(winningPerk.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClaimBooking = () => {
    setIsOpen(false);
    if (winningPerk && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("visriva_perk_applied", { detail: winningPerk }));
    }
    const el = document.getElementById("booking-engine");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(212,175,55,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center space-x-2 border-2 border-amber-300 cursor-pointer animate-bounce"
      >
        <Gift className="w-5 h-5 text-[#011F15] animate-spin-slow" />
        <span>🎰 Spin Golden Wheel</span>
      </button>

      {/* FULLSCREEN GLASSMODAL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[#041a12] border-2 border-[#D4AF37]/60 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center relative shadow-[0_0_50px_rgba(212,175,55,0.4)] my-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Title & Subtitle */}
              <div className="space-y-1 mb-6">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>EXCLUSIVE EVENT REWARDS</span>
                </div>
                <h3 className="font-serif text-2xl font-extrabold text-white tracking-tight">
                  Spin the Golden Wheel of Perks
                </h3>
                <p className="text-xs text-emerald-100/70 font-sans">
                  Spin to unlock instant complimentary upgrades and discounts for your upcoming event!
                </p>
              </div>

              {/* WHEEL CONTAINER */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto my-4 flex items-center justify-center">
                
                {/* Pointer / Ticker at Top */}
                <div className="absolute -top-3 z-30 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-[#D4AF37] filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" />

                {/* Rotating Wheel Graphic */}
                <div
                  className="w-full h-full rounded-full border-4 border-[#D4AF37] relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-transform duration-[4000ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {perks.map((perk, index) => {
                      const startAngle = index * sliceAngle;
                      const endAngle = (index + 1) * sliceAngle;

                      // Convert polar to cartesian
                      const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                      const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                      const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                      const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                      const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                      return (
                        <g key={perk.id}>
                          <path
                            d={pathData}
                            fill={index % 2 === 0 ? "#082e20" : "#02120b"}
                            stroke="#D4AF37"
                            strokeWidth="0.8"
                          />
                          {/* Text along slice */}
                          <text
                            x="50"
                            y="18"
                            fill="#D4AF37"
                            fontSize="3.8"
                            fontWeight="bold"
                            textAnchor="middle"
                            transform={`rotate(${startAngle + sliceAngle / 2}, 50, 50)`}
                            className="font-serif tracking-wider uppercase"
                          >
                            {perk.title.split(" ")[1] || perk.title}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Center Spinning Hub Button */}
                <button
                  type="button"
                  disabled={spinning || hasAlreadySpun}
                  onClick={handleSpin}
                  className="absolute z-20 w-16 h-16 rounded-full bg-gold-gradient text-[#011F15] border-2 border-white font-extrabold text-xs uppercase shadow-[0_0_20px_rgba(212,175,55,0.8)] hover:scale-105 active:scale-95 transition disabled:opacity-80 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                >
                  {spinning ? (
                    <span className="text-[10px] animate-pulse">SPINNING</span>
                  ) : hasAlreadySpun ? (
                    <span className="text-[10px] font-mono">CLAIMED ✅</span>
                  ) : (
                    <span>SPIN!</span>
                  )}
                </button>
              </div>

              {/* ACTION OR WINNER CARD */}
              <div className="mt-6">
                {winningPerk ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-4 rounded-2xl bg-[#D4AF37]/15 border-2 border-[#D4AF37] space-y-3 shadow-gold-sm"
                  >
                    <div className="flex items-center justify-center space-x-2 text-[#D4AF37] font-bold text-sm">
                      <Trophy className="w-5 h-5 text-[#D4AF37]" />
                      <span>CONGRATULATIONS! YOU WON:</span>
                    </div>

                    <h4 className="font-serif text-lg font-extrabold text-white">
                      {winningPerk.title}
                    </h4>

                    <p className="text-xs text-emerald-100/80 font-sans">
                      {winningPerk.description}
                    </p>

                    {/* Claim Code Box */}
                    <div className="flex items-center justify-between bg-black/60 p-3 rounded-xl border border-white/20">
                      <div className="text-left">
                        <span className="text-[9px] uppercase font-mono text-emerald-200/60 block">Claim Voucher Code:</span>
                        <span className="font-mono font-extrabold text-xs text-[#D4AF37] tracking-wider">{winningPerk.code}</span>
                      </div>

                      <button
                        onClick={handleCopyCode}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>COPY</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Book Now Button */}
                    <button
                      onClick={handleClaimBooking}
                      className="w-full py-3 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-md hover:scale-[1.02] transition flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>APPLY PERK TO BOOKING</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <button
                    disabled={spinning}
                    onClick={handleSpin}
                    className="w-full py-3.5 rounded-2xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-md hover:scale-[1.02] transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-[#011F15]" />
                    <span>{spinning ? "SPINNING THE GOLDEN WHEEL..." : "SPIN THE GOLDEN WHEEL NOW"}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
