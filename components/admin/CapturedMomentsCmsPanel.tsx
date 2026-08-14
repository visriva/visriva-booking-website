"use client";

import React, { useEffect, useState } from "react";
import { FaInstagram } from "react-icons/fa";
import { ExternalLink, FolderOpen, Plus, Save, Trash2 } from "lucide-react";
import {
  CapturedMomentEvent,
  CapturedMomentsPageConfig,
  DEFAULT_CAPTURED_MOMENTS_PAGE_CONFIG,
  deleteCapturedMomentEvent,
  saveCapturedMomentEvent,
  saveCapturedMomentsPageConfig,
  subscribeCapturedMoments,
  subscribeCapturedMomentsPageConfig,
} from "@/lib/firebase";

interface Props {
  onToast: (message: string, isError?: boolean) => void;
}

export default function CapturedMomentsCmsPanel({ onToast }: Props) {
  const [events, setEvents] = useState<CapturedMomentEvent[]>([]);
  const [pageConfig, setPageConfig] = useState<CapturedMomentsPageConfig>(
    DEFAULT_CAPTURED_MOMENTS_PAGE_CONFIG
  );
  const [isSaving, setIsSaving] = useState(false);
  const [eventName, setEventName] = useState("");
  const [password, setPassword] = useState("");
  const [driveUrl, setDriveUrl] = useState("");

  useEffect(() => {
    const unsubEvents = subscribeCapturedMoments(setEvents);
    const unsubPage = subscribeCapturedMomentsPageConfig(setPageConfig);
    return () => {
      unsubEvents();
      unsubPage();
    };
  }, []);

  const handleSavePage = async () => {
    setIsSaving(true);
    const res = await saveCapturedMomentsPageConfig(pageConfig);
    setIsSaving(false);
    if (res.success) onToast("Captured Moments page settings saved");
    else onToast(res.error || "Failed to save settings", true);
  };

  const handleAddEvent = async () => {
    if (!eventName.trim() || !password.trim()) {
      onToast("Event name and password are required", true);
      return;
    }
    if (!driveUrl.trim()) {
      onToast("Paste the Google Drive folder link", true);
      return;
    }
    setIsSaving(true);
    const res = await saveCapturedMomentEvent({
      eventCode: password.trim().toLowerCase(),
      displayName: eventName.trim(),
      googleDriveUrl: driveUrl.trim(),
      isActive: true,
    });
    setIsSaving(false);
    if (res.success) {
      onToast(`Event “${eventName.trim()}” added — guests use password to unlock`);
      setEventName("");
      setPassword("");
      setDriveUrl("");
    } else {
      onToast(res.error || "Failed to add event", true);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const res = await deleteCapturedMomentEvent(id);
    if (res.success) onToast(`Removed “${name}”`);
    else onToast(res.error || "Failed to remove", true);
  };

  const sorted = [...events].sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <div className="space-y-8">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gold-gradient text-[#011F15] flex items-center justify-center">
                <FolderOpen className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-white">Captured Moments</h2>
            </div>
            <p className="text-xs text-emerald-100/75 leading-relaxed max-w-2xl">
              After each event: create a Google Drive folder (Anyone with the link → Viewer), then add
              Event name + Password + Drive URL here. Guests open{" "}
              <span className="text-[#D4AF37] font-mono">/captured-moments</span>, pick the event,
              enter the password, follow Instagram, and unlock the Drive album.
            </p>
          </div>
          <a
            href="/captured-moments"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl border border-white/20 text-white text-xs font-bold hover:bg-white/10 transition flex items-center gap-2 shrink-0"
          >
            Open guest page
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px] text-emerald-100/80">
          {[
            "1. Finish event → upload photos to Drive",
            "2. Share folder: Anyone with link (Viewer)",
            "3. Add Event name + Password + Drive link here",
            "4. Tell guests: visriva.com/captured-moments",
          ].map((step) => (
            <li key={step} className="rounded-xl bg-black/40 border border-white/10 px-3 py-3">
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <FaInstagram className="w-4 h-4 text-[#D4AF37]" />
              Instagram unlock settings
            </h3>
            <p className="text-xs text-emerald-100/60 mt-1">
              Guests must follow before the Drive link appears (confirm-based — no Meta API yet).
            </p>
          </div>
          <button
            type="button"
            onClick={handleSavePage}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save settings
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
              Instagram username
            </label>
            <input
              type="text"
              value={pageConfig.instagramUsername}
              onChange={(e) => setPageConfig({ ...pageConfig, instagramUsername: e.target.value })}
              placeholder="visriva.co"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
              Page subtitle
            </label>
            <input
              type="text"
              value={pageConfig.pageSubtitle}
              onChange={(e) => setPageConfig({ ...pageConfig, pageSubtitle: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={pageConfig.instagramGateEnabled}
            onChange={(e) =>
              setPageConfig({ ...pageConfig, instagramGateEnabled: e.target.checked })
            }
            className="w-5 h-5 accent-[#D4AF37]"
          />
          <span className="text-sm text-white">
            Require Instagram follow before showing Google Drive link
          </span>
        </label>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-5">
        <div>
          <h3 className="font-serif text-lg font-bold text-white">Add event album folder</h3>
          <p className="text-xs text-emerald-100/60 mt-1">
            Password is what guests type (keep it simple, e.g. <span className="font-mono text-[#D4AF37]">rahul2026</span>).
            Event name is shown publicly on the guest page.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
              Event name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Rahul & Ananya Wedding"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
              Guest password
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="rahul2026"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
              Google Drive folder URL
            </label>
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddEvent}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#011F15] font-bold text-xs uppercase tracking-wider hover:scale-105 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add event album
        </button>

        <div className="space-y-3 pt-2 border-t border-white/10">
          {sorted.length === 0 ? (
            <p className="text-xs text-emerald-100/60">
              No event folders yet. Add your first album after tonight&apos;s event.
            </p>
          ) : (
            sorted.map((ev) => (
              <div
                key={ev.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-black/40 border border-white/10"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-bold text-white text-sm">{ev.displayName}</p>
                  <p className="text-[10px] font-mono text-[#D4AF37]">Password: {ev.eventCode}</p>
                  {ev.googleDriveUrl ? (
                    <a
                      href={ev.googleDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-200/70 hover:text-[#D4AF37] truncate block max-w-xl"
                    >
                      {ev.googleDriveUrl}
                    </a>
                  ) : (
                    <p className="text-[10px] text-rose-300">Missing Drive link</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(ev.id, ev.displayName)}
                  className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
