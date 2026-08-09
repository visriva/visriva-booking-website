"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Printer, Wifi, WifiOff, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  subscribePrintJobs,
  checkPrintServerHealth,
  PrintJob,
} from "@/lib/printJobs";

const PENDING_STALL_COUNT = 3;
const PENDING_STALL_MS = 2 * 60 * 1000;

export default function OperatorPrintStatusBanner() {
  const [pendingCount, setPendingCount] = useState(0);
  const [printingCount, setPrintingCount] = useState(0);
  const [oldestPendingMs, setOldestPendingMs] = useState<number | null>(null);
  const [printerOk, setPrinterOk] = useState<boolean | null>(null);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

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
    const tick = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const unsub = subscribePrintJobs((jobs: PrintJob[]) => {
      const pending = jobs.filter((j) => j.status === "pending");
      setPendingCount(pending.length);
      setPrintingCount(jobs.filter((j) => j.status === "printing").length);

      if (pending.length === 0) {
        setOldestPendingMs(null);
        return;
      }

      const oldest = pending.reduce((min, job) => {
        const t = job.createdAt ? new Date(job.createdAt).getTime() : Date.now();
        return t < min ? t : min;
      }, Date.now());
      setOldestPendingMs(Date.now() - oldest);
    });
    return unsub;
  }, []);

  const stallAlerts = useMemo(() => {
    const alerts: string[] = [];
    if (printerOk === false) {
      alerts.push("USB print server offline — start npm run print-server on the laptop");
    }
    if (pendingCount > PENDING_STALL_COUNT) {
      alerts.push(`${pendingCount} strips waiting — check /webprinter Auto-Print`);
    }
    if (
      oldestPendingMs !== null &&
      oldestPendingMs >= PENDING_STALL_MS &&
      pendingCount > 0
    ) {
      const mins = Math.floor(oldestPendingMs / 60000);
      alerts.push(
        mins >= 1
          ? `Oldest job waiting ${mins}+ min — printer may be jammed or offline`
          : "Print queue stalled — oldest job waiting 2+ minutes"
      );
    }
    return alerts;
  }, [printerOk, pendingCount, oldestPendingMs, now]);

  const queueActive = pendingCount > 0 || printingCount > 0;
  const hasStall = stallAlerts.length > 0;
  const allOk = printerOk === true && pendingCount === 0 && !hasStall;

  return (
    <div
      className={`rounded-2xl border p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
        hasStall
          ? "bg-rose-500/10 border-rose-400/40"
          : queueActive
            ? "bg-amber-500/10 border-amber-400/40"
            : allOk
              ? "bg-emerald-500/10 border-emerald-400/30"
              : "bg-black/40 border-[#D4AF37]/30"
      }`}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            hasStall ? "bg-rose-500/20" : printerOk ? "bg-emerald-500/20" : "bg-rose-500/20"
          }`}
        >
          {hasStall ? (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          ) : printerOk ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
        </div>
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
            Print Pipeline
          </p>
          <p className="text-sm text-white/90">
            {pendingCount > 0
              ? `${pendingCount} strip${pendingCount === 1 ? "" : "s"} waiting to print`
              : printingCount > 0
                ? `Printing ${printingCount} job${printingCount === 1 ? "" : "s"}…`
                : "Print queue clear"}
            {printerOk === false && !hasStall && " — USB print server offline"}
            {printerOk === true && printerName && ` — ${printerName}`}
          </p>
          {stallAlerts.length > 0 && (
            <ul className="text-xs text-rose-200/90 space-y-0.5 list-disc list-inside">
              {stallAlerts.map((alert) => (
                <li key={alert}>{alert}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap shrink-0">
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
