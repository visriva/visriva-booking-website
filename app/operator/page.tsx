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
} from "@/lib/firebase";
import AIWhatsAppAssistantModal from "@/components/AIWhatsAppAssistantModal";

const AUTHORIZED_ADMIN_PASSWORDS = ["jeevan", "drupitha", "punith", "arpitha", "4848", "0315"];

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

  // Token Management State with Firestore & Local Persistence
  const [tokens, setTokens] = useState<TokenItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("visriva_operator_tokens");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
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
        } catch (e) {}
      }
    }
    return 1;
  });
  const [alertSuccessId, setAlertSuccessId] = useState<string | null>(null);

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

    return () => {
      unsubOp();
      unsubToggles();
      unsubTokens();
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
      (opConfig.allowAdminPass !== false && AUTHORIZED_ADMIN_PASSWORDS.includes(entered));

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

  // Add New Token
  const handleAddToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    const newToken: TokenItem = {
      id: Date.now().toString(),
      tokenNum: nextTokenNum,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      itemType,
      status: "Processing",
      createdAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [newToken, ...tokens];
    updateTokensState(updated);
    setNextTokenNum(nextTokenNum + 1);
    setGuestName("");
    setGuestPhone("");
  };

  // Send WhatsApp Pickup Alert
  const handleSendPickupAlert = (token: TokenItem) => {
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
      <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
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
    <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
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
            
            {/* 1. REAL-TIME EVENT INVENTORY & PRINT STATS CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-[#D4AF37]/30 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-200">
                  <span>Prints Done</span>
                  <Printer className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold font-serif text-[#D4AF37]">{printsCompleted}</div>
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
                  <div className="text-2xl font-bold font-serif text-emerald-300">{paperRollPercent}%</div>
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
                  <div className="text-2xl font-bold font-serif text-cyan-200">{magnetBlanks}</div>
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
                  <div className="text-2xl font-bold font-serif text-amber-300">{toteBlanks}</div>
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
                  <div className="text-2xl font-bold font-serif text-rose-300">{mugStock}</div>
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
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="e.g. 918884484828"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm font-mono focus:border-[#D4AF37] focus:outline-none"
                    />
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
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          token.status === "Ready for Pickup"
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
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-sm text-white">{token.guestName}</h4>
                              <span className="text-[10px] font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                                {token.itemType}
                              </span>
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
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                              token.status === "Collected"
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
    </main>
  );
}
