"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Plus, RefreshCw, Save, Star, Trash2 } from "lucide-react";
import {
  subscribeTestimonialsConfig,
  saveTestimonialsConfig,
  type TestimonialsConfig,
} from "@/lib/firebase";
import { DEFAULT_TESTIMONIALS_CONFIG } from "@/lib/testimonials";
import type { Testimonial } from "@/lib/testimonials";

interface Props {
  onToast?: (msg: string, isErr?: boolean) => void;
}

const emptyItem = (): Testimonial => ({ quote: "", author: "", event: "" });

export default function TestimonialsCmsPanel({ onToast }: Props) {
  const [config, setConfig] = useState<TestimonialsConfig>(DEFAULT_TESTIMONIALS_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => subscribeTestimonialsConfig(setConfig), []);

  const updateItem = (index: number, patch: Partial<Testimonial>) => {
    setConfig((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setConfig((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeItem = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const cleaned: TestimonialsConfig = {
      ...config,
      items: config.items.filter((t) => t.quote.trim() || t.author.trim()),
    };
    const res = await saveTestimonialsConfig(cleaned);
    setIsSaving(false);
    if (res.success) {
      setConfig(cleaned);
      onToast?.("Client feedback section saved — live on website!");
    } else {
      onToast?.(res.error || "Failed to save testimonials", true);
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gold-gradient text-[#011F15] flex items-center justify-center font-bold">
                <Star className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                Client Feedback &amp; Testimonials
              </h2>
            </div>
            <p className="text-xs text-emerald-100/70 max-w-xl">
              Edit homepage client quotes, toggle the section on or off, and sync to Firestore in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setConfig(DEFAULT_TESTIMONIALS_CONFIG)}
              className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              Reset defaults
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving…" : "Save feedback"}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {config.enabled ? (
            <Eye className="w-5 h-5 text-emerald-400" />
          ) : (
            <EyeOff className="w-5 h-5 text-white/40" />
          )}
          <div>
            <h4 className="text-sm font-bold text-white">Show on homepage</h4>
            <p className="text-[11px] text-emerald-100/60">
              When off, the &ldquo;Client Love&rdquo; section is hidden from the main site.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={config.enabled}
          onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
          className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${
            config.enabled ? "bg-emerald-500" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
              config.enabled ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Section headings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">Badge</span>
            <input
              type="text"
              value={config.badgeText}
              onChange={(e) => setConfig((prev) => ({ ...prev, badgeText: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-[#D4AF37]/50 outline-none"
            />
          </label>
          <label className="space-y-1.5 md:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">Title</span>
            <input
              type="text"
              value={config.title}
              onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-[#D4AF37]/50 outline-none"
            />
          </label>
          <label className="space-y-1.5 md:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">Subtitle</span>
            <input
              type="text"
              value={config.subtitle}
              onChange={(e) => setConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-[#D4AF37]/50 outline-none"
            />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Testimonials ({config.items.length})
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/8 border border-white/15 hover:bg-white/12 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add quote
          </button>
        </div>

        {config.items.map((item, index) => (
          <div
            key={index}
            className="glass-card rounded-2xl p-5 border border-white/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#D4AF37]/80 uppercase">Quote #{index + 1}</span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-2 rounded-lg text-rose-300/80 hover:bg-rose-500/10 transition"
                aria-label="Remove testimonial"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={item.quote}
              onChange={(e) => updateItem(index, { quote: e.target.value })}
              rows={3}
              placeholder="Client quote…"
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-[#D4AF37]/50 outline-none resize-y"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={item.author}
                onChange={(e) => updateItem(index, { author: e.target.value })}
                placeholder="Author / couple name"
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-[#D4AF37]/50 outline-none"
              />
              <input
                type="text"
                value={item.event}
                onChange={(e) => updateItem(index, { event: e.target.value })}
                placeholder="Event type & city"
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-[#D4AF37]/50 outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-4 border border-emerald-500/25 bg-emerald-950/20 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-emerald-100/70 leading-relaxed">
          Preview at{" "}
          <a href="/" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] underline">
            visriva.com
          </a>
          . Empty quotes are removed automatically when you save.
        </p>
      </div>
    </div>
  );
}
