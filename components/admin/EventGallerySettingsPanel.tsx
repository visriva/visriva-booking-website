"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, Save, Sparkles } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import {
  DEFAULT_EVENT_GALLERY_SETTINGS,
  EventGallerySettings,
  saveEventGallerySettings,
  subscribeEventGallerySettings,
} from "@/lib/firebase";

interface Props {
  onToast: (message: string, isError?: boolean) => void;
}

export default function EventGallerySettingsPanel({ onToast }: Props) {
  const [settings, setSettings] = useState<EventGallerySettings>(DEFAULT_EVENT_GALLERY_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return subscribeEventGallerySettings(setSettings);
  }, []);

  const handleSave = async () => {
    if (!settings.instagramUrl.trim()) {
      onToast("Instagram URL is required", true);
      return;
    }
    if (!settings.eventPassword.trim()) {
      onToast("Set an event password guests will enter", true);
      return;
    }
    if (!settings.kwikpicEmbedUrl.trim()) {
      onToast("Paste the Kwikpic embed / gallery URL", true);
      return;
    }

    setIsSaving(true);
    const res = await saveEventGallerySettings(settings);
    setIsSaving(false);
    if (res.success) onToast("Event Gallery Settings saved to Firestore");
    else onToast(res.error || "Failed to save", true);
  };

  return (
    <div className="space-y-8">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gold-gradient text-[#011F15] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-white">Event Gallery Settings</h2>
            </div>
            <p className="text-xs text-emerald-100/75 leading-relaxed max-w-2xl">
              Controls the Instagram-gated Kwikpic AI gallery at{" "}
              <span className="text-[#D4AF37] font-mono">/gallery</span>. Guests follow Instagram, DM you
              for the password, then unlock the facial-recognition album inside the site.
            </p>
          </div>
          <a
            href="/gallery"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl border border-white/20 text-white text-xs font-bold hover:bg-white/10 transition flex items-center gap-2 shrink-0"
          >
            Open guest gallery
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-emerald-100/80">
          {[
            "1. Paste Instagram profile URL",
            "2. Set this event’s access password",
            "3. Paste Kwikpic embed / share URL",
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
              Live event gate config
            </h3>
            <p className="text-xs text-emerald-100/60 mt-1">
              Saved to Firestore <span className="font-mono text-[#D4AF37]">config/gallery_settings</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving…" : "Save settings"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
              Instagram URL
            </label>
            <input
              type="url"
              value={settings.instagramUrl}
              onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
              placeholder="https://instagram.com/visriva.co"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
              Event password
            </label>
            <input
              type="text"
              value={settings.eventPassword}
              onChange={(e) => setSettings({ ...settings, eventPassword: e.target.value })}
              placeholder="e.g. visriva-wedding-2026"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-[#D4AF37] outline-none"
            />
            <p className="text-[10px] text-emerald-100/50">
              Guests DM you the event name on Instagram; you reply with this password.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
              Kwikpic embed URL
            </label>
            <input
              type="url"
              value={settings.kwikpicEmbedUrl}
              onChange={(e) => setSettings({ ...settings, kwikpicEmbedUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:border-[#D4AF37] outline-none"
            />
            <p className="text-[10px] text-emerald-100/50">
              Full URL of the Kwikpic AI / facial recognition gallery to embed after unlock.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
