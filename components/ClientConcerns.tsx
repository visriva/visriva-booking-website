"use client";
import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Users, Palette, ShieldCheck, Wallet, HelpCircle, Plug, Clock, Timer } from "lucide-react";
import {
  subscribeWebsiteText,
  DEFAULT_WEBSITE_TEXT,
  WebsiteTextConfig,
} from "@/lib/firebase";

/**
 * Objection handling for the last stretch before the booking engine. Every
 * answer here restates a commitment the business has already made elsewhere
 * (SharedTerms, ContractDocument, the capacity bands in BookingEngine) so the
 * pre-sale promise and the signed contract cannot drift apart.
 */

const CONCERN_ICONS: Record<string, React.ElementType> = {
  users: Users,
  palette: Palette,
  shield: ShieldCheck,
  wallet: Wallet,
};

const CHECKLIST_ICONS: React.ElementType[] = [Plug, Clock, Timer];

export default function ClientConcerns() {
  const [webText, setWebText] = useState<WebsiteTextConfig>(DEFAULT_WEBSITE_TEXT);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const unsub = subscribeWebsiteText((data) => {
      if (data) setWebText(data);
    });
    return () => unsub();
  }, []);

  const concerns =
    webText.concerns && webText.concerns.length > 0
      ? webText.concerns
      : DEFAULT_WEBSITE_TEXT.concerns || [];

  const checklist =
    webText.venueChecklist && webText.venueChecklist.length > 0
      ? webText.venueChecklist
      : DEFAULT_WEBSITE_TEXT.venueChecklist || [];

  return (
    <section id="before-you-book" className="py-20 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 break-words">
        <motion.div
          className="max-w-3xl space-y-5"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/40 border border-gold-500/30 text-gold-400 text-xs font-bogale uppercase tracking-widest backdrop-blur-md">
            <span>{webText.concernsBadge || DEFAULT_WEBSITE_TEXT.concernsBadge}</span>
          </div>
          <h2 className="font-catilya text-4xl md:text-6xl font-bold tracking-tight text-white">
            {webText.concernsTitle || DEFAULT_WEBSITE_TEXT.concernsTitle}
          </h2>
          <p className="font-conya text-lg text-emerald-200/80 font-light leading-relaxed">
            {webText.concernsDescription || DEFAULT_WEBSITE_TEXT.concernsDescription}
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
          {concerns.map((concern, idx) => {
            const Icon = CONCERN_ICONS[concern.icon || ""] || HelpCircle;
            return (
              <motion.div
                key={concern.question}
                className="glass-card glass-card-hover rounded-3xl p-7 border border-gold-500/20 flex items-start space-x-4"
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, delay: reduceMotion ? 0 : idx * 0.08 },
                }}
                viewport={{ once: true }}
              >
                <div className="w-11 h-11 rounded-2xl bg-black/50 border border-gold-500/30 flex items-center justify-center shrink-0 shadow-gold-sm">
                  <Icon className="w-5 h-5 text-gold-500" />
                </div>
                <div className="space-y-2.5 min-w-0">
                  <h3 className="font-aylia text-xl sm:text-2xl font-bold text-white leading-snug">
                    {concern.question}
                  </h3>
                  <p className="font-graven text-sm text-emerald-200/85 leading-relaxed">
                    {concern.answer}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {checklist.length > 0 && (
          <motion.div
            className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6 sm:p-7"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            viewport={{ once: true }}
          >
            <h3 className="font-bogale text-xs uppercase tracking-widest text-gold-400 mb-5">
              What we need from your venue
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {checklist.map((item, idx) => {
                const Icon = CHECKLIST_ICONS[idx % CHECKLIST_ICONS.length];
                return (
                  <div key={item.label} className="flex items-start space-x-3">
                    <Icon className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-bogale text-[11px] uppercase tracking-wider text-white/60">
                        {item.label}
                      </div>
                      <div className="font-graven text-sm text-emerald-200/90 leading-snug mt-0.5">
                        {item.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
