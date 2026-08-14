"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaInstagram } from "react-icons/fa";
import { X, ExternalLink, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onUnlock: () => void;
  instagramUrl: string;
  instagramUsername: string;
}

export default function InstagramGateModal({
  open,
  onClose,
  onUnlock,
  instagramUrl,
  instagramUsername,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);

  const handleUnlock = () => {
    if (!confirmed) return;
    onUnlock();
    onClose();
    setConfirmed(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border-2 border-[#D4AF37]/40 bg-[#041a12] p-6 sm:p-8 shadow-2xl space-y-5"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/20"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-lg">
                <FaInstagram className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Follow us on Instagram
              </h3>
              <p className="text-xs text-emerald-100/75 leading-relaxed">
                To download your captured moments, please follow{" "}
                <span className="text-[#D4AF37] font-bold">@{instagramUsername}</span> on Instagram.
                It helps us share more live event magic with you.
              </p>
            </div>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white font-bold text-sm hover:scale-[1.02] transition-transform"
            >
              <FaInstagram className="w-5 h-5" />
              <span>Open @{instagramUsername}</span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </a>

            <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#D4AF37] cursor-pointer"
              />
              <span className="text-xs text-emerald-100/80 leading-relaxed">
                I have followed <strong className="text-white">@{instagramUsername}</strong> on Instagram
              </span>
            </label>

            <button
              type="button"
              disabled={!confirmed}
              onClick={handleUnlock}
              className="w-full py-3.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Unlock downloads
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
