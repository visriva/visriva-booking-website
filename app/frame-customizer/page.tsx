"use client";

import React, { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Sparkles,
  Palette,
  Crown,
  Heart,
  Briefcase,
  Camera,
  Download,
  Share2,
  Check,
  Upload,
  ArrowRight,
  RefreshCw,
  Layers,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  subscribeFeatureToggles,
  DEFAULT_FEATURE_TOGGLES,
  FeatureTogglesConfig,
} from "@/lib/firebase";

interface ThemePreset {
  id: string;
  name: string;
  icon: any;
  badgeBg: string;
  borderStyle: string;
  frameBg: string;
  titleColor: string;
  subColor: string;
  accentBorder: string;
  sampleImage: string;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "royal-gold",
    name: "Royal Gold Monogram",
    icon: Crown,
    badgeBg: "bg-[#D4AF37] text-[#011F15]",
    borderStyle: "border-[#D4AF37]",
    frameBg: "bg-[#041a12]",
    titleColor: "text-[#D4AF37]",
    subColor: "text-amber-100",
    accentBorder: "border-[#D4AF37]/60",
    sampleImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "floral-sangeet",
    name: "Floral Sangeet Luxe",
    icon: Heart,
    badgeBg: "bg-rose-400 text-rose-950",
    borderStyle: "border-rose-300",
    frameBg: "bg-[#290a18]",
    titleColor: "text-rose-200",
    subColor: "text-rose-300",
    accentBorder: "border-rose-300/60",
    sampleImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "corporate-summit",
    name: "Corporate Tech Summit",
    icon: Briefcase,
    badgeBg: "bg-cyan-400 text-cyan-950",
    borderStyle: "border-cyan-400",
    frameBg: "bg-[#051829]",
    titleColor: "text-cyan-200",
    subColor: "text-cyan-300",
    accentBorder: "border-cyan-400/60",
    sampleImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "vintage-polaroid",
    name: "Vintage Polaroid Keepsake",
    icon: Camera,
    badgeBg: "bg-amber-200 text-amber-950",
    borderStyle: "border-amber-100",
    frameBg: "bg-[#1c1813]",
    titleColor: "text-amber-100",
    subColor: "text-amber-200",
    accentBorder: "border-amber-200/60",
    sampleImage: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "emerald-velvet",
    name: "Royal Emerald Velvet",
    icon: Sparkles,
    badgeBg: "bg-emerald-400 text-emerald-950",
    borderStyle: "border-emerald-300",
    frameBg: "bg-[#01261a]",
    titleColor: "text-emerald-200",
    subColor: "text-emerald-300",
    accentBorder: "border-emerald-300/60",
    sampleImage: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80",
  },
];

export default function FrameCustomizerPage() {
  const [eventTitle, setEventTitle] = useState("Rahul & Ananya's Wedding");
  const [eventSubtitle, setEventSubtitle] = useState("Sangeet Gala • 14th December 2026");
  const [hashtag, setHashtag] = useState("#RahulWedsAnanya");
  const [selectedThemeId, setSelectedThemeId] = useState("royal-gold");
  const [layoutSize, setLayoutSize] = useState<"4x6" | "2x6" | "3x4">("4x6");
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [featureToggles, setFeatureToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);

  useEffect(() => {
    const unsub = subscribeFeatureToggles((data) => {
      if (data) setFeatureToggles(data);
    });
    return () => unsub();
  }, []);

  const previewRef = useRef<HTMLDivElement>(null);

  const activeTheme = THEME_PRESETS.find((t) => t.id === selectedThemeId) || THEME_PRESETS[0];
  const activePhoto = userPhotoUrl || activeTheme.sampleImage;

  if (featureToggles.enableFrameCustomizer === false) {
    return (
      <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
        <Navbar />
        <div className="pt-44 pb-28 px-4 text-center max-w-md mx-auto space-y-4">
          <Lock className="w-12 h-12 text-[#D4AF37] mx-auto opacity-70" />
          <h2 className="font-serif text-2xl font-bold text-white">Print Frame Customizer Offline</h2>
          <p className="text-xs text-emerald-100/70">
            The Print Frame Customizer is currently turned OFF by the Administrator.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCustomLogoUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Sample Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUserPhotoUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Download Canvas Mockup as PNG
  const handleDownloadProof = async () => {
    setDownloading(true);
    setDownloadSuccess(false);

    try {
      // Create offscreen canvas for high-res PNG export
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = layoutSize === "2x6" ? 600 : 1200;
      canvas.height = 1800;

      // Fill Frame Background
      ctx.fillStyle = activeTheme.id === "royal-gold" ? "#041a12" : activeTheme.id === "floral-sangeet" ? "#290a18" : "#051829";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Gold/Accent Border Frame
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 16;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Load & Draw Photo
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = activePhoto;

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      const photoY = 80;
      const photoH = canvas.height - 380;
      ctx.drawImage(img, 60, photoY, canvas.width - 120, photoH);

      // Draw Header Text Block at bottom
      ctx.fillStyle = "#D4AF37";
      ctx.textAlign = "center";
      ctx.font = "bold 48px serif";
      ctx.fillText(eventTitle, canvas.width / 2, canvas.height - 220);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "28px sans-serif";
      ctx.fillText(eventSubtitle, canvas.width / 2, canvas.height - 160);

      if (hashtag) {
        ctx.fillStyle = "#D4AF37";
        ctx.font = "italic 26px sans-serif";
        ctx.fillText(hashtag, canvas.width / 2, canvas.height - 110);
      }

      // Convert to PNG download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Visriva-Print-Frame-Proof-${eventTitle.replace(/[^a-zA-Z0-9]/g, "-")}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setDownloading(false);
    }
  };

  // WhatsApp Share Direct Inquiry
  const handleWhatsAppInquiry = () => {
    const waMsg = encodeURIComponent(
      `Hello Visriva! I created a custom print frame design proof on your portal:\n\n` +
      `📌 *Event Title:* ${eventTitle}\n` +
      `📅 *Date & Subtitle:* ${eventSubtitle}\n` +
      `🏷️ *Hashtag:* ${hashtag}\n` +
      `🎨 *Selected Theme:* ${activeTheme.name}\n` +
      `📐 *Format:* ${layoutSize}\n\n` +
      `I would like to inquire about booking this station setup!`
    );
    window.open(`https://wa.me/918884484828?text=${waMsg}`, "_blank");
  };

  return (
    <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15] overflow-x-hidden">
      <Navbar />

      <section className="pt-36 sm:pt-40 pb-24 relative overflow-hidden">
        {/* Background Halos */}
        <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.18)_0%,_transparent_70%)] blur-[100px] pointer-events-none z-0" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black/50 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest backdrop-blur-md font-cinzel">
              <Palette className="w-4 h-4 text-[#D4AF37]" />
              <span>Visriva Live Studio • Print Frame Customizer</span>
            </div>
            <h1 className="font-playfair text-4xl sm:text-6xl font-bold text-white tracking-tight">
              Design Your <span className="text-gold-gradient">Event Print Overlay</span>
            </h1>
            <p className="font-sans text-emerald-100/80 text-sm sm:text-base font-light leading-relaxed">
              Customize your couple names, wedding hashtag, and print border in real-time. Instantly download a high-res PNG design proof for your event photo booth.
            </p>
          </div>

          {/* MAIN TWO-COLUMN STUDIO WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* LEFT COLUMN: Controls & Theme Selectors (lg:col-span-6) */}
            <div className="lg:col-span-6 space-y-8 bg-black/40 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
              
              {/* 1. Event Details Inputs */}
              <div className="space-y-4 border-b border-white/10 pb-6">
                <h3 className="font-serif text-lg font-bold text-[#D4AF37] uppercase tracking-wider flex items-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span>1. Event Branding &amp; Typography</span>
                </h3>

                <div>
                  <label className="block text-xs font-mono text-emerald-200/90 mb-1.5">Event Title / Couple Names</label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="e.g. Rahul & Ananya's Wedding"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white font-serif text-lg focus:border-[#D4AF37] focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-emerald-200/90 mb-1.5">Date &amp; Subtitle</label>
                    <input
                      type="text"
                      value={eventSubtitle}
                      onChange={(e) => setEventSubtitle(e.target.value)}
                      placeholder="e.g. 14th Dec 2026 • Taj West End"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-emerald-200/90 mb-1.5">Event Hashtag</label>
                    <input
                      type="text"
                      value={hashtag}
                      onChange={(e) => setHashtag(e.target.value)}
                      placeholder="e.g. #RahulWedsAnanya"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-[#D4AF37] font-semibold text-sm focus:border-[#D4AF37] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Theme Presets Selection */}
              <div className="space-y-4 border-b border-white/10 pb-6">
                <h3 className="font-serif text-lg font-bold text-[#D4AF37] uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>2. Select Border &amp; Theme Preset</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {THEME_PRESETS.map((theme) => {
                    const isSelected = selectedThemeId === theme.id;
                    const Icon = theme.icon;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedThemeId(theme.id)}
                        className={`p-3 rounded-2xl border text-left flex flex-col items-start justify-between transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-[1.03]"
                            : "bg-white/5 border-white/10 text-white hover:border-[#D4AF37]/40 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-[#D4AF37]">
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />}
                        </div>
                        <span className="text-xs font-bold font-serif leading-tight">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Layout Format Selector */}
              <div className="space-y-4 border-b border-white/10 pb-6">
                <h3 className="font-serif text-lg font-bold text-[#D4AF37] uppercase tracking-wider flex items-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>3. Print Aspect Ratio</span>
                </h3>

                <div className="flex items-center space-x-3">
                  {[
                    { id: "4x6", label: "4×6 Classic Portrait" },
                    { id: "2x6", label: "2×6 Photo Strip" },
                    { id: "3x4", label: "3×4 Compact Square" },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => setLayoutSize(sz.id as any)}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        layoutSize === sz.id
                          ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-gold-sm"
                          : "bg-white/5 border-white/15 text-white hover:border-[#D4AF37]/50"
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Upload Custom Sample Photo or Logo */}
              <div className="space-y-3">
                <h3 className="font-serif text-lg font-bold text-[#D4AF37] uppercase tracking-wider flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>4. Upload Test Photo / Monogram</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="p-3 rounded-xl bg-white/5 border border-dashed border-white/20 hover:border-[#D4AF37] text-center cursor-pointer block transition-colors">
                    <span className="text-xs font-semibold text-emerald-200 block">📷 Upload Test Photo</span>
                    <span className="text-[10px] text-white/50 block mt-0.5">JPG / PNG format</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>

                  <label className="p-3 rounded-xl bg-white/5 border border-dashed border-white/20 hover:border-[#D4AF37] text-center cursor-pointer block transition-colors">
                    <span className="text-xs font-semibold text-emerald-200 block">✨ Upload Logo / Monogram</span>
                    <span className="text-[10px] text-white/50 block mt-0.5">Transparent PNG</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Interactive High-Res Preview Canvas (lg:col-span-6) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-6">
              
              {/* CANVAS MOCKUP FRAME */}
              <div
                ref={previewRef}
                className={`relative w-full ${
                  layoutSize === "2x6" ? "max-w-[280px] aspect-[1/3]" : "max-w-[380px] aspect-[2/3]"
                } rounded-3xl p-5 border-4 ${activeTheme.borderStyle} ${activeTheme.frameBg} shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col justify-between overflow-hidden transition-all duration-500`}
              >
                {/* Gold Foil Accent Corners */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37]" />
                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#D4AF37]" />
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#D4AF37]" />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37]" />

                {/* Main Photo Area */}
                <div className="relative flex-1 w-full rounded-2xl overflow-hidden border border-white/20 bg-black/60 shadow-inner group">
                  <img
                    src={activePhoto}
                    alt="Custom Print Preview"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Watermark/Logo Overlay if uploaded */}
                  {customLogoUrl && (
                    <img
                      src={customLogoUrl}
                      alt="Client Monogram"
                      className="absolute top-4 right-4 w-14 h-14 object-contain drop-shadow-md"
                    />
                  )}

                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[10px] font-mono text-[#D4AF37]">
                    Visriva 8-Sec Dye-Sub Print
                  </div>
                </div>

                {/* Bottom Frame Branding & Typography */}
                <div className="pt-4 text-center space-y-1 z-10">
                  <h2 className={`font-serif text-xl sm:text-2xl font-bold ${activeTheme.titleColor} leading-tight drop-shadow-md`}>
                    {eventTitle || "Your Event Title"}
                  </h2>
                  <p className={`text-xs ${activeTheme.subColor} font-sans font-medium`}>
                    {eventSubtitle || "Event Date & Venue"}
                  </p>
                  {hashtag && (
                    <p className="text-[11px] font-mono text-[#D4AF37] font-semibold tracking-wider pt-0.5">
                      {hashtag}
                    </p>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS (Download Proof & WhatsApp Inquiry) */}
              <div className="w-full max-w-[380px] space-y-3">
                <button
                  onClick={handleDownloadProof}
                  disabled={downloading}
                  className="w-full py-4 px-6 rounded-2xl bg-gold-gradient text-[#011F15] font-extrabold text-sm uppercase tracking-widest shadow-gold-lg hover:shadow-gold-md hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-5 h-5 text-[#011F15]" />
                  <span>{downloading ? "Generating High-Res PNG..." : "Download Design Proof (PNG)"}</span>
                </button>

                {downloadSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center space-x-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>High-Res Print Proof Saved to Downloads!</span>
                  </div>
                )}

                <button
                  onClick={handleWhatsAppInquiry}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] text-black font-extrabold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Inquire Station via WhatsApp</span>
                </button>

                <div className="text-center pt-2">
                  <Link
                    href="/#booking-engine"
                    className="inline-flex items-center space-x-1.5 text-xs text-[#D4AF37] hover:underline font-semibold"
                  >
                    <span>Proceed to Book Station with this Design</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
