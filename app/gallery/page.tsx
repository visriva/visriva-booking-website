"use client";

import React, { useEffect, useState, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FaInstagram } from "react-icons/fa";
import {
  Sparkles,
  Lock,
  KeyRound,
  ExternalLink,
  MessageCircle,
  Unlock,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DEFAULT_EVENT_GALLERY_SETTINGS,
  EventGallerySettings,
  subscribeEventGallerySettings,
  subscribeFeatureToggles,
  DEFAULT_FEATURE_TOGGLES,
  FeatureTogglesConfig,
} from "@/lib/firebase";

const UNLOCK_SESSION_KEY = "visriva_gallery_ai_unlocked";

function GalleryGatedContent() {
  const [settings, setSettings] = useState<EventGallerySettings>(DEFAULT_EVENT_GALLERY_SETTINGS);
  const [featureToggles, setFeatureToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);
  const [loaded, setLoaded] = useState(false);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const unsubSettings = subscribeEventGallerySettings((data) => {
      setSettings(data);
      setLoaded(true);
      if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem(UNLOCK_SESSION_KEY);
        if (saved && data.eventPassword && saved === data.eventPassword.trim()) {
          setUnlocked(true);
        }
      }
    });
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) setFeatureToggles(data);
    });
    return () => {
      unsubSettings();
      unsubToggles();
    };
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = settings.eventPassword.trim();
    const entered = password.trim();

    if (!expected) {
      setError("Gallery password is not configured yet. Please check back soon.");
      triggerShake();
      return;
    }

    if (!entered || entered !== expected) {
      setError("Incorrect password. DM us on Instagram for access.");
      triggerShake();
      return;
    }

    setError("");
    setUnlocked(true);
    sessionStorage.setItem(UNLOCK_SESSION_KEY, expected);
  };

  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 500);
  };

  if (featureToggles.enableGuestGallery === false) {
    return (
      <main className="min-h-screen bg-[#011F15] text-white">
        <Navbar />
        <div className="pt-44 pb-28 px-4 text-center max-w-md mx-auto space-y-4">
          <Lock className="w-12 h-12 text-[#D4AF37] mx-auto opacity-70" />
          <h2 className="font-serif text-2xl font-bold text-white">Guest Gallery Offline</h2>
          <p className="text-xs text-emerald-100/70">
            The guest photo portal is temporarily disabled. Contact Visriva for access.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
      <Navbar />

      <section className="pt-36 sm:pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-black/50 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            <span>AI Event Gallery</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight">
            Find your <span className="text-[#D4AF37]">moments</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/75 font-light leading-relaxed">
            Facial recognition gallery powered by Kwikpic — unlock after following Visriva on Instagram.
          </p>
        </div>

        {!loaded ? (
          <div className="text-center font-mono text-xs text-emerald-100/50 py-20">Loading gallery gate…</div>
        ) : unlocked && settings.kwikpicEmbedUrl ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-emerald-200/80 flex items-center gap-2">
                <Unlock className="w-4 h-4 text-[#D4AF37]" />
                Gallery unlocked — search your face below
              </p>
              <button
                type="button"
                onClick={() => {
                  setUnlocked(false);
                  setPassword("");
                  sessionStorage.removeItem(UNLOCK_SESSION_KEY);
                }}
                className="text-[10px] uppercase tracking-wider text-emerald-100/50 hover:text-[#D4AF37] transition"
              >
                Lock again
              </button>
            </div>

            <div className="w-full rounded-2xl overflow-hidden border border-[#D4AF37]/35 bg-black/50 shadow-[0_0_40px_rgba(212,175,55,0.12)]">
              <iframe
                title="Kwikpic AI Gallery"
                src={settings.kwikpicEmbedUrl}
                className="w-full min-h-[75vh] h-[80vh] border-0 bg-[#011F15]"
                allow="camera; microphone; fullscreen"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>
        ) : unlocked && !settings.kwikpicEmbedUrl ? (
          <div className="max-w-md mx-auto rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-8 text-center space-y-3">
            <Lock className="w-10 h-10 text-[#D4AF37] mx-auto opacity-80" />
            <h2 className="font-serif text-xl font-bold">Password accepted</h2>
            <p className="text-xs text-emerald-100/70">
              The Kwikpic gallery link hasn&apos;t been added yet. Please check back shortly.
            </p>
            <button
              type="button"
              onClick={() => {
                setUnlocked(false);
                sessionStorage.removeItem(UNLOCK_SESSION_KEY);
              }}
              className="text-xs text-[#D4AF37] font-bold"
            >
              Back
            </button>
          </div>
        ) : (
          <motion.div
            animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-lg mx-auto"
          >
            <div className="rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-lg">
                  <FaInstagram className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-white">Unlock your photos</h2>
                  <p className="text-[11px] text-emerald-100/60">Two quick steps, then enter your password</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#011F15] text-[11px] font-black flex items-center justify-center">
                      1
                    </span>
                    <p className="text-sm font-bold text-white">Follow our Instagram to unlock your photos</p>
                  </div>
                  <a
                    href={settings.instagramUrl || "https://instagram.com/visriva.co"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider hover:scale-[1.02] transition"
                  >
                    <FaInstagram className="w-4 h-4" />
                    Follow @visriva.co
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#011F15] text-[11px] font-black flex items-center justify-center">
                      2
                    </span>
                    <p className="text-sm font-bold text-white">
                      DM us the Event Name on Instagram to receive your access password
                    </p>
                  </div>
                  <p className="text-[11px] text-emerald-100/65 leading-relaxed pl-8 flex items-start gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                    Open Instagram DMs, message the event name, and we&apos;ll reply with your gallery password.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUnlock} className="space-y-3 pt-1 border-t border-white/10">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                  Access password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter password from Instagram DM"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/55 border border-[#D4AF37]/35 text-white font-mono text-sm focus:border-[#D4AF37] outline-none"
                    autoComplete="off"
                  />
                </div>
                {error && <p className="text-xs text-rose-300">{error}</p>}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-sm uppercase tracking-wider hover:scale-[1.02] transition flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  Unlock Gallery
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </section>

      <Footer />
    </main>
  );
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#011F15] text-white p-20 text-center font-mono text-sm">
          Loading gallery…
        </div>
      }
    >
      <GalleryGatedContent />
    </Suspense>
  );
}
