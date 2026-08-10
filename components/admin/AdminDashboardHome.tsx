"use client";

import React from "react";
import {
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import type { AdminCategory } from "@/lib/adminNav";
import { ADMIN_NAV } from "@/lib/adminNav";
import AdminSiteMap from "@/components/admin/AdminSiteMap";
import type { AdminTab } from "@/lib/adminNav";

interface Props {
  onSelect: (category: Exclude<AdminCategory, "dashboard">) => void;
  onNavigate: (category: AdminCategory, tab?: AdminTab) => void;
}

export default function AdminDashboardHome({ onSelect, onNavigate }: Props) {
  const modules = ADMIN_NAV.filter((n) => n.id !== "dashboard");

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-emerald-500/5 p-6 sm:p-8">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#D4AF37]/80 mb-2">
          Visriva CMS
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
          Admin Control Center
        </h1>
        <p className="text-sm text-white/60 mt-3 max-w-2xl leading-relaxed">
          Every page on visriva.com is editable here. Use the site map below to jump straight to the
          right section, or pick a module from the sidebar.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <a
            href="/admin/operations"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-bold hover:bg-emerald-500/25 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            Operations Hub
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </a>
          <a
            href="/admin/whatsapp"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white/80 text-xs font-bold hover:bg-white/12 transition"
          >
            <Briefcase className="w-4 h-4" />
            WhatsApp CRM
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </a>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#D4AF37] border border-[#D4AF37]/35 text-xs font-bold hover:bg-[#D4AF37]/10 transition"
          >
            <ExternalLink className="w-4 h-4" />
            View live site
          </a>
        </div>
      </div>

      <AdminSiteMap onNavigate={onNavigate} />

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/45 mb-4">CMS Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id as Exclude<AdminCategory, "dashboard">)}
                className="group text-left rounded-2xl border border-white/10 bg-black/30 hover:bg-black/45 hover:border-[#D4AF37]/35 p-5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/5 group-hover:bg-[#D4AF37]/15 text-white group-hover:text-[#D4AF37] flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all mt-1" />
                </div>
                <h4 className="font-serif font-bold text-white mt-4 group-hover:text-[#D4AF37] transition-colors">
                  {item.label}
                </h4>
                <p className="text-xs text-white/50 mt-1.5 leading-relaxed">{item.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Firestore", value: "Connected", tone: "text-emerald-300" },
          { label: "Reserve page", value: "/reserve", tone: "text-[#D4AF37]" },
          { label: "Public site", value: "visriva.com", tone: "text-white/70" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <p className="text-[10px] uppercase tracking-wider text-white/40">{stat.label}</p>
            <p className={`text-sm font-semibold mt-1 ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
