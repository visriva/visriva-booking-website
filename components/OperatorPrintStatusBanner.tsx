"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Printer, Wifi, WifiOff, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  subscribePrintJobs,
  checkPrintServerHealth,
  PrintJob,
} from "@/lib/printJobs";

export default function OperatorPrintStatusBanner() {
  const [pendingCount, setPendingCount] = useState(0);
  const [printingCount, setPrintingCount] = useState(0);
  const [printerOk, setPrinterOk] = useState<boolean | null>(null);
  const [printerName, setPrinterName] = useState<string | null>(null);

  const refreshPrinter = useCallback(async () => {
    const health = await checkPrintServerHealth();
    setPrinterOk(health.ok);
    setPrinterName(health.printer ?? null);
  }, []);

  useEffect(() => {
    void refreshPrinter();
    const interval = setInterval(() => void refreshPrinter(), 15000);
    return () => clearInterval(interval);
  }, [refreshPrinter]);

  useEffect(() => {
    const unsub = subscribePrintJobs((jobs: PrintJob[]) => {
      setPendingCount(jobs.filter((j) => j.status === "pending").length);
      setPrintingCount(jobs.filter((j) => j.status === "printing").length);
    });
    return unsub;
  }, []);

  const queueActive = pendingCount > 0 || printingCount > 0;
  const allOk = printerOk === true && pendingCount === 0;

  return (
    <div
      className={`rounded-2xl border p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
        queueActive
          ? "bg-amber-500/10 border-amber-400/40"
          : allOk
            ? "bg-emerald-500/10 border-emerald-400/30"
            : "bg-black/40 border-[#D4AF37]/30"
      }`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            printerOk ? "bg-emerald-500/20" : "bg-rose-500/20"
          }`}
        >
          {printerOk ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
            Print Pipeline
          </p>
          <p className="text-sm text-white/90">
            {pendingCount > 0
              ? `${pendingCount} strip${pendingCount === 1 ? "" : "s"} waiting to print`
              : printingCount > 0
                ? `Printing ${printingCount} job${printingCount === 1 ? "" : "s"}…`
                : "Print queue clear"}
            {printerOk === false && " — USB print server offline (browser fallback available)"}
            {printerOk === true && printerName && ` — ${printerName}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold ${
            printerOk ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
          }`}
        >
          {printerOk ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {printerOk ? "Printer OK" : "Printer Offline"}
        </span>
        <Link
          href="/webprinter"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider hover:bg-[#D4AF37]/30 transition"
        >
          <Printer className="w-3.5 h-3.5" />
          Web Printer
        </Link>
        <Link
          href="/webbooth"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/20 text-white/80 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition"
        >
          Web Booth
        </Link>
        <Link
          href="/event-setup"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/20 text-white/60 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition"
        >
          Setup Guide
        </Link>
      </div>
    </div>
  );
}
