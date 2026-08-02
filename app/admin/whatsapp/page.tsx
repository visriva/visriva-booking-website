"use client";

import React, { useState, useEffect } from "react";
import { QrCode, RefreshCw, Power, ShieldCheck, Check, AlertCircle, MessageSquare, Save, Link2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { subscribeWhatsAppBotConfig, saveWhatsAppBotConfig, WhatsAppBotConfig } from "@/lib/firebase";

export default function WhatsAppAdminPage() {
  const [botConfig, setBotConfig] = useState<WhatsAppBotConfig | null>(null);
  const [waLinkStatus, setWaLinkStatus] = useState<string>("checking");
  const [waLinkQr, setWaLinkQr] = useState<string>("");
  const [waLinkLoading, setWaLinkLoading] = useState<boolean>(false);
  const [botActive, setBotActive] = useState<boolean>(false);
  const [autoReplyText, setAutoReplyText] = useState<string>("");
  const [uiError, setUiError] = useState<string>("");
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  
  const [successToast, setSuccessToast] = useState<string>("");
  const [errorToast, setErrorToast] = useState<string>("");

  const triggerToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(""), 6000);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(""), 4000);
    }
  };

  // 1. Subscribe to Real-Time WhatsApp Bot Configuration from Firestore
  useEffect(() => {
    const unsubscribe = subscribeWhatsAppBotConfig((config) => {
      setBotConfig(config);
      setAutoReplyText(config.autoReplyText);
      setBotActive(config.isActive);
      if (config.connectionStatus) {
        setWaLinkStatus(config.connectionStatus === "open" ? "connected" : config.connectionStatus === "connecting" ? "checking" : "disconnected");
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch status of instance from backend proxy (which also updates Firestore)
  const checkStatus = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setWaLinkLoading(true);
    setUiError("");
    console.log("🚀 Checking status at /api/whatsapp/connect?action=status...");
    try {
      const res = await fetch("/api/whatsapp/connect?action=status");
      console.log("📥 Check Status Response code:", res.status);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      console.log("📦 Status data received:", data);
      if (data.status === "connected") {
        setWaLinkStatus("connected");
        setWaLinkQr("");
      } else {
        setWaLinkStatus("disconnected");
      }
    } catch (err: any) {
      console.error("FRONTEND CHECK STATUS FAILED:", err);
      setWaLinkStatus("disconnected");
      const msg = err?.message || String(err);
      triggerToast(`Failed to load connection status: ${msg}`, true);
    } finally {
      setWaLinkLoading(false);
    }
  };

  // 3. Connect to instance to generate base64 QR Code
  const connectInstance = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setWaLinkLoading(true);
    setWaLinkQr("");
    setUiError("");

    console.log("Sending request to /api/whatsapp/connect...");

    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      console.log("📥 Connect Response HTTP Status:", res.status, res.statusText);

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Connect HTTP Error text:", text);
        throw new Error(`Connection failed (${res.status}): ${text.slice(0, 150)}`);
      }

      const data = await res.json();
      console.log("📦 Received response JSON:", data);

      const qrData = data.base64 || data.qrcode?.base64 || (typeof data.qrcode === "string" ? data.qrcode : "");

      if (data.connected === true || data.status === "connected" || data.instance?.state === "open" || data.state === "open") {
        setWaLinkStatus("connected");
        setWaLinkQr("");
        triggerToast("🟢 WhatsApp is already connected!");
      } else if (qrData) {
        const cleanedQr = typeof qrData === "string" ? qrData.replace(/^data:image\/[a-z]+;base64,/, "") : qrData;
        setWaLinkQr(cleanedQr);
        setWaLinkStatus("qr_ready");
        triggerToast("✅ Scan the QR code below to connect your device!");
      } else {
        throw new Error("No QR code returned from Evolution API.");
      }
    } catch (error: any) {
      console.error("FRONTEND FETCH FAILED:", error);
      const msg = error?.message || String(error);
      setUiError(msg);
      triggerToast(`QR Code Generation failed: ${msg}`, true);
      setWaLinkStatus("disconnected");
    } finally {
      setWaLinkLoading(false);
    }
  };

  // 4. Toggle Bot Active State (updates Firestore WhatsApp document)
  const toggleBot = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const newState = !botActive;
    setBotActive(newState);
    try {
      await saveWhatsAppBotConfig({ isActive: newState });
      triggerToast(newState ? "🤖 Auto-Responder Bot is now ACTIVE!" : "🛑 Auto-Responder Bot is now DEACTIVATED!");
    } catch (err: any) {
      console.error(err);
      triggerToast("Failed to save bot settings.", true);
    }
  };

  // 5. Save Auto-Reply Message Text to Database
  const saveAutoReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveLoading(true);
    try {
      await saveWhatsAppBotConfig({ autoReplyText });
      triggerToast("💾 Auto-reply message updated successfully!");
    } catch (err: any) {
      console.error(err);
      triggerToast("Failed to save auto-reply text.", true);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15] flex flex-col">
      <Navbar />

      {/* Floating Success & Error Toasts */}
      {successToast && (
        <div className="fixed top-24 right-6 z-50 px-6 py-3.5 rounded-xl bg-[#D4AF37] text-[#011F15] font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center space-x-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}
      {errorToast && (
        <div className="fixed top-24 right-6 z-50 px-6 py-3.5 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center space-x-2 animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>{errorToast}</span>
        </div>
      )}

      <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            WhatsApp <span className="text-gold-gradient">Control Panel</span>
          </h1>
          <p className="text-sm text-emerald-100/60 max-w-xl mx-auto font-sans">
            Centralized hub to check connection status, pair devices, and configure the automated CRM auto-replies.
          </p>
        </div>

        {/* Live Badging & Master Toggle Control Panel */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 bg-white/5 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-1.5">
              <span className="text-xs font-bold font-mono text-[#D4AF37] uppercase tracking-wider">Bot Automation Core</span>
              <h3 className="font-serif text-2xl font-bold">24/7 Service Controller</h3>
            </div>
            
            {/* Master Toggle Button */}
            <button
              type="button"
              onClick={(e) => toggleBot(e)}
              className={`flex items-center space-x-3 px-6 py-3.5 rounded-full border transition-all cursor-pointer ${
                botActive 
                  ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/40 font-bold" 
                  : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
              }`}
            >
              <Power className={`w-4 h-4 ${botActive ? "text-emerald-400" : "text-white/40"}`} />
              <span className="text-xs font-bold uppercase tracking-wider">{botActive ? "Master Bot Active" : "Master Bot Inactive"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs text-white/50 block">Live Connection Status:</span>
                <div className="flex items-center space-x-2 pt-1">
                  {waLinkStatus === "checking" && (
                    <span className="px-4 py-1.5 rounded-full bg-white/5 text-white/70 border border-white/10 text-xs font-bold uppercase tracking-wider animate-pulse">Checking status...</span>
                  )}
                  {waLinkStatus === "disconnected" && (
                    <span className="px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider">Disconnected ❌</span>
                  )}
                  {waLinkStatus === "qr_ready" && (
                    <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold uppercase tracking-wider">QR Code Ready</span>
                  )}
                  {waLinkStatus === "connected" && (
                    <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">Connected &amp; Sync Active ✅</span>
                  )}
                </div>
              </div>

              {botConfig?.lastSyncedAt && (
                <div className="text-[11px] text-white/40 font-mono">
                  Last Checked: {new Date(botConfig.lastSyncedAt).toLocaleString()}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => connectInstance(e)}
                  disabled={waLinkLoading}
                  className="flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-gold-gradient text-[#011F15] hover:shadow-gold-md font-extrabold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{waLinkStatus === "connected" ? "Reconnect / Re-Link" : "Generate QR Code"}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => checkStatus(e)}
                  disabled={waLinkLoading}
                  className="flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-white/5 text-white border border-white/10 hover:bg-white/10 font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${waLinkLoading ? "animate-spin" : ""}`} />
                  <span>Force Sync</span>
                </button>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/10 relative min-h-[220px]">
              {uiError && (
                <div className="p-4 mb-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs text-center font-mono max-w-sm break-words">
                  <p className="font-bold mb-1">⚠️ Connection Error Details:</p>
                  {uiError}
                </div>
              )}

              {waLinkLoading && !waLinkQr && (
                <div className="flex flex-col items-center space-y-3">
                  <RefreshCw className="w-10 h-10 text-[#D4AF37] animate-spin" />
                  <span className="text-xs text-white/50 font-mono">Querying Instance...</span>
                </div>
              )}
              
              {!waLinkLoading && !waLinkQr && !uiError && waLinkStatus !== "connected" && (
                <div className="text-center space-y-2 py-4">
                  <Link2 className="w-10 h-10 text-white/20 mx-auto" />
                  <p className="text-xs text-white/40">Click "Generate QR Code" to retrieve authorization token</p>
                </div>
              )}

              {waLinkQr && waLinkStatus === "qr_ready" && (
                <div className="space-y-3 text-center">
                  <div className="bg-white p-3 rounded-xl inline-block shadow-lg border border-[#D4AF37]">
                    <img src={`data:image/png;base64,${waLinkQr}`} alt="WhatsApp QR Code" className="mx-auto rounded-lg w-40 h-40" />
                  </div>
                  <p className="text-[10px] text-[#D4AF37] font-mono animate-pulse">⚠️ Code updates every 20 seconds. Scan immediately.</p>
                </div>
              )}

              {waLinkStatus === "connected" && (
                <div className="text-center space-y-3 py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-emerald-500/20 shadow-md">
                    <ShieldCheck className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h4 className="font-serif text-base font-bold text-white">Bot Link Established</h4>
                  <p className="text-[11px] text-emerald-100/60 max-w-[220px]">WhatsApp session is authenticated. CRM hooks are ready to process messages.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editable Message Box Card */}
        <form onSubmit={saveAutoReply} className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 bg-white/5 shadow-2xl space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-[#D4AF37]">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs font-bold font-mono uppercase tracking-wider">AI Responder Content</span>
            </div>
            <h4 className="font-serif text-xl font-bold text-white">Auto-Reply Text Template</h4>
            <p className="text-xs text-emerald-100/60">
              Customize the message that will be dispatched to incoming event texts when the Master Bot is active.
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              value={autoReplyText}
              onChange={(e) => setAutoReplyText(e.target.value)}
              placeholder="Enter WhatsApp response template..."
              rows={4}
              maxLength={400}
              className="w-full rounded-xl bg-black/40 border border-white/10 p-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition font-sans placeholder-white/30"
              required
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/30 font-mono">Maximum 400 characters</span>
              <button
                type="submit"
                disabled={saveLoading || !autoReplyText.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gold-gradient text-[#011F15] hover:shadow-gold-md font-extrabold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveLoading ? "Saving..." : "Save Auto-Reply"}</span>
              </button>
            </div>
          </div>
        </form>

      </div>

      <Footer />
    </main>
  );
}
