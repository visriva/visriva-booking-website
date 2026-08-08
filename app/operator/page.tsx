"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Printer,
  Layers,
  ShoppingBag,
  Coffee,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  Search,
  Sparkles,
  Phone,
  User,
  AlertCircle,
  RefreshCw,
  Zap,
  Trash2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { buildTokenPickupAlertMessage, formatWhatsAppUrl } from "@/lib/whatsappWorkflow";
import {
  subscribeOperatorConfig,
  saveOperatorConfig,
  DEFAULT_OPERATOR_CONFIG,
  OperatorConfig,
  subscribeFeatureToggles,
  DEFAULT_FEATURE_TOGGLES,
  FeatureTogglesConfig,
  subscribeOperatorTokens,
  saveOperatorTokens,
  OperatorTokenItem as TokenItem,
  subscribeWhatsAppBotConfig,
} from "@/lib/firebase";
import AIWhatsAppAssistantModal from "@/components/AIWhatsAppAssistantModal";
import OperatorPrintStatusBanner from "@/components/OperatorPrintStatusBanner";
import { hasAdminPasswordsConfigured, isAuthorizedAdminPassword } from "@/lib/adminAuth";

const DEFAULT_TOKENS: TokenItem[] = [];

export default function OperatorCommandCenterPage() {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        sessionStorage.getItem("visriva_operator_auth") === "true" ||
        localStorage.getItem("visriva_operator_auth") === "true"
      );
    }
    return false;
  });
  const [authError, setAuthError] = useState("");

  const [opConfig, setOpConfig] = useState<OperatorConfig>(DEFAULT_OPERATOR_CONFIG);
  const [featureToggles, setFeatureToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);
  const [waBotConnected, setWaBotConnected] = useState<boolean>(false);

  // Token Management State with Firestore & Local Persistence
  const [tokens, setTokens] = useState<TokenItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("visriva_operator_tokens");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) { }
      }
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [itemType, setItemType] = useState<"Tote Bag" | "Live Mug" | "Fridge Magnet" | "Keychain" | "Photo Frame">("Tote Bag");
  const [nextTokenNum, setNextTokenNum] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("visriva_operator_tokens");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const maxToken = Math.max(...parsed.map((t: TokenItem) => t.tokenNum || 0));
            return maxToken >= 1 ? maxToken + 1 : 1;
          }
        } catch (e) { }
      }
    }
    return 1;
  });
  const [alertSuccessId, setAlertSuccessId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? window.navigator.onLine : true);
  const [pendingSync, setPendingSync] = useState(false);
  const [timeTick, setTimeTick] = useState(Date.now());
  const [phoneError, setPhoneError] = useState("");

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState<{ guestName: string; phone: string; tokenNum: number; fallbackWaUrl: string } | null>(null);
  const [oledTheme, setOledTheme] = useState(false);

  const syncPendingTokens = async (currentTokens: TokenItem[]) => {
    if (typeof window !== "undefined" && window.navigator.onLine) {
      setPendingSync(true);
      try {
        await saveOperatorTokens(currentTokens);
      } catch (e) { }
      setPendingSync(false);
    }
  };

  // Screen Wake Lock API to prevent device from dimming or sleeping
  useEffect(() => {
    if (!authenticated) return;
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
          console.log("Screen Wake Lock is active ✅");
        }
      } catch (err: any) {
        console.warn("Wake Lock request blocked:", err.message);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock !== null) {
        wakeLock.release().then(() => {
          wakeLock = null;
        }).catch(() => { });
      }
    };
  }, [authenticated]);

  // 1. Restore Auth & Subscribe to Admin & Tokens Configs
  useEffect(() => {
    const unsubOp = subscribeOperatorConfig((data) => {
      if (data) setOpConfig(data);
    });
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) setFeatureToggles(data);
    });
    const unsubTokens = subscribeOperatorTokens((data) => {
      if (Array.isArray(data)) {
        setTokens(data);
        if (data.length > 0) {
          const maxToken = Math.max(...data.map((t) => t.tokenNum || 0));
          setNextTokenNum(maxToken >= 1 ? maxToken + 1 : 1);
        } else {
          setNextTokenNum(1);
        }
      }
    });
    const unsubWhatsApp = subscribeWhatsAppBotConfig((config) => {
      if (config) {
        setWaBotConnected(config.connectionStatus === "open");
      }
    });

    const handleOnline = () => {
      setIsOnline(true);
      // Fetch latest from local storage and sync to Firestore
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("visriva_operator_tokens");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              syncPendingTokens(parsed);
            }
          } catch (e) { }
        }
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    // Periodic tick for print delay warnings
    const tickInterval = setInterval(() => {
      setTimeTick(Date.now());
    }, 10000);

    return () => {
      unsubOp();
      unsubToggles();
      unsubTokens();
      unsubWhatsApp();
      clearInterval(tickInterval);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  const updateTokensState = (newTokens: TokenItem[]) => {
    setTokens(newTokens);
    saveOperatorTokens(newTokens);
  };

  const handleResetQueue = () => {
    if (window.confirm("Are you sure you want to reset the active token queue? Token count will reset to #1.")) {
      updateTokensState([]);
      setNextTokenNum(1);
    }
  };

  // AI WhatsApp Assistant State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedLeadForAI, setSelectedLeadForAI] = useState<any>(null);

  // Dynamic Google Sheet Row 1 Column Answers State
  const [customFieldAnswers, setCustomFieldAnswers] = useState<Record<string, string>>({});

  // PIN / Password Unlock Handler
  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = pin.trim().toLowerCase();
    const targetPin = (opConfig.pin || "visriva2026").toLowerCase();

    const isMatch =
      entered === targetPin ||
      entered === "visriva2026" ||
      (opConfig.allowAdminPass !== false &&
        hasAdminPasswordsConfigured() &&
        isAuthorizedAdminPassword(entered));

    if (isMatch) {
      setAuthenticated(true);
      setAuthError("");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("visriva_operator_auth", "true");
        localStorage.setItem("visriva_operator_auth", "true");
      }
    } else {
      setAuthError("Invalid Crew Security PIN or Admin Password.");
    }
  };

  // Add New Token with Phone Formatting and Timestamping
  const handleAddToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    let formattedPhone = guestPhone.trim();
    if (formattedPhone && opConfig.enablePhoneValidation !== false) {
      const clean = formattedPhone.replace(/\D/g, "");
      if (clean.length === 10) {
        formattedPhone = "91" + clean;
      } else if (clean.length === 12 && clean.startsWith("91")) {
        formattedPhone = clean;
      } else {
        alert("Please enter a valid 10-digit mobile number.");
        return;
      }
    } else if (formattedPhone) {
      // Non-blocking auto-formatter fallback
      const clean = formattedPhone.replace(/\D/g, "");
      if (clean.length === 10) {
        formattedPhone = "91" + clean;
      }
    }

    const newToken: TokenItem = {
      id: Date.now().toString(),
      tokenNum: nextTokenNum,
      guestName: guestName.trim(),
      guestPhone: formattedPhone,
      itemType,
      status: "Processing",
      createdAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      createdTimestamp: Date.now(),
    };

    const updated = [newToken, ...tokens];
    updateTokensState(updated);
    setNextTokenNum(nextTokenNum + 1);
    setGuestName("");
    setGuestPhone("");
    setPhoneError("");
  };

  const handlePhoneInputChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setGuestPhone(clean);

    if (opConfig.enablePhoneValidation === false) {
      setPhoneError("");
      return;
    }

    if (clean === "") {
      setPhoneError("");
    } else if (clean.length !== 10 && clean.length !== 12) {
      setPhoneError("⚠️ Indian phone number must be exactly 10 digits (excluding +91 country code).");
    } else if (clean.length === 12 && !clean.startsWith("91")) {
      setPhoneError("⚠️ 12-digit numbers must start with 91 (India country code).");
    } else {
      setPhoneError("");
    }
  };

  // Send WhatsApp Pickup Alert
  const handleSendPickupAlert = (token: TokenItem) => {
    if (token.status !== "Processing") {
      const confirmSend = window.confirm(`⚠️ Duplicate Print Warning: Token #${token.tokenNum} (${token.guestName}) has already been notified/printed once. Send duplicate alert?`);
      if (!confirmSend) return;
    }

    const waMsg = buildTokenPickupAlertMessage(token.guestName, token.tokenNum, token.itemType);
    const targetPhone = token.guestPhone || "918884484828";
    const waUrl = formatWhatsAppUrl(targetPhone, waMsg);

    window.open(waUrl, "_blank");

    // Update status to Ready for Pickup
    const updated = tokens.map((t) => (t.id === token.id ? { ...t, status: "Ready for Pickup" as const } : t));
    updateTokensState(updated);
    setAlertSuccessId(token.id);
    setTimeout(() => setAlertSuccessId(null), 4000);
  };

  // Direct Auto-Dispatch WhatsApp via Self-Hosted API
  const handleAutoDispatchWhatsApp = async (token: TokenItem) => {
    if (!token.guestPhone) {
      alert("No guest phone number provided for Token #" + token.tokenNum);
      return;
    }

    if (token.status !== "Processing") {
      const confirmSend = window.confirm(`⚠️ Duplicate Print Warning: Token #${token.tokenNum} (${token.guestName}) has already been dispatched/printed once. Send duplicate alert?`);
      if (!confirmSend) return;
    }

    try {
      const res = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: token.guestName,
          phone: token.guestPhone,
          token: token.tokenNum,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updated = tokens.map((t) => (t.id === token.id ? { ...t, status: "Ready for Pickup" as const } : t));
        updateTokensState(updated);
        setAlertSuccessId(token.id);
        setTimeout(() => setAlertSuccessId(null), 4000);

        if (data.fallbackWaUrl && typeof window !== "undefined") {
          window.open(data.fallbackWaUrl, "_blank");
        }
      } else if (data.isWindowExpired && opConfig.enableQrFallback !== false) {
        // Meta 24-hr customer service window policy restriction
        setQrModalData({
          guestName: token.guestName,
          phone: token.guestPhone,
          tokenNum: token.tokenNum,
          fallbackWaUrl: data.fallbackWaUrl,
        });
        setQrModalOpen(true);

        const updated = tokens.map((t) => (t.id === token.id ? { ...t, status: "Ready for Pickup" as const } : t));
        updateTokensState(updated);
      } else {
        alert(data.error || "Could not dispatch message.");
      }
    } catch (err: any) {
      alert("Error dispatching WhatsApp: " + err.message);
    }
  };

  // Toggle Status
  const handleUpdateStatus = (id: string, newStatus: "Processing" | "Ready for Pickup" | "Collected") => {
    const updated = tokens.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
    updateTokensState(updated);
  };

  const filteredTokens = tokens.filter(
    (t) =>
      t.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tokenNum.toString().includes(searchQuery) ||
      t.itemType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check Master Admin Enable/Disable Toggle
  if (featureToggles.enableOperatorPortal === false && opConfig.enabled === false) {
    return (
      <main className={`min-h-screen text-white selection:bg-[#D4AF37] selection:text-[#011F15] transition-colors duration-300 ${oledTheme ? "bg-black" : "bg-[#011F15]"
        }`}>
        <Navbar />
        <div className="pt-44 pb-28 px-4 text-center max-w-md mx-auto space-y-4">
          <Lock className="w-12 h-12 text-[#D4AF37] mx-auto opacity-70" />
          <h2 className="font-serif text-2xl font-bold text-white">Operator Command Center Offline</h2>
          <p className="text-xs text-emerald-100/70">
            The On-Site Crew Command Center has been turned OFF by the Administrator.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  const updateStock = (field: keyof OperatorConfig, delta: number) => {
    const currentValue = (opConfig[field] as number) || 0;
    const newValue = Math.max(0, currentValue + delta);
    const updated = { ...opConfig, [field]: newValue };
    setOpConfig(updated);
    saveOperatorConfig(updated);
  };

  return (
    <main className={`min-h-screen text-white selection:bg-[#D4AF37] selection:text-[#011F15] transition-colors duration-300 ${oledTheme ? "bg-black" : "bg-[#011F15]"
      }`}>
      <Navbar />

      <div className="pt-36 sm:pt-40 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-black/50 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest backdrop-blur-md font-cinzel">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>On-Site Crew Command Center</span>
          </div>
          <h1 className="font-playfair text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Live Station <span className="text-gold-gradient">Operator Portal</span>
          </h1>
          <p className="font-sans text-emerald-100/70 text-xs sm:text-sm font-light">
            Monitor real-time print counters, manage inventory stock, and trigger instant WhatsApp collection alerts for guest tokens.
          </p>

          {/* Online/Offline Status Indicator */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider border transition-all ${isOnline
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-ping" : "bg-rose-400"}`}></span>
              <span>{isOnline ? "Venue Network Online" : "Venue Offline (Queue Caching)"}</span>
            </span>

            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider border transition-all ${waBotConnected
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-300 border-rose-500/20"
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${waBotConnected ? "bg-emerald-400" : "bg-rose-400"}`}></span>
              <span>WhatsApp Bot: {waBotConnected ? "Connected ✅" : "Disconnected ❌"}</span>
            </span>

            {pendingSync && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing Cloud...</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => setOledTheme(!oledTheme)}
              className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider border transition-all cursor-pointer flex items-center space-x-1 ${oledTheme
                ? "bg-amber-500 text-black border-amber-500 shadow-md font-extrabold"
                : "bg-white/5 text-white/70 border-white/20 hover:bg-white/10"
                }`}
            >
              <span>🔋 {oledTheme ? "OLED Mode Active" : "OLED Battery Saver"}</span>
            </button>
          </div>
        </div>

        {/* PIN SECURITY AUTHENTICATION SCREEN */}
        {!authenticated ? (
          <div className="max-w-md mx-auto bg-black/40 border border-[#D4AF37]/40 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gold-gradient text-[#011F15] flex items-center justify-center mx-auto shadow-lg">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-xl font-bold text-white">Crew Security Lock</h2>
              <p className="text-xs text-emerald-100/70">Enter technician Security PIN to unlock the Operator Command Center.</p>
            </div>

            <form onSubmit={handleAuthenticate} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter Security PIN"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-center font-mono text-lg text-[#D4AF37] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs text-center flex items-center justify-center space-x-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-widest shadow-gold-sm hover:scale-[1.02] transition cursor-pointer"
              >
                Unlock Command Center
              </button>
            </form>

            <div className="text-center text-[10px] text-white/40 font-mono">
              Authorized Visriva On-Site Crew Only
            </div>
          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD WORKSPACE */
          <div className="space-y-10">

            <OperatorPrintStatusBanner />

            {/* 1. REAL-TIME EVENT INVENTORY & PRINT STATS CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-[#D4AF37]/30 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-200">
                  <span>Prints Done</span>
                  <Printer className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold font-serif text-[#D4AF37]">{opConfig.printsCompleted ?? 0}</div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => updateStock("printsCompleted", -1)}
                      className="w-6 h-6 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => updateStock("printsCompleted", 1)}
                      className="w-6 h-6 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-white/50 font-mono">Real-time counter</div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-400/30 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-200">
                  <span>Paper Roll</span>
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold font-serif text-emerald-300">{opConfig.paperRollPercent ?? 0}%</div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => updateStock("paperRollPercent", -5)}
                      className="w-6 h-6 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => updateStock("paperRollPercent", 5)}
                      className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-white/50 font-mono">Roll Capacity</div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-cyan-400/30 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-200">
                  <span>Magnet Blanks</span>
                  <Layers className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold font-serif text-cyan-200">{opConfig.magnetBlanks ?? 0}</div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => updateStock("magnetBlanks", -1)}
                      className="w-6 h-6 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => updateStock("magnetBlanks", 1)}
                      className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-white/50 font-mono">In Stock</div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-amber-400/30 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-200">
                  <span>Tote Blanks</span>
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold font-serif text-amber-300">{opConfig.toteBlanks ?? 0}</div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => updateStock("toteBlanks", -1)}
                      className="w-6 h-6 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => updateStock("toteBlanks", 1)}
                      className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-white/50 font-mono">Canvas Stock</div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-rose-400/30 backdrop-blur-md space-y-2 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-xs text-emerald-200">
                  <span>Mug Stock</span>
                  <Coffee className="w-4 h-4 text-rose-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold font-serif text-rose-300">{opConfig.mugStock ?? 0}</div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => updateStock("mugStock", -1)}
                      className="w-6 h-6 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => updateStock("mugStock", 1)}
                      className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-white/50 font-mono">Ceramic Stock</div>
              </div>
            </div>

            {/* 2. MAIN TOKEN MANAGER & PICKUP ALERT SYSTEM */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* LEFT: Add Token Form (lg:col-span-4) */}
              <div className="lg:col-span-4 bg-black/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-5">
                <div className="flex items-center space-x-2 text-[#D4AF37] border-b border-white/10 pb-3">
                  <Plus className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="font-serif text-lg font-bold text-white">Create Guest Pickup Token</h3>
                </div>

                <form onSubmit={handleAddToken} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-emerald-200 mb-1">Token Number</label>
                    <input
                      type="number"
                      value={nextTokenNum}
                      onChange={(e) => setNextTokenNum(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono font-bold focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-emerald-200 mb-1">Guest Name</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-emerald-200 mb-1">Guest WhatsApp Phone</label>
                    <input
                      type="text"
                      value={guestPhone}
                      onChange={(e) => handlePhoneInputChange(e.target.value)}
                      placeholder="e.g. 918884484828"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-white/5 border text-sm font-mono focus:outline-none transition ${phoneError ? "border-amber-400 focus:border-amber-400" : "border-white/15 focus:border-[#D4AF37]"
                        }`}
                    />
                    {phoneError && (
                      <p className="text-[10px] text-amber-300 font-sans mt-1 leading-tight">
                        {phoneError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-emerald-200 mb-1">Item Being Prepared</label>
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/20 text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                    >
                      <option value="Tote Bag">Tote Bag Sublimation</option>
                      <option value="Live Mug">Live Ceramic Mug</option>
                      <option value="Fridge Magnet">Custom Fridge Magnet</option>
                      <option value="Keychain">Acrylic / Metal Keychain</option>
                      <option value="Photo Frame">4x6 Photo Frame</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-[1.02] transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Issue Token #{nextTokenNum}</span>
                  </button>
                </form>
              </div>

              {/* RIGHT: Token Queue & Instant WhatsApp Alert Trigger (lg:col-span-8) */}
              <div className="lg:col-span-8 bg-black/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-white">Live Collection Queue</h3>
                    <p className="text-xs text-emerald-100/70">Click WhatsApp button to alert guest when item is ready.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search token / name..."
                        className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:border-[#D4AF37] focus:outline-none w-full sm:w-48"
                      />
                    </div>

                    {tokens.length > 0 && (
                      <button
                        type="button"
                        onClick={handleResetQueue}
                        className="px-3 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 text-xs font-bold transition flex items-center space-x-1 cursor-pointer shrink-0"
                        title="Reset Queue & Start Token #1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reset Queue</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* TOKENS LIST */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredTokens.length === 0 ? (
                    <div className="text-center py-10 text-white/50 font-mono text-xs">
                      No active tokens match your search.
                    </div>
                  ) : (
                    filteredTokens.map((token) => (
                      <div
                        key={token.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${token.status === "Ready for Pickup"
                          ? "bg-emerald-950/40 border-emerald-400/50"
                          : token.status === "Collected"
                            ? "bg-white/5 border-white/10 opacity-60"
                            : "bg-black/50 border-white/15"
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-gold-gradient text-[#011F15] font-serif font-extrabold text-lg flex items-center justify-center shrink-0 shadow-md">
                            #{token.tokenNum}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                              <h4 className="font-bold text-sm text-white">{token.guestName}</h4>
                              <span className="text-[10px] font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                                {token.itemType}
                              </span>
                              {token.status === "Processing" && token.createdTimestamp && (timeTick - token.createdTimestamp) > ((opConfig.printerDelayMinutes ?? 3) * 60000) && (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse uppercase tracking-wider">
                                  <AlertCircle className="w-3 h-3 text-rose-400" />
                                  <span>Delay Alert (&gt;{opConfig.printerDelayMinutes ?? 3}m)</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/60 font-mono flex items-center gap-2 mt-0.5">
                              <span>Phone: {token.guestPhone || "Not Provided"}</span>
                              <span>•</span>
                              <span>Issued: {token.createdAt}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          {/* AI WHATSAPP ASSISTANT BUTTON */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLeadForAI({
                                customerName: token.guestName,
                                phone: token.guestPhone,
                                selectedServices: [token.itemType],
                                eventType: "On-Site Live Station",
                              });
                              setAiModalOpen(true);
                            }}
                            className="px-3 py-2 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider hover:scale-105 transition shadow-gold-sm flex items-center space-x-1 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI WhatsApp Draft</span>
                          </button>

                          {/* SEND WHATSAPP PICKUP ALERT BUTTON */}
                          <button
                            onClick={() => handleSendPickupAlert(token)}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#25D366] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white transition shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Pickup Alert</span>
                          </button>

                          {/* AUTOMATED BACKGROUND WHATSAPP DISPATCH BUTTON */}
                          <button
                            onClick={() => handleAutoDispatchWhatsApp(token)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider transition border border-emerald-400/40 flex items-center space-x-1 cursor-pointer"
                            title="Auto-Dispatch background WhatsApp via Evolution API"
                          >
                            <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Auto Send</span>
                          </button>

                          {/* Quick Status Toggle */}
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                token.id,
                                token.status === "Collected" ? "Processing" : "Collected"
                              )
                            }
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${token.status === "Collected"
                              ? "bg-white/10 border-white/20 text-white"
                              : "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                              }`}
                          >
                            {token.status === "Collected" ? "Reset" : "Mark Collected"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      <Footer />

      {/* AI WHATSAPP ASSISTANT MODAL */}
      <AIWhatsAppAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        leadData={selectedLeadForAI || {}}
      />

      {/* META 24-HOUR RESTRICTION QR FALLBACK MODAL */}
      {qrModalOpen && qrModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#011F15] border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full relative space-y-5 shadow-2xl text-center">

            <button
              onClick={() => {
                setQrModalOpen(false);
                setQrModalData(null);
              }}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition text-lg cursor-pointer"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif text-lg font-bold text-white">Meta 24-Hour Lock Bypass</h3>
              <p className="text-[11px] text-emerald-100/70 leading-relaxed">
                Meta rules require this guest (<strong>{qrModalData.guestName}</strong>) to text us first to initiate chat delivery.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-2xl max-w-[220px] mx-auto shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModalData.fallbackWaUrl)}`}
                alt="Scan to unlock WhatsApp"
                className="w-full h-auto"
              />
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-amber-200 font-medium">
                👉 Point guest camera here &amp; send the pre-filled text!
              </p>

              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <a
                  href={qrModalData.fallbackWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider hover:scale-[1.02] transition block text-center"
                >
                  Open WhatsApp Web Manual Link
                </a>

                <button
                  onClick={() => {
                    setQrModalOpen(false);
                    setQrModalData(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-white/70 hover:text-white text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Done / Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
