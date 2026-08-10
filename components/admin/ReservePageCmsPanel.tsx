"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Calendar,
  ExternalLink,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import {
  subscribeReservePageConfig,
  saveReservePageConfig,
  type ReservePageConfig,
} from "@/lib/firebase";
import { DEFAULT_RESERVE_PAGE_CONFIG } from "@/lib/reservePage";
import type { AdminCategory, AdminTab } from "@/lib/adminNav";

interface Props {
  onToast?: (msg: string, isErr?: boolean) => void;
  onNavigate?: (category: AdminCategory, tab?: AdminTab) => void;
}

export default function ReservePageCmsPanel({ onToast, onNavigate }: Props) {
  const [config, setConfig] = useState<ReservePageConfig>(DEFAULT_RESERVE_PAGE_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => subscribeReservePageConfig(setConfig), []);

  const updateUsp = (index: number, field: "icon" | "title" | "desc", value: string) => {
    setConfig((prev) => {
      const uspItems = [...prev.uspItems];
      uspItems[index] = { ...uspItems[index], [field]: value };
      return { ...prev, uspItems };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveReservePageConfig(config);
    setIsSaving(false);
    if (res.success) {
      onToast?.("Reserve page saved — live at /reserve");
    } else {
      onToast?.(res.error || "Failed to save reserve page", true);
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">Reserve Page CMS</h2>
            <p className="text-xs text-emerald-100/70 max-w-xl">
              Edit the hero, USP strip, and booking intro on{" "}
              <a href="/reserve" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] underline">
                /reserve
              </a>
              . Pricing, dates &amp; the quote form are controlled in the tabs below or Operations Hub.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setConfig(DEFAULT_RESERVE_PAGE_CONFIG)}
              className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving…" : "Save reserve page"}
            </button>
          </div>
        </div>
      </div>

      {/* Related controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onNavigate?.("reserve", "pricingServices")}
          className="glass-card rounded-2xl p-4 border border-white/10 hover:border-[#D4AF37]/30 transition group text-left"
        >
          <ArrowRight className="w-5 h-5 text-[#D4AF37]" />
          <p className="font-bold text-sm text-white mt-3">Pricing &amp; packages</p>
          <p className="text-[11px] text-white/50 mt-1">Quote calculator rates</p>
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.("reserve", "featureToggles")}
          className="glass-card rounded-2xl p-4 border border-white/10 hover:border-[#D4AF37]/30 transition group text-left"
        >
          <ArrowRight className="w-5 h-5 text-[#D4AF37]" />
          <p className="font-bold text-sm text-white mt-3">Service visibility</p>
          <p className="text-[11px] text-white/50 mt-1">Which stations show on /reserve</p>
        </button>
        <a
          href="/admin/operations"
          className="glass-card rounded-2xl p-4 border border-white/10 hover:border-emerald-400/30 transition group"
        >
          <div className="flex items-center justify-between">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-emerald-300" />
          </div>
          <p className="font-bold text-sm text-white mt-3">Blocked dates</p>
          <p className="text-[11px] text-white/50 mt-1">Calendar in Operations Hub</p>
        </a>
      </div>

      <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hero section</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">Top badge</span>
            <input
              type="text"
              value={config.heroBadge}
              onChange={(e) => setConfig((p) => ({ ...p, heroBadge: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-[#D4AF37]/50 outline-none"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">Title (before highlight)</span>
            <input
              type="text"
              value={config.heroTitle}
              onChange={(e) => setConfig((p) => ({ ...p, heroTitle: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-[#D4AF37]/50 outline-none"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">Title highlight (gold)</span>
            <input
              type="text"
              value={config.heroTitleHighlight}
              onChange={(e) => setConfig((p) => ({ ...p, heroTitleHighlight: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-[#D4AF37]/50 outline-none"
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">Subtitle</span>
            <textarea
              rows={2}
              value={config.heroSubtitle}
              onChange={(e) => setConfig((p) => ({ ...p, heroSubtitle: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-[#D4AF37]/50 outline-none resize-y"
            />
          </label>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">USP strip (4 boxes)</h3>
          <button
            type="button"
            onClick={() =>
              setConfig((p) => ({
                ...p,
                uspItems: [...p.uspItems, { icon: "✨", title: "New perk", desc: "Description" }],
              }))
            }
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/8 border border-white/15"
          >
            <Plus className="w-3.5 h-3.5" />
            Add box
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {config.uspItems.map((usp, i) => (
            <div key={i} className="rounded-2xl border border-white/10 p-4 space-y-2 bg-black/20">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-[#D4AF37]/80">Box {i + 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((p) => ({
                      ...p,
                      uspItems: p.uspItems.filter((_, idx) => idx !== i),
                    }))
                  }
                  className="p-1.5 rounded text-rose-300/80 hover:bg-rose-500/10"
                  aria-label="Remove USP"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={usp.icon}
                onChange={(e) => updateUsp(i, "icon", e.target.value)}
                placeholder="Emoji icon"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white outline-none"
              />
              <input
                type="text"
                value={usp.title}
                onChange={(e) => updateUsp(i, "title", e.target.value)}
                placeholder="Title"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white outline-none"
              />
              <input
                type="text"
                value={usp.desc}
                onChange={(e) => updateUsp(i, "desc", e.target.value)}
                placeholder="Short description"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-sm text-white outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
