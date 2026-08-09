"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, Loader2, Save, Table2 } from "lucide-react";
import {
  subscribeFinanceSettings,
  saveFinanceSettings,
  DEFAULT_FINANCE_SETTINGS,
  type FinanceSettings,
} from "@/lib/financeConfig";

interface Props {
  onToast: (msg: string, isError?: boolean) => void;
  onSyncAll: () => Promise<void>;
  syncing: boolean;
}

export default function SheetSyncPanel({ onToast, onSyncAll, syncing }: Props) {
  const [settings, setSettings] = useState<FinanceSettings>(DEFAULT_FINANCE_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeFinanceSettings(setSettings), []);

  const save = async () => {
    setSaving(true);
    const res = await saveFinanceSettings(settings);
    setSaving(false);
    if (res.success) onToast("Sheet settings saved");
    else onToast(res.error || "Save failed", true);
  };

  return (
    <div className="glass-card rounded-2xl border border-white/10 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Table2 className="w-5 h-5 text-[#D4AF37]" />
        <h3 className="font-serif text-lg font-bold">Google Sheets Sync</h3>
      </div>

      <div className="space-y-3 text-xs text-white/60 leading-relaxed">
        <p>
          <strong className="text-white">Step 1:</strong> Create a Google Sheet with columns: Date, Type, Amount,
          Category, Description, Party, Bank, etc.
        </p>
        <p>
          <strong className="text-white">Step 2:</strong> Extensions → Apps Script → paste the script from{" "}
          <code className="text-[#D4AF37]">docs/operations/google-sheets-setup.md</code> → Deploy as web app → copy
          URL below.
        </p>
        <p>
          <strong className="text-white">Step 3:</strong> Share the sheet with your service account email if using
          private sheet (optional).
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase text-[#D4AF37]">Google Sheet URL (for your reference)</label>
        <input
          value={settings.googleSheetUrl || ""}
          onChange={(e) => setSettings({ ...settings, googleSheetUrl: e.target.value })}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#D4AF37]"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase text-[#D4AF37]">Apps Script Webhook URL *</label>
        <input
          value={settings.googleSheetWebhookUrl || ""}
          onChange={(e) => setSettings({ ...settings, googleSheetWebhookUrl: e.target.value })}
          placeholder="https://script.google.com/macros/s/.../exec"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#D4AF37] font-mono"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.autoSyncOnSave !== false}
          onChange={(e) => setSettings({ ...settings, autoSyncOnSave: e.target.checked })}
        />
        Auto-sync each transaction to Google Sheet when saved
      </label>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold uppercase hover:bg-white/15 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save settings
        </button>
        <button
          type="button"
          onClick={() => void onSyncAll()}
          disabled={syncing || !settings.googleSheetWebhookUrl}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-gradient text-[#011F15] text-xs font-extrabold uppercase disabled:opacity-50"
        >
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Table2 className="w-3.5 h-3.5" />}
          Sync all to Sheet
        </button>
        {settings.googleSheetUrl && (
          <a
            href={settings.googleSheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/10"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Sheet
          </a>
        )}
      </div>
    </div>
  );
}
