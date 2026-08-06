"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Printer,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  subscribePrintJobs,
  PrintJob,
  checkPrintServerHealth,
  sendToLocalPrintServer,
  printImageViaBrowser,
  markPrintJobStatus,
  resolvePrintJobBlob,
} from "@/lib/printJobs";

const AUTO_PRINT_KEY = "visriva-webprinter-auto";

function loadAutoPrint(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(AUTO_PRINT_KEY) !== "false";
}

export default function WebPrinterPage() {
  const [queue, setQueue] = useState<PrintJob[]>([]);
  const [recentJobs, setRecentJobs] = useState<PrintJob[]>([]);
  const [printerOk, setPrinterOk] = useState<boolean | null>(null);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [autoPrint, setAutoPrint] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const processingRef = useRef(false);

  const appendLog = (msg: string) =>
    setLog((prev) => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev].slice(0, 25));

  const refreshPrinterStatus = useCallback(async () => {
    const health = await checkPrintServerHealth();
    setPrinterOk(health.ok);
    setPrinterName(health.printer ?? null);
    if (!health.ok) {
      appendLog("USB print server not reachable — browser print fallback active");
    } else {
      appendLog(`Printer connected: ${health.printer || "system default"}`);
    }
  }, []);

  useEffect(() => {
    setAutoPrint(loadAutoPrint());
    refreshPrinterStatus();
    const interval = setInterval(refreshPrinterStatus, 15000);
    return () => clearInterval(interval);
  }, [refreshPrinterStatus]);

  useEffect(() => {
    localStorage.setItem(AUTO_PRINT_KEY, autoPrint ? "true" : "false");
  }, [autoPrint]);

  useEffect(() => {
    const unsubPending = subscribePrintJobs((jobs) => setQueue(jobs), "pending");
    const unsubAll = subscribePrintJobs((jobs) => setRecentJobs(jobs));
    return () => {
      unsubPending();
      unsubAll();
    };
  }, []);

  const processJob = useCallback(
    async (job: PrintJob) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setProcessingId(job.id);
      try {
        await markPrintJobStatus(job.id, "printing");

        const blob = await resolvePrintJobBlob(job);

        if (printerOk) {
          await sendToLocalPrintServer(blob, job.id);
        } else {
          await printImageViaBrowser(job.imageUrl || job.images?.[0] || "");
        }

        await markPrintJobStatus(job.id, "printed");
        appendLog(`Printed job ${job.id.slice(0, 10)}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Print failed";
        await markPrintJobStatus(job.id, "failed", { error: msg });
        appendLog(`Failed ${job.id.slice(0, 10)}: ${msg}`);
      } finally {
        processingRef.current = false;
        setProcessingId(null);
      }
    },
    [printerOk]
  );

  useEffect(() => {
    if (!autoPrint || queue.length === 0 || processingRef.current) return;
    const next = queue.find((j) => j.status === "pending");
    if (next) void processJob(next);
  }, [queue, autoPrint, processJob]);

  const pendingCount = queue.filter((j) => j.status === "pending").length;
  const printedCount = recentJobs.filter((j) => j.status === "printed").length;

  return (
    <main className="min-h-screen bg-[#011F15] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Web Print Node
            </h1>
            <p className="text-sm text-emerald-100/70 mt-1">
              Laptop print station — receives jobs from iPad Web Booth
            </p>
          </div>
          <button
            onClick={refreshPrinterStatus}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-wider hover:bg-white/5"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Status
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              {printerOk ? (
                <Wifi className="w-6 h-6 text-emerald-400" />
              ) : (
                <WifiOff className="w-6 h-6 text-amber-400" />
              )}
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-100/60">Printer USB</p>
                <p className="font-bold text-sm">
                  {printerOk ? printerName || "Connected" : "Offline / Browser Fallback"}
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-[#D4AF37]" />
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-100/60">Queue</p>
                <p className="font-bold text-sm">{pendingCount} pending</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-100/60">Printed Today</p>
                <p className="font-bold text-sm">{printedCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between glass-card rounded-2xl p-4 border border-[#D4AF37]/30">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-sm font-bold">Auto-print incoming packets</span>
          </div>
          <button
            onClick={() => setAutoPrint((v) => !v)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider ${
              autoPrint
                ? "bg-gold-gradient text-[#011F15]"
                : "bg-white/10 text-white border border-white/20"
            }`}
          >
            {autoPrint ? "ON" : "OFF"}
          </button>
        </div>

        <section className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-bold text-sm uppercase tracking-widest text-[#D4AF37]">
              Live Print Queue
            </h2>
            {processingId && (
              <span className="text-xs text-emerald-200 animate-pulse">Processing…</span>
            )}
          </div>
          <div className="divide-y divide-white/5">
            {queue.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-emerald-100/50">
                Waiting for Web Booth print triggers…
              </p>
            ) : (
              queue.map((job) => (
                <div key={job.id} className="px-5 py-4 flex items-center gap-4">
                  <img
                    src={job.imageUrl}
                    alt=""
                    className="w-16 h-20 object-cover rounded-lg border border-[#D4AF37]/30"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-[#D4AF37]">{job.id}</p>
                    <p className="text-sm text-white/80 truncate">{job.source || "webbooth"}</p>
                    <p className="text-xs text-emerald-100/50 mt-1">{job.status}</p>
                  </div>
                  <button
                    onClick={() => processJob(job)}
                    disabled={processingId === job.id}
                    className="px-3 py-2 rounded-lg bg-gold-gradient text-[#011F15] text-xs font-bold uppercase disabled:opacity-50"
                  >
                    Print Now
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="glass-card rounded-2xl border border-white/10">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-bold text-sm uppercase tracking-widest text-[#D4AF37]">Activity Log</h2>
          </div>
          <ul className="px-5 py-3 space-y-1 max-h-48 overflow-y-auto text-xs font-mono text-emerald-100/70">
            {log.length === 0 ? (
              <li className="py-2 text-emerald-100/40">No activity yet</li>
            ) : (
              log.map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0 opacity-40" />
                  <span>{line}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
