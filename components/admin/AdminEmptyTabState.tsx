"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { ADMIN_SUBNAV, type AdminCategory, type AdminTab } from "@/lib/adminNav";

interface Props {
  category: Exclude<AdminCategory, "dashboard">;
  onSelect: (tab: AdminTab) => void;
}

export default function AdminEmptyTabState({ category, onSelect }: Props) {
  const tabs = ADMIN_SUBNAV[category];

  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-8 text-center space-y-4 relative z-10">
      <AlertCircle className="w-10 h-10 text-amber-300 mx-auto" />
      <h3 className="font-serif text-xl font-bold text-white">Choose a settings tab</h3>
      <p className="text-sm text-white/55 max-w-md mx-auto">
        Pick a section below to load its editor. If a page looked blank, this usually means the tab
        didn&apos;t match — select one to continue.
      </p>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D4AF37] text-[#011F15] hover:scale-105 transition"
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
