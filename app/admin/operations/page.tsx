"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  IndianRupee,
  LayoutDashboard,
  ChevronRight,
  Settings,
  Briefcase,
  Sparkles,
} from "lucide-react";
import AdminGate from "@/components/admin/AdminGate";
import AvailabilityCalendar from "@/components/admin/AvailabilityCalendar";
import FinanceDashboard from "@/components/admin/FinanceDashboard";
import {
  subscribeBlockedDates,
  BlockedDatesConfig,
  DEFAULT_BLOCKED_DATES,
} from "@/lib/firebase";

type OpsTab = "calendar" | "finance";

export default function AdminOperationsPage() {
  const [tab, setTab] = useState<OpsTab>("calendar");
  const [blockedDates, setBlockedDates] = useState<BlockedDatesConfig>(DEFAULT_BLOCKED_DATES);
  const [toast, setToast] = useState("");
  const [errorToast, setErrorToast] = useState("");

  useEffect(() => {
    return subscribeBlockedDates((data) => {
      if (data) setBlockedDates(data);
    });
  }, []);

  const showToast = (msg: string, isError?: boolean) => {
    if (isError) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(""), 4000);
    } else {
      setToast(msg);
      setTimeout(() => setToast(""), 3500);
    }
  };

  return (
    <AdminGate>
      <div className="min-h-screen bg-[#011F15] text-white">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#011F15]/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-[#011F15]" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-bold leading-tight">Operations Hub</h1>
                <p className="text-[10px] text-emerald-100/50 font-mono uppercase tracking-wider">
                  Calendar · Finance · Live Sync
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-2 text-xs">
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                Main CMS
              </Link>
              <Link
                href="/admin/whatsapp"
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                WhatsApp
              </Link>
            </nav>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0 space-y-2">
            <button
              type="button"
              onClick={() => setTab("calendar")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                tab === "calendar"
                  ? "bg-[#D4AF37] text-[#011F15]"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Availability
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
            <button
              type="button"
              onClick={() => setTab("finance")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                tab === "finance"
                  ? "bg-[#D4AF37] text-[#011F15]"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <span className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                Finance & P&L
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <div className="glass-card rounded-xl p-4 border border-white/10 mt-6 space-y-2 text-[10px] text-white/50">
              <p className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Sparkles className="w-3 h-3" /> Live sync active
              </p>
              <p>Blocked dates update /reserve instantly for all customers.</p>
              <p className="flex items-center gap-1.5 pt-1">
                <Briefcase className="w-3 h-3" />
                {(blockedDates.fullyBookedDates || []).length} blocked ·{" "}
                {(blockedDates.highDemandDates || []).length} high demand
              </p>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {tab === "calendar" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="font-serif text-2xl font-bold">Availability Calendar</h2>
                  <p className="text-sm text-white/50 mt-1">
                    Block dates with a click or type a command. Customers see status on the booking form.
                  </p>
                </div>
                <AvailabilityCalendar
                  config={blockedDates}
                  onConfigChange={setBlockedDates}
                  onToast={showToast}
                />
              </div>
            )}

            {tab === "finance" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="font-serif text-2xl font-bold">Finance Tracker</h2>
                  <p className="text-sm text-white/50 mt-1">
                    Record income & expenses — monthly and annual P&L calculated automatically.
                  </p>
                </div>
                <FinanceDashboard onToast={showToast} />
              </div>
            )}
          </main>
        </div>

        {/* Toasts */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-emerald-500/90 text-white text-sm font-semibold shadow-xl">
            {toast}
          </div>
        )}
        {errorToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-rose-500/90 text-white text-sm font-semibold shadow-xl">
            {errorToast}
          </div>
        )}
      </div>
    </AdminGate>
  );
}
