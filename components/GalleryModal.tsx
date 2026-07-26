"use client";

import React, { useState, useEffect } from "react";
import { X, Image as ImageIcon, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeGalleries, GalleryItem } from "@/lib/firebase";

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  category: "photo-booth" | "magnet-station" | "keychain-station" | "mug-printing";
}

export default function GalleryModal({
  isOpen,
  onClose,
  serviceName,
  category,
}: GalleryModalProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const unsub = subscribeGalleries((fetchedItems) => {
      setItems(fetchedItems);
    });
    return () => unsub();
  }, []);

  // Filter items matching current category
  const filtered = items.filter((item) => {
    if (category === "photo-booth") return item.category === "photo-booth" || item.category === ("photoBooth" as any);
    if (category === "magnet-station") return item.category === "magnet-station" || item.category === ("magnets" as any);
    if (category === "keychain-station") return item.category === "keychain-station" || item.category === ("keychains" as any);
    if (category === "mug-printing") return item.category === "mug-printing" || item.category === ("mugs" as any);
    return true;
  });

  const nextSlide = () => {
    if (filtered.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filtered.length);
  };

  const prevSlide = () => {
    if (filtered.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
  };

  if (!isOpen) return null;

  const currentItem = filtered[currentIndex] || filtered[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9999] flex flex-col justify-between p-4 sm:p-8 bg-[#011F15]/95 backdrop-blur-3xl overflow-hidden"
      >
        {/* TOP BAR */}
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto z-20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                {serviceName} Experience Gallery
              </h2>
              <p className="text-xs text-emerald-100/70">
                {filtered.length > 0 ? `Slide ${currentIndex + 1} of ${filtered.length}` : "Curated Luxury Portfolio"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/20 focus:outline-none cursor-pointer"
            aria-label="Close Gallery"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* MAIN SLIDER STAGE */}
        <div className="relative flex-1 flex items-center justify-center my-4 w-full max-w-5xl mx-auto">
          {filtered.length === 0 ? (
            <div className="py-20 text-center space-y-4 glass-card p-10 rounded-3xl border border-white/10">
              <Sparkles className="w-12 h-12 text-[#D4AF37] mx-auto animate-pulse" />
              <h3 className="font-serif text-2xl text-white font-bold">Curating Event Memories...</h3>
              <p className="text-emerald-100/70 text-sm max-w-md mx-auto">
                No active gallery items found for {serviceName}. You can upload new event photography in the Admin Dashboard!
              </p>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center space-y-6">
              
              {/* Central Display Image */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItem.id || currentIndex}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  className="relative w-full max-h-[60vh] sm:max-h-[68vh] aspect-[16/10] rounded-3xl overflow-hidden glass-card border-2 border-[#D4AF37]/50 shadow-2xl flex items-center justify-center bg-black/60"
                >
                  <img
                    src={currentItem.url}
                    alt={currentItem.tagline || serviceName}
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Tagline Animated Container */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItem.id + "-tagline"}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="text-center px-4 max-w-2xl space-y-1"
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30 inline-block">
                    {serviceName}
                  </span>
                  <h3 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight drop-shadow-md">
                    {currentItem.tagline || "Exclusive VIP Setup"}
                  </h3>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {filtered.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-[#D4AF37] hover:text-[#011F15] border border-white/20 text-white flex items-center justify-center transition-all shadow-2xl backdrop-blur-md cursor-pointer z-30"
                    aria-label="Previous Image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={nextSlide}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-[#D4AF37] hover:text-[#011F15] border border-white/20 text-white flex items-center justify-center transition-all shadow-2xl backdrop-blur-md cursor-pointer z-30"
                    aria-label="Next Image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM DOT NAVIGATOR */}
        <div className="flex items-center justify-center space-x-2 py-2 z-20">
          {filtered.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-8 bg-[#D4AF37]" : "w-2.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
