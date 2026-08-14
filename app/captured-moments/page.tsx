"use client";

import React, { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InstagramGateModal from "@/components/InstagramGateModal";
import {
  Sparkles,
  Download,
  Search,
  X,
  Lock,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FolderOpen,
  ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  subscribeGalleries,
  GalleryItem,
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

function CapturedMomentsContent() {
  const [eventCodeInput, setEventCodeInput] = useState("");
  const [activeEventCode, setActiveEventCode] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [firestoreItems, setFirestoreItems] = useState<GalleryItem[]>([]);
  const [capturedEvents, setCapturedEvents] = useState<CapturedMomentEvent[]>([]);
  const [pageConfig, setPageConfig] = useState<CapturedMomentsPageConfig>(DEFAULT_CAPTURED_MOMENTS_PAGE_CONFIG);
  const [contact, setContact] = useState<GlobalSettingsConfig>(DEFAULT_GLOBAL_SETTINGS);
  const [featureToggles, setFeatureToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [igUnlocked, setIgUnlocked] = useState(false);
  const [pendingAction, setPendingAction] = useState<"download" | "drive" | null>(null);

  useEffect(() => {
    setIgUnlocked(hasInstagramUnlock());
    const unsubGalleries = subscribeGalleries(setFirestoreItems);
    const unsubEvents = subscribeCapturedMoments(setCapturedEvents);
    const unsubPage = subscribeCapturedMomentsPageConfig(setPageConfig);
    const unsubContact = subscribeGlobalContactSettings((data) => {
      if (data) setContact(data);
    });
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) setFeatureToggles(data);
    });
    return () => {
      unsubGalleries();
      unsubEvents();
      unsubPage();
      unsubContact();
      unsubToggles();
    };
  }, []);

  const instagramUrl =
    contact.instagramUrl || `https://instagram.com/${pageConfig.instagramUsername}`;
  const instagramUsername = pageConfig.instagramUsername || "visriva.co";

  const activeEvent = capturedEvents.find(
    (e) => e.isActive && e.eventCode.toLowerCase() === activeEventCode.toLowerCase()
  );

  const filteredPhotos = firestoreItems.filter((item) => {
    if (!activeEventCode) return false;
    const code = item.eventCode?.toLowerCase() || "";
    const tagMatch = item.tagline?.toLowerCase().includes(activeEventCode.toLowerCase());
    return code === activeEventCode.toLowerCase() || tagMatch;
  });

  const requireGate = (action: "download" | "drive") => {
    if (!pageConfig.instagramGateEnabled || igUnlocked) {
      return true;
    }
    setPendingAction(action);
    setGateOpen(true);
    return false;
  };

  const handleGateUnlock = () => {
    setInstagramUnlock();
    setIgUnlocked(true);
    if (pendingAction === "download" && selectedPhoto) {
      performDownload(selectedPhoto.url);
    } else if (pendingAction === "drive" && activeEvent?.googleDriveUrl) {
      window.open(activeEvent.googleDriveUrl, "_blank", "noopener,noreferrer");
    }
    setPendingAction(null);
  };

  const performDownload = (photoUrl: string) => {
    const link = document.createElement("a");
    link.href = photoUrl;
    link.download = `Visriva-Captured-Moment-${Date.now()}.jpg`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleDownload = (photoUrl: string) => {
    if (!requireGate("download")) return;
    performDownload(photoUrl);
  };

  const handleOpenDrive = () => {
    if (!activeEvent?.googleDriveUrl) return;
    if (!requireGate("drive")) return;
    window.open(activeEvent.googleDriveUrl, "_blank", "noopener,noreferrer");
  };

  const handleSearchEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveEventCode(eventCodeInput.trim().toLowerCase());
    setSelectedPhoto(null);
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

      <section className="pt-36 sm:pt-40 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-black/50 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest backdrop-blur-md font-cinzel">
            <Sparkles className="w-4 h-4" />
            <span>Captured Moments</span>
          </div>
          <h1 className="font-playfair text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Your <span className="text-gold-gradient">Event Memories</span>
          </h1>
          <p className="font-sans text-emerald-100/80 text-xs sm:text-sm font-light leading-relaxed">
            {pageConfig.pageSubtitle}
          </p>

          <form onSubmit={handleSearchEvent} className="flex items-center justify-center max-w-md mx-auto pt-3">
            <div className="relative w-full">
              <input
                type="text"
                value={eventCodeInput}
                onChange={(e) => setEventCodeInput(e.target.value)}
                placeholder="Enter event PIN / hashtag..."
                className="w-full pl-4 pr-12 py-3 rounded-full bg-black/60 border border-[#D4AF37]/50 text-white font-mono text-sm focus:border-[#D4AF37] focus:outline-none shadow-2xl"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gold-gradient text-[#011F15] flex items-center justify-center shadow-md hover:scale-105 transition cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {pageConfig.instagramGateEnabled && !igUnlocked && (
            <p className="text-[11px] text-[#D4AF37]/90 font-mono">
              Follow @{instagramUsername} on Instagram to unlock downloads
            </p>
          )}
        </div>

        {!activeEventCode ? (
          <div className="glass-card p-10 rounded-3xl border border-white/10 max-w-lg mx-auto text-center space-y-3">
            <ImageIcon className="w-10 h-10 text-[#D4AF37] mx-auto opacity-80" />
            <h3 className="font-serif text-lg font-bold text-white">Search your event</h3>
            <p className="text-xs text-emerald-100/70">
              Enter the PIN or hashtag shared at your event to view photos and download links.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeEvent && (
              <div className="glass-card rounded-2xl border border-[#D4AF37]/30 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold font-mono">
                    Event album
                  </p>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                    {activeEvent.displayName}
                  </h2>
                  <p className="text-xs text-emerald-100/60 font-mono">PIN: {activeEvent.eventCode}</p>
                </div>
                {activeEvent.googleDriveUrl && (
                  <button
                    type="button"
                    onClick={handleOpenDrive}
                    className="px-5 py-3 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition flex items-center gap-2"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Open Google Drive Album
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPhotos.length === 0 ? (
                <div className="col-span-full py-16 text-center space-y-3 glass-card p-8 rounded-3xl border border-white/10 max-w-md mx-auto">
                  <Lock className="w-10 h-10 text-[#D4AF37] mx-auto opacity-80" />
                  <h3 className="font-serif text-lg text-white font-bold">
                    No previews for &quot;{activeEventCode}&quot;
                  </h3>
                  <p className="text-emerald-100/70 text-xs leading-relaxed">
                    {activeEvent?.googleDriveUrl
                      ? "Photos may be in the Google Drive album above. Upload previews in Admin → Gallery Manager."
                      : "Ask your event host for the correct PIN, or check Admin → Captured Moments for the Drive link."}
                  </p>
                </div>
              ) : (
                filteredPhotos.map((photo) => (
                  <motion.div
                    key={photo.id}
                    whileHover={{ scale: 1.03, y: -4 }}
                    className="group relative rounded-2xl overflow-hidden border border-white/15 bg-black/50 shadow-xl cursor-pointer aspect-[3/4]"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.tagline || "Captured moment"}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-left space-y-1">
                      <span className="text-[9px] font-mono text-[#D4AF37] uppercase bg-black/60 px-2 py-0.5 rounded border border-[#D4AF37]/30 inline-block">
                        Captured Moment
                      </span>
                      <h4 className="font-serif text-sm font-bold text-white line-clamp-1">
                        {photo.tagline || "Event capture"}
                      </h4>
                      <div className="text-[10px] text-emerald-200/80 font-mono flex items-center space-x-1">
                        <span>Tap to download</span>
                        <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
          >
            <div className="relative max-w-4xl w-full bg-[#041a12] border-2 border-[#D4AF37]/50 rounded-3xl p-6 shadow-2xl space-y-6">
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="max-h-[60vh] rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center bg-black/60">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.tagline || "Photo"}
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              <div className="text-center space-y-3">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  {selectedPhoto.tagline || "Visriva Captured Moment"}
                </h3>
                <button
                  type="button"
                  onClick={() => handleDownload(selectedPhoto.url)}
                  className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition flex items-center space-x-1.5 mx-auto"
                >
                  <Download className="w-4 h-4" />
                  <span>Download high-res</span>
                </button>
                {downloadSuccess && (
                  <div className="text-xs text-emerald-300 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Saved to your device!</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InstagramGateModal
        open={gateOpen}
        onClose={() => {
          setGateOpen(false);
          setPendingAction(null);
        }}
        onUnlock={handleGateUnlock}
        instagramUrl={instagramUrl}
        instagramUsername={instagramUsername}
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
