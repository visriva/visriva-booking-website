"use client";

import React from "react";
import { ArrowUpRight, ExternalLink, Map } from "lucide-react";
import { ADMIN_HUB_LINKS, ADMIN_SITE_PAGES, type AdminCategory, type AdminTab } from "@/lib/adminNav";

interface Props {
  onNavigate: (category: AdminCategory, tab?: AdminTab) => void;
}

export default function AdminSiteMap({ onNavigate }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Map className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">
            Every page — where to edit
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ADMIN_SITE_PAGES.map((page) => (
            <div
              key={page.path}
              className="rounded-xl border border-white/10 bg-black/25 p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm text-white">{page.label}</p>
                  <p className="text-[11px] font-mono text-[#D4AF37]/80 mt-0.5">{page.path}</p>
                  {page.note && (
                    <p className="text-[10px] text-white/40 mt-1">{page.note}</p>
                  )}
                </div>
                <a
                  href={page.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white shrink-0"
                  aria-label={`View ${page.label}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(page.category, page.tab)}
                className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/25 transition"
              >
                Open editor
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/45 mb-3">
          Separate admin apps
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ADMIN_HUB_LINKS.map((hub) => {
            const Icon = hub.icon;
            return (
              <a
                key={hub.href}
                href={hub.href}
                className={`rounded-xl border p-4 flex items-start gap-3 transition hover:scale-[1.01] ${
                  hub.accent === "emerald"
                    ? "border-emerald-400/25 bg-emerald-500/10 hover:bg-emerald-500/15"
                    : "border-[#D4AF37]/25 bg-[#D4AF37]/8 hover:bg-[#D4AF37]/12"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    hub.accent === "emerald" ? "text-emerald-300" : "text-[#D4AF37]"
                  }`}
                />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-white">{hub.label}</p>
                  <p className="text-[11px] text-white/50 mt-0.5">{hub.description}</p>
                  <p className="text-[10px] font-mono text-white/35 mt-1">{hub.href}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-white/30 shrink-0 ml-auto" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
