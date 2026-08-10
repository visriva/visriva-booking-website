"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  ADMIN_NAV,
  ADMIN_HUB_LINKS,
  ADMIN_SUBNAV,
  getAdminBreadcrumb,
  type AdminCategory,
  type AdminTab,
} from "@/lib/adminNav";
import AdminSubNav from "@/components/admin/AdminSubNav";

interface Props {
  children: React.ReactNode;
  activeCategory: AdminCategory;
  activeTab: AdminTab;
  onNavigate: (category: AdminCategory, tab?: AdminTab) => void;
  onMasterSync: () => void;
  isMasterSyncing: boolean;
  onLogout?: () => void;
  successToast?: string;
  errorToast?: string;
}

export default function AdminShell({
  children,
  activeCategory,
  activeTab,
  onNavigate,
  onMasterSync,
  isMasterSyncing,
  onLogout,
  successToast,
  errorToast,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const breadcrumb = getAdminBreadcrumb(activeCategory, activeTab);

  const handleNav = (category: AdminCategory, tab?: AdminTab) => {
    onNavigate(category, tab);
    setMobileOpen(false);
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center shadow-gold-sm">
            <ShieldCheck className="w-5 h-5 text-[#011F15]" />
          </div>
          <div>
            <p className="font-serif font-bold text-white leading-tight">Visriva Admin</p>
            <p className="text-[10px] text-white/45 font-mono uppercase tracking-wider">CMS Control</p>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
          Navigation
        </p>
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const active = activeCategory === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id, item.defaultTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                active
                  ? "bg-[#D4AF37] text-[#011F15] font-bold shadow-gold-sm"
                  : "text-white/70 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
          Operations
        </p>
        {ADMIN_HUB_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.href}
              href={link.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                link.accent === "emerald"
                  ? "text-emerald-200 bg-emerald-500/10 border border-emerald-400/20 hover:bg-emerald-500/15"
                  : "text-[#D4AF37] bg-[#D4AF37]/8 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/12"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{link.label}</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
            </a>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10 space-y-3">
        <button
          type="button"
          onClick={onMasterSync}
          disabled={isMasterSyncing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 border border-emerald-400/25 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isMasterSyncing ? "animate-spin" : ""}`} />
          {isMasterSyncing ? "Syncing…" : "Master sync"}
        </button>
        <div className="flex items-center gap-2 text-[10px] text-emerald-300/90 px-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Firestore live</span>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-rose-300 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            End session
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#011F15] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#011F15]/95 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-[73px]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-mono uppercase tracking-wider">
                <LayoutDashboard className="w-3 h-3" />
                <span>{breadcrumb.section}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/70">{breadcrumb.page}</span>
              </div>
              <h1 className="font-serif text-lg sm:text-xl font-bold truncate">{breadcrumb.page}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/8 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Site
            </a>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0 border-r border-white/10 min-h-[calc(100vh-73px)] sticky top-[73px] self-start">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            />
            <aside className="absolute left-0 top-0 bottom-0 w-[min(300px,88vw)] bg-[#011F15] border-r border-white/10 shadow-2xl">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        {/* Main */}
        <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 pb-16">
          {activeCategory !== "dashboard" && (
            <AdminSubNav
              items={ADMIN_SUBNAV[activeCategory]}
              activeTab={activeTab}
              onChange={(tab) => onNavigate(activeCategory, tab)}
            />
          )}
          <div className={activeCategory !== "dashboard" ? "pt-6 relative z-10" : "relative z-10"}>{children}</div>
        </div>
      </div>

      {/* Toasts */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          {successToast}
        </div>
      )}
      {errorToast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-rose-600 text-white text-sm font-semibold shadow-2xl flex items-center gap-2">
          {errorToast}
        </div>
      )}
    </div>
  );
}
