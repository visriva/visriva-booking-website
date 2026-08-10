"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarSync, Copy, ExternalLink, Loader2, RefreshCw, Save } from "lucide-react";
import {
  subscribeCalendarSettings,
  saveCalendarSettings,
  DEFAULT_CALENDAR_SYNC_SETTINGS,
  type CalendarSyncSettings,
} from "@/lib/calendarConfig";

interface Props {
  onToast: (msg: string, isError?: boolean) => void;
  onSynced?: () => void;
}

export default function GoogleCalendarSyncPanel({ onToast, onSynced }: Props) {
  const [settings, setSettings] = useState<CalendarSyncSettings>(DEFAULT_CALENDAR_SYNC_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => subscribeCalendarSettings(setSettings), []);

  const runSync = useCallback(async () => {
    if (!settings.googleIcalUrl?.trim()) {
      onToast("Paste your Google Calendar secret iCal URL first", true);
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch("/api/calendar/sync-google", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        onToast(data.error || "Sync failed", true);
        return;
      }
      onToast(
        `Synced ${data.eventCount} Google events → ${data.blocked} blocked, ${data.highDemand} high demand`
      );
      onSynced?.();
    } catch {
      onToast("Network error during sync", true);
    } finally {
      setSyncing(false);
    }
  }, [onToast, onSynced, settings.googleIcalUrl]);

  // Auto-sync if enabled and last sync older than 4 hours
  useEffect(() => {
    if (!settings.syncEnabled || !settings.googleIcalUrl?.trim()) return;
    if (!settings.lastSyncedAt) return;
    const age = Date.now() - new Date(settings.lastSyncedAt).getTime();
    if (age < 4 * 60 * 60 * 1000) return;
    void runSync();
  }, [settings.syncEnabled, settings.googleIcalUrl, settings.lastSyncedAt, runSync]);

  const exportUrl = useMemo(() => {
    if (!settings.exportFeedToken) return "";
    const base = typeof window !== "undefined" ? window.location.origin : "https://www.visriva.com";
    return `${base}/api/calendar/feed?token=${settings.exportFeedToken}`;
  }, [settings.exportFeedToken]);

  const save = async (andSync?: boolean) => {
    setSaving(true);
    const res = await saveCalendarSettings(settings);
    setSaving(false);
    if (!res.success) {
      onToast(res.error || "Save failed", true);
      return;
    }
    onToast("Google Calendar settings saved");
    if (andSync && settings.googleIcalUrl?.trim()) {
      await runSync();
    }
  };

  const copyExportUrl = async () => {
    if (!exportUrl) {
      onToast("Save settings first to generate export link", true);
      return;
    }
    try {
      await navigator.clipboard.writeText(exportUrl);
      onToast("Export URL copied — paste in Google Calendar → Add calendar → From URL");
    } catch {
      onToast(exportUrl, false);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-[#D4AF37]/25 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarSync className="w-5 h-5 text-[#D4AF37]" />
        <h3 className="font-serif text-lg font-bold">Google Calendar Sync</h3>
      </div>

      <div className="text-xs text-white/60 space-y-2 leading-relaxed">
        <p>
          <strong className="text-white">Import (Google → Website):</strong> Events on your Google Calendar
          automatically block dates on <code className="text-[#D4AF37]">/reserve</code>.
        </p>
        <p>
          <strong className="text-white">Export (Website → Google):</strong> Subscribe to the export URL in Google
          Calendar to see Visriva blocked dates on your phone.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase text-[#D4AF37]">
          Google Calendar secret iCal URL
        </label>
        <input
          value={settings.googleIcalUrl || ""}
          onChange={(e) => setSettings({ ...settings, googleIcalUrl: e.target.value })}
          placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#D4AF37] font-mono"
        />
        <a
          href="https://calendar.google.com/calendar/u/0/r/settings"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-[#D4AF37] hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Google Calendar → Settings → your calendar → Integrate calendar → Secret address in iCal format
        </a>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase text-[#D4AF37]">
          High-demand keywords (comma-separated)
        </label>
        <input
          value={settings.highDemandKeywords || ""}
          onChange={(e) => setSettings({ ...settings, highDemandKeywords: e.target.value })}
          placeholder="hold,tentative,enquiry,waitlist"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#D4AF37]"
        />
        <p className="text-[10px] text-white/40">
          Events with these words in the title show as high demand (amber), not fully booked.
        </p>
      </div>

      <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.includeTimedEvents !== false}
          onChange={(e) => setSettings({ ...settings, includeTimedEvents: e.target.checked })}
        />
        Block full day when any timed event exists (e.g. wedding 6pm still blocks that date)
      </label>

      <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.syncEnabled !== false}
          onChange={(e) => setSettings({ ...settings, syncEnabled: e.target.checked })}
        />
        Enable Google Calendar sync
      </label>

      {settings.lastSyncedAt && (
        <p className="text-[10px] text-emerald-400 font-mono">
          Last sync: {new Date(settings.lastSyncedAt).toLocaleString("en-IN")} ·{" "}
          {settings.lastSyncEventCount ?? 0} events
          {settings.lastSyncError ? (
            <span className="text-rose-400 block mt-1">Error: {settings.lastSyncError}</span>
          ) : null}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold uppercase hover:bg-white/15 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
        <button
          type="button"
          onClick={() => void save(true)}
          disabled={saving || syncing || !settings.googleIcalUrl?.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-gradient text-[#011F15] text-xs font-extrabold uppercase disabled:opacity-50"
        >
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Save &amp; Sync now
        </button>
        <button
          type="button"
          onClick={() => void runSync()}
          disabled={syncing || !settings.googleIcalUrl?.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold uppercase text-emerald-300 disabled:opacity-50"
        >
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Sync now
        </button>
      </div>

      <div className="border-t border-white/10 pt-4 space-y-2">
        <p className="text-[10px] font-bold uppercase text-[#D4AF37]">Export to Google Calendar (subscribe)</p>
        <p className="text-[10px] text-white/50">
          In Google Calendar: <strong className="text-white">+</strong> next to Other calendars →{" "}
          <strong className="text-white">From URL</strong> → paste this link. Google refreshes every few hours.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyExportUrl()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/10"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy export URL
          </button>
        </div>
      </div>
    </div>
  );
}
