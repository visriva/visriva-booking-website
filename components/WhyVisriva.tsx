"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function WhyVisriva() {
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
            <span>The Visriva Standard</span>
          </div>
          <h2 className="font-catilya text-4xl md:text-6xl font-bold tracking-tight text-white">
            Why Choose <span className="text-gold-gradient">Visriva</span>?
          </h2>
          <p className="font-conya text-lg text-emerald-200/80 font-light leading-relaxed">
            We blend cutting‑edge photography tech with luxurious event design to create
            unforgettable, on‑site experiences. Our studio‑grade photo booth setup, instant printing,
            and premium branding ensure every guest walks away with a museum‑quality memory.
          </p>
          <ul className="space-y-3 text-emerald-200/90 text-sm font-graven">
            <li className="flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-gold-500" />
              <span>8‑second ultra‑fast prints on high-gloss dye-sublimation paper</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-gold-500" />
              <span>Bespoke event overlays, custom frames &amp; corporate branding</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-gold-500" />
              <span>Full studio camera rig &amp; professional lighting setup</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-gold-500" />
              <span>Dedicated white-glove on‑site technical team</span>
            </li>
          </ul>
        </div>
        <div className="glass-card glass-card-hover rounded-3xl p-8 space-y-6 border border-gold-500/30">
          <h3 className="font-aylia text-2xl font-bold text-white">
            Luxury Live Station Highlights
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/40 border border-gold-500/20 rounded-xl p-4 text-center">
              <div className="font-cavona text-2xl font-bold text-gold-400">8 Sec</div>
              <div className="font-bogale text-xs text-emerald-200/80">Print Speed</div>
            </div>
            <div className="bg-black/40 border border-gold-500/20 rounded-xl p-4 text-center">
              <div className="font-cavona text-2xl font-bold text-gold-400">4K</div>
              <div className="font-bogale text-xs text-emerald-200/80">Studio Optics</div>
            </div>
            <div className="bg-black/40 border border-gold-500/20 rounded-xl p-4 text-center">
              <div className="font-cavona text-2xl font-bold text-gold-400">Custom</div>
              <div className="font-bogale text-xs text-emerald-200/80">Branding Overlays</div>
            </div>
            <div className="bg-black/40 border border-gold-500/20 rounded-xl p-4 text-center">
              <div className="font-cavona text-2xl font-bold text-gold-400">100%</div>
              <div className="font-bogale text-xs text-emerald-200/80">On-Site Support</div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
