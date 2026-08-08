"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Printer,
  Wifi,
  Tablet,
  Laptop,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { checkPrintServerHealth } from "@/lib/printJobs";

const CHECKLIST_KEY = "visriva-event-setup-checklist";

const DEFAULT_ITEMS = [
  { id: "print-server", label: "USB print server running on laptop (port 3847)" },
  { id: "webprinter", label: "Web Printer open at /webprinter with Auto-Print ON" },
  { id: "test-print", label: "Run one test strip from /webbooth" },
  { id: "paper", label: "DNP printer loaded with paper & ribbon" },
  { id: "wifi", label: "iPad and laptop on the same Wi-Fi network" },
  { id: "operator", label: "Operator portal unlocked and WhatsApp bot connected" },
  { id: "gallery", label: "Event gallery code set in admin panel" },
  { id: "pin", label: "Crew PIN changed from default for this event" },
];

export default function EventSetupPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [printerOk, setPrinterOk] = useState<boolean | null>(null);
  const [printerName, setPrinterName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(CHECKLIST_KEY);
      if (saved) setChecked(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      return next;
    });
  };

  const refreshPrinter = useCallback(async () => {
    const health = await checkPrintServerHealth();
    setPrinterOk(health.ok);
    setPrinterName(health.printer ?? null);
  }, []);

  useEffect(() => {
    void refreshPrinter();
  }, [refreshPrinter]);

  const doneCount = DEFAULT_ITEMS.filter((item) => checked[item.id]).length;
  const allDone = doneCount === DEFAULT_ITEMS.length;

  return (
    <main className="min-h-screen bg-transparent text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 pt-32 pb-20 space-y-10">
        <div className="text-center space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
            Crew Only
          </p>
          <h1 className="font-catilya text-3xl sm:text-5xl font-bold text-white">
            Event-Day Setup Guide
          </h1>
          <p className="text-sm text-emerald-100/70 max-w-xl mx-auto">
            Complete this checklist before guests arrive. For on-site events, always run
            the print node on a local laptop — not cloud-only.
          </p>
        </div>

        {/* Live printer status */}
        <div
          className={`rounded-2xl border p-5 flex items-center justify-between gap-4 ${
            printerOk
              ? "bg-emerald-500/10 border-emerald-400/30"
              : "bg-rose-500/10 border-rose-400/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <Printer className={`w-6 h-6 ${printerOk ? "text-emerald-400" : "text-rose-400"}`} />
            <div>
              <p className="text-sm font-bold text-white">
                {printerOk ? "Print server connected" : "Print server not reachable"}
              </p>
              <p className="text-xs text-white/60">
                {printerOk && printerName ? printerName : "Start local print server on port 3847"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refreshPrinter()}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
            aria-label="Refresh printer status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Checklist */}
        <div className="rounded-2xl border border-[#D4AF37]/30 bg-black/40 backdrop-blur-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-aylia text-lg font-bold text-white">Pre-Event Checklist</h2>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                allDone
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-white/5 text-white/60"
              }`}
            >
              {doneCount}/{DEFAULT_ITEMS.length}
            </span>
          </div>

          <ul className="space-y-3">
            {DEFAULT_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-center gap-3 text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/40 transition group"
                >
                  {checked[item.id] ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/30 group-hover:text-[#D4AF37] shrink-0" />
                  )}
                  <span
                    className={`text-sm ${checked[item.id] ? "text-white/50 line-through" : "text-white/90"}`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* LAN setup */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-5">
          <h2 className="font-aylia text-lg font-bold text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-[#D4AF37]" />
            LAN Setup (Recommended)
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Laptop className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Laptop (Print Node)</span>
              </div>
              <pre className="text-[11px] font-mono text-emerald-100/80 whitespace-pre-wrap leading-relaxed">
{`npm run dev
# or production build on port 3000

NEXT_PUBLIC_PRINT_SERVER_URL=http://localhost:3847`}
              </pre>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Tablet className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">iPad (Web Booth)</span>
              </div>
              <pre className="text-[11px] font-mono text-emerald-100/80 whitespace-pre-wrap leading-relaxed">
{`Open: http://<laptop-ip>:3000/webbooth

NEXT_PUBLIC_PRINT_API_URL=http://<laptop-ip>:3000`}
              </pre>
            </div>
          </div>

          <p className="text-xs text-white/50 leading-relaxed">
            Both devices must be on the same Wi-Fi subnet. The in-memory print queue lives on
            the laptop — if you use the Vercel URL alone, jobs may be lost on serverless cold
            starts. Supabase/Firebase cloud mirror is a backup, not the primary queue.
          </p>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/webbooth"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] text-xs font-bold uppercase tracking-wider"
          >
            Open Web Booth <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/webprinter"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition"
          >
            Open Web Printer <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/operator"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition"
          >
            Operator Portal <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
