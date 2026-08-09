"use client";

import React, { useCallback, useState } from "react";
import { Upload, Scan, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { ReceiptAnalysis } from "@/lib/receiptAnalysis";

export interface ReceiptFormData {
  type: "income" | "expense";
  amount: string;
  category: string;
  description: string;
  party: string;
  bank: string;
  paymentMethod: string;
  reason: string;
  date: string;
}

interface Props {
  onApply: (data: ReceiptFormData) => void;
  onToast: (msg: string, isError?: boolean) => void;
}

export default function ReceiptAnalyzer({ onApply, onToast }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ReceiptAnalysis | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const analyzeFile = async (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      onToast("Upload an image (JPG, PNG, WebP) or screenshot", true);
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      onToast("Image too large — max 12MB", true);
      return;
    }

    setPreview(URL.createObjectURL(file));
    setAnalysis(null);
    setAnalyzing(true);

    const form = new FormData();
    form.append("image", file);

    try {
      const res = await fetch("/api/finance/analyze-receipt", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        onToast(data.error || "Analysis failed", true);
        if (data.analysis) setAnalysis(data.analysis);
        return;
      }
      setAnalysis(data.analysis);
      onToast("Receipt analyzed — review and save");
    } catch {
      onToast("Network error during analysis", true);
    } finally {
      setAnalyzing(false);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) void analyzeFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const applyToForm = () => {
    if (!analysis) return;
    onApply({
      type: analysis.type === "income" ? "income" : "expense",
      amount: String(Math.round(analysis.amount)),
      category: analysis.category,
      description: analysis.description,
      party: analysis.party,
      bank: analysis.bank,
      paymentMethod: analysis.paymentMethod,
      reason: analysis.reason,
      date: analysis.date?.match(/^\d{4}-\d{2}-\d{2}$/) ? analysis.date : new Date().toISOString().split("T")[0],
    });
    onToast("Applied to form — review and tap Save");
  };

  return (
    <div className="glass-card rounded-2xl border border-[#D4AF37]/30 p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Scan className="w-5 h-5 text-[#D4AF37]" />
        <h3 className="font-serif text-lg font-bold text-white">AI Receipt Scanner</h3>
      </div>
      <p className="text-xs text-white/50">
        Upload a bill, UPI screenshot, or bank transfer image. AI extracts amount, vendor, bank, and purpose.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition ${
          dragOver ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-white/15 bg-black/20"
        }`}
      >
        {analyzing ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
            <p className="text-sm text-white/70">Analyzing receipt with AI…</p>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-[#D4AF37]/60 mx-auto mb-3" />
            <p className="text-sm text-white/80 mb-2">Drag & drop or click to upload</p>
            <p className="text-[10px] text-white/40 mb-4">JPG · PNG · WebP · Screenshot</p>
            <label className="inline-block px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] text-xs font-extrabold uppercase cursor-pointer">
              Choose file
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void analyzeFile(f);
                }}
              />
            </label>
          </>
        )}
      </div>

      {preview && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Receipt preview"
            className="w-full sm:w-40 h-40 object-cover rounded-xl border border-white/10"
          />
          {analysis && (
            <div className="flex-1 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Analysis ({analysis.confidence} confidence)
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-white/80">
                <span className="text-white/40">Type</span>
                <span className="capitalize">{analysis.type}</span>
                <span className="text-white/40">Amount</span>
                <span className="text-[#D4AF37] font-bold">₹{analysis.amount}</span>
                <span className="text-white/40">Paid to / from</span>
                <span>{analysis.party || "—"}</span>
                <span className="text-white/40">Bank / UPI</span>
                <span>{analysis.bank || analysis.paymentMethod || "—"}</span>
                <span className="text-white/40">Category</span>
                <span>{analysis.category}</span>
                <span className="text-white/40 col-span-2">Purpose</span>
                <span className="col-span-2">{analysis.reason || analysis.description}</span>
              </div>
              <button
                type="button"
                onClick={applyToForm}
                className="mt-2 w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase"
              >
                Apply to expense/income form
              </button>
            </div>
          )}
        </div>
      )}

      {!analysis && preview && !analyzing && (
        <p className="text-xs text-amber-400 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Could not parse — try a clearer photo or enter manually
        </p>
      )}
    </div>
  );
}
