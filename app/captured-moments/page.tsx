"use client";

import React, { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstagramGateModal from "@/components/InstagramGateModal";
import {
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FolderOpen,
  KeyRound,
  ListOrdered,
  Camera,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import {
  subscribeFeatureToggles,
  DEFAULT_FEATURE_TOGGLES,
  FeatureTogglesConfig,
  subscribeCapturedMoments,
  CapturedMomentEvent,
  subscribeCapturedMomentsPageConfig,
  DEFAULT_CAPTURED_MOMENTS_PAGE_CONFIG,
  CapturedMomentsPageConfig,
  subscribeGlobalContactSettings,
  DEFAULT_GLOBAL_SETTINGS,
  GlobalSettingsConfig,
} from "@/lib/firebase";

const IG_GATE_KEY = "visriva_ig_gate_unlocked";

function hasInstagramUnlock(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(IG_GATE_KEY) === "1";
}

function setInstagramUnlock(): void {
  sessionStorage.setItem(IG_GATE_KEY, "1");
}

type Step = "pick" | "password" | "unlocked";

function CapturedMomentsContent() {
  const [capturedEvents, setCapturedEvents] = useState<CapturedMomentEvent[]>([]);
  const [pageConfig, setPageConfig] = useState<CapturedMomentsPageConfig>(
    DEFAULT_CAPTURED_MOMENTS_PAGE_CONFIG
  );
  const [contact, setContact] = useState<GlobalSettingsConfig>(DEFAULT_GLOBAL_SETTINGS);
  const [featureToggles, setFeatureToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);

  const [step, setStep] = useState<Step>("pick");
  const [selectedEvent, setSelectedEvent] = useState<CapturedMomentEvent | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [gateOpen, setGateOpen] = useState(false);
  const [igUnlocked, setIgUnlocked] = useState(false);
  const [driveReady, setDriveReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIgUnlocked(hasInstagramUnlock());
    const unsubEvents = subscribeCapturedMoments(setCapturedEvents);
    const unsubPage = subscribeCapturedMomentsPageConfig(setPageConfig);
    const unsubContact = subscribeGlobalContactSettings((data) => {
      if (data) setContact(data);
    });
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) setFeatureToggles(data);
    });
    return () => {
      unsubEvents();
      unsubPage();
      unsubContact();
      unsubToggles();
    };
  }, []);

  const instagramUrl =
    contact.instagramUrl || `https://instagram.com/${pageConfig.instagramUsername}`;
  const instagramUsername = pageConfig.instagramUsername || "visriva.co";

  const activeEvents = [...capturedEvents]
    .filter((e) => e.isActive && e.googleDriveUrl)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const resetFlow = () => {
    setStep("pick");
    setSelectedEvent(null);
    setPasswordInput("");
    setPasswordError("");
    setDriveReady(false);
    setCopied(false);
  };

  const handleSelectEvent = (event: CapturedMomentEvent) => {
    setSelectedEvent(event);
    setPasswordInput("");
    setPasswordError("");
    setDriveReady(false);
    setStep("password");
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const entered = passwordInput.trim().toLowerCase();
    if (!entered || entered !== selectedEvent.eventCode.toLowerCase()) {
      setPasswordError("Wrong password. Ask your event host for the correct one.");
      return;
    }
    setPasswordError("");
    setStep("unlocked");

    if (pageConfig.instagramGateEnabled && !igUnlocked) {
      setGateOpen(true);
      return;
    }
    setDriveReady(true);
  };

  const handleGateUnlock = () => {
    setInstagramUnlock();
    setIgUnlocked(true);
    setDriveReady(true);
  };

  const openDrive = () => {
    if (!selectedEvent?.googleDriveUrl) return;
    window.open(selectedEvent.googleDriveUrl, "_blank", "noopener,noreferrer");
  };

  const copyDriveLink = async () => {
    if (!selectedEvent?.googleDriveUrl) return;
    try {
      await navigator.clipboard.writeText(selectedEvent.googleDriveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      openDrive();
    }
  };

  if (featureToggles.enableCapturedMoments === false) {
    return (
      <main className="min-h-screen bg-[#011F15] text-white">
        <Navbar />
        <div className="pt-44 pb-28 px-4 text-center max-w-md mx-auto space-y-4">
          <Lock className="w-12 h-12 text-[#D4AF37] mx-auto opacity-70" />
          <h2 className="font-serif text-2xl font-bold text-white">Captured Moments Offline</h2>
          <p className="text-xs text-emerald-100/70">
            This portal is temporarily disabled. Contact Visriva for your event photos.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
      <Navbar />

      <section className="pt-36 sm:pt-40 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-black/50 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            <span>Captured Moments</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Your <span className="text-[#D4AF37]">event photos</span>
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm font-light leading-relaxed">
            {pageConfig.pageSubtitle}
          </p>
        </div>

        {/* How to get your link */}
        <div className="mb-10 rounded-3xl border border-white/10 bg-black/30 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4 text-[#D4AF37]">
            <ListOrdered className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-widest">How to get your Drive link</h2>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { n: "1", t: "Choose your event", d: "Tap the event name from the list below." },
              { n: "2", t: "Enter the password", d: "Use the password shared by your host / Visriva crew." },
              {
                n: "3",
                t: `Follow @${instagramUsername}`,
                d: "Open Instagram and follow Visriva, then confirm.",
              },
              { n: "4", t: "Open Google Drive", d: "Your album link unlocks on this page instantly." },
            ].map((s) => (
              <li
                key={s.n}
                className="rounded-2xl border border-white/10 bg-[#011F15]/80 px-4 py-4 space-y-1.5"
              >
                <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-[#D4AF37] text-[#011F15] text-xs font-black">
                  {s.n}
                </span>
                <p className="text-sm font-bold text-white">{s.t}</p>
                <p className="text-[11px] text-emerald-100/65 leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>

        <AnimatePresence mode="wait">
          {step === "pick" && (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2 text-white">
                <Camera className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-serif text-xl font-bold">Select your event</h3>
              </div>

              {activeEvents.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-black/40 p-10 text-center space-y-3">
                  <FolderOpen className="w-10 h-10 text-[#D4AF37] mx-auto opacity-80" />
                  <h4 className="font-serif text-lg font-bold">No albums published yet</h4>
                  <p className="text-xs text-emerald-100/70 max-w-sm mx-auto">
                    When Visriva finishes your event, your album will appear here. Check back soon or
                    message the crew.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => handleSelectEvent(event)}
                      className="group text-left rounded-2xl border border-white/15 bg-black/45 hover:border-[#D4AF37]/50 hover:bg-black/60 transition p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                            Event album
                          </p>
                          <h4 className="font-serif text-lg font-bold text-white truncate">
                            {event.displayName}
                          </h4>
                        </div>
                        <Lock className="w-4 h-4 text-white/40 group-hover:text-[#D4AF37] shrink-0 mt-1" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-100/70 font-mono">
                        Password required
                        <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === "password" && selectedEvent && (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="max-w-md mx-auto space-y-5"
            >
              <button
                type="button"
                onClick={resetFlow}
                className="text-xs text-emerald-100/60 hover:text-[#D4AF37] transition"
              >
                ← Back to events
              </button>

              <div className="rounded-3xl border border-[#D4AF37]/30 bg-black/45 p-6 sm:p-8 space-y-5">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                    Step 2 of 4
                  </p>
                  <h3 className="font-serif text-2xl font-bold text-white">{selectedEvent.displayName}</h3>
                  <p className="text-xs text-emerald-100/70">
                    Enter the event password shared by your host.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setPasswordError("");
                      }}
                      placeholder="Event password"
                      autoFocus
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/60 border border-[#D4AF37]/40 text-white font-mono text-sm focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-xs text-rose-300">{passwordError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider hover:scale-[1.02] transition flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {step === "unlocked" && selectedEvent && (
            <motion.div
              key="unlocked"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="max-w-lg mx-auto space-y-5"
            >
              <button
                type="button"
                onClick={resetFlow}
                className="text-xs text-emerald-100/60 hover:text-[#D4AF37] transition"
              >
                ← Choose another event
              </button>

              <div className="rounded-3xl border border-[#D4AF37]/35 bg-black/45 p-6 sm:p-8 space-y-5">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                    {driveReady ? "Album unlocked" : "Almost there"}
                  </p>
                  <h3 className="font-serif text-2xl font-bold text-white">{selectedEvent.displayName}</h3>
                </div>

                {!driveReady ? (
                  <div className="space-y-4">
                    <p className="text-xs text-emerald-100/75 leading-relaxed">
                      Password accepted. Follow{" "}
                      <span className="text-[#D4AF37] font-bold">@{instagramUsername}</span> to unlock
                      your Google Drive album.
                    </p>
                    <button
                      type="button"
                      onClick={() => setGateOpen(true)}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <FaInstagram className="w-5 h-5" />
                      Follow & unlock Drive
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-4">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white">Your Google Drive album is ready</p>
                        <p className="text-[11px] text-emerald-100/70 leading-relaxed">
                          Open it below to view and download photos. Bookmark this page if you need it
                          again during the event.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openDrive}
                      className="w-full py-3.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-sm uppercase tracking-wider hover:scale-[1.02] transition flex items-center justify-center gap-2"
                    >
                      <FolderOpen className="w-5 h-5" />
                      Open Google Drive album
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={copyDriveLink}
                      className="w-full py-3 rounded-xl border border-white/20 text-white text-xs font-bold hover:bg-white/10 transition"
                    >
                      {copied ? "Link copied!" : "Copy Drive link"}
                    </button>

                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-[11px] text-emerald-100/60 hover:text-[#D4AF37] transition"
                    >
                      <FaInstagram className="w-3.5 h-3.5" />
                      @{instagramUsername}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <InstagramGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onUnlock={handleGateUnlock}
        instagramUrl={instagramUrl}
        instagramUsername={instagramUsername}
        eventName={selectedEvent?.displayName}
      />

      <Footer />
    </main>
  );
}

export default function CapturedMomentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#011F15] text-white p-20 text-center font-mono">
          Loading Captured Moments…
        </div>
      }
    >
      <CapturedMomentsContent />
    </Suspense>
  );
}
