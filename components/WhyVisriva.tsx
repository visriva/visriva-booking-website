"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  subscribeWebsiteText,
  DEFAULT_WEBSITE_TEXT,
  WebsiteTextConfig,
} from "@/lib/firebase";

export default function WhyVisriva() {
  const [webText, setWebText] = useState<WebsiteTextConfig>(DEFAULT_WEBSITE_TEXT);

  useEffect(() => {
    const unsub = subscribeWebsiteText((data) => {
      if (data) setWebText(data);
    });
    return () => unsub();
  }, []);

  const bullets = webText.whyChooseBullets && webText.whyChooseBullets.length > 0
    ? webText.whyChooseBullets
    : DEFAULT_WEBSITE_TEXT.whyChooseBullets || [];

  const highlights = webText.whyChooseHighlights && webText.whyChooseHighlights.length > 0
    ? webText.whyChooseHighlights
    : DEFAULT_WEBSITE_TEXT.whyChooseHighlights || [];

  return (
    <section className="py-20 bg-transparent relative overflow-hidden">
      <motion.div
        className="max-w-7xl mx-auto px-4 md:px-8 break-words grid md:grid-cols-2 gap-8 items-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
        viewport={{ once: true }}
      >
        <div className="space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/40 border border-gold-500/30 text-gold-400 text-xs font-bogale uppercase tracking-widest backdrop-blur-md">
            <span>{webText.whyChooseBadge || "The Visriva Standard"}</span>
          </div>
          <h2 className="font-catilya text-4xl md:text-6xl font-bold tracking-tight text-white">
            {webText.whyChooseTitle || "Why Choose Visriva?"}
          </h2>
          <p className="font-conya text-lg text-emerald-200/80 font-light leading-relaxed">
            {webText.whyChooseDescription || "We blend cutting-edge photography tech with luxurious event design to create unforgettable, on-site experiences. Our studio-grade photo booth setup, instant printing, and premium branding ensure every guest walks away with a museum-quality memory."}
          </p>
          <ul className="space-y-3 text-emerald-200/90 text-sm font-graven">
            {bullets.map((bulletText, idx) => (
              <li key={idx} className="flex items-center space-x-3">
                <span className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0" />
                <span>{bulletText}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card glass-card-hover rounded-3xl p-8 space-y-6 border border-gold-500/30">
          <h3 className="font-aylia text-2xl font-bold text-white">
            Luxury Live Station Highlights
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {highlights.map((h, idx) => (
              <div key={idx} className="bg-black/40 border border-gold-500/20 rounded-xl p-4 text-center">
                <div className="font-cavona text-2xl font-bold text-gold-400">{h.val}</div>
                <div className="font-bogale text-xs text-emerald-200/80">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
