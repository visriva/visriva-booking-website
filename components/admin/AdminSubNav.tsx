"use client";

import React from "react";
import type { AdminTab } from "@/lib/adminNav";

interface Props {
  items: { id: AdminTab; label: string }[];
  activeTab: AdminTab;
  onChange: (tab: AdminTab) => void;
}

export default function AdminSubNav({ items, activeTab, onChange }: Props) {
  return (
    <div className="sticky top-[73px] z-20 -mx-1 px-1 pb-1 bg-[#011F15]/90 backdrop-blur-xl border-b border-white/10">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-3">
        {items.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                active
                  ? "bg-[#D4AF37] text-[#011F15] shadow-gold-sm"
                  : "bg-white/5 text-white/65 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
