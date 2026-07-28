"use client";

import React, { useState, useEffect } from "react";
import { Camera, Sparkles, Zap, Palette, Smile, UserCheck, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import {
  subscribeWebsiteText,
  DEFAULT_WEBSITE_TEXT,
  WebsiteTextConfig,
} from "@/lib/firebase";

const DEFAULT_ICONS = [Camera, Sparkles, Zap, Palette, Smile, UserCheck];

const DEFAULT_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80";

const getValidImageUrl = (url?: string) => {
  if (!url || typeof url !== "string") return DEFAULT_IMAGE_FALLBACK;
  if (url.startsWith("data:image/heic") || url.startsWith("data:image/heif")) {
    return DEFAULT_IMAGE_FALLBACK;
  }
  return url;
};

export default function WhatsIncluded() {
  const [webText, setWebText] = useState<WebsiteTextConfig>(DEFAULT_WEBSITE_TEXT);

  useEffect(() => {
    const unsub = subscribeWebsiteText((data) => {
      if (data) setWebText(data);
    });
    return () => unsub();
  }, []);

  const showcasePhotoUrl = getValidImageUrl(webText.whatsIncludedImageUrl);
  const items = webText.whatsIncludedItems && webText.whatsIncludedItems.length > 0
    ? webText.whatsIncludedItems
    : DEFAULT_WEBSITE_TEXT.whatsIncludedItems || [];

  return (
    <section className="py-20 relative bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 break-words">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* LEFT COLUMN: Text & Stacked Point List */}
          <div className="space-y-8 text-left">
            <div>
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-4 font-cinzel">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{webText.whatsIncludedBadge || "The Visriva Guarantee"}</span>
              </div>
              <h2 className="font-catilya text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.15]">
                {webText.whatsIncludedHeading || "What's Included in Every Standard Photo Booth Package:"}
              </h2>
            </div>

            <ul className="space-y-6">
              {items.map((itemText, idx) => {
                const IconComponent = DEFAULT_ICONS[idx % DEFAULT_ICONS.length] || CheckCircle2;
                return (
                  <li key={idx} className="flex items-start space-x-4 group">
                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] flex-shrink-0 group-hover:scale-110 group-hover:border-[#D4AF37] transition-all duration-300 shadow-gold-sm">
                      <IconComponent className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <p className="font-graven text-emerald-100/90 text-sm sm:text-base font-normal leading-relaxed pt-1">
                      {itemText}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* RIGHT COLUMN: Visual Showcase Frame */}
          <div className="relative flex items-center justify-center w-full">
            <div className="absolute -inset-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-emerald-950/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative glass-card rounded-3xl p-3 sm:p-4 border-2 border-[#D4AF37]/40 shadow-gold-lg max-w-lg w-full bg-white/5 overflow-hidden group">
              <div className="relative w-full h-[420px] sm:h-[500px] rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
                <Image
                  src={showcasePhotoUrl}
                  alt={webText.whatsIncludedTitle || "Visriva Luxury Photo Booth Setup"}
                  fill
                  className="object-contain object-top transition-transform duration-500 group-hover:scale-102"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  unoptimized={showcasePhotoUrl.startsWith("data:")}
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-5 pt-10">
                  <div className="text-[11px] font-cinzel uppercase tracking-widest text-[#D4AF37] mb-1 font-bold">
                    {webText.whatsIncludedBadge || DEFAULT_WEBSITE_TEXT.whatsIncludedBadge}
                  </div>
                  <h3 className="font-aylia text-xl sm:text-2xl font-bold text-white group-hover:text-[#D4AF37] transition-colors leading-snug">
                    {webText.whatsIncludedTitle || DEFAULT_WEBSITE_TEXT.whatsIncludedTitle}
                  </h3>
                  <p className="font-conya text-emerald-100/80 text-xs sm:text-sm mt-0.5">
                    {webText.whatsIncludedSubtitle || DEFAULT_WEBSITE_TEXT.whatsIncludedSubtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
