"use client";

import React, { useState, useEffect } from "react";
import { QrCode, RefreshCw, Power, ShieldCheck, Check, AlertCircle, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function WhatsAppAdminPage() {
  const [waLinkStatus, setWaLinkStatus] = useState<string>("checking");
  const [waLinkQr, setWaLinkQr] = useState<string>("");
  const [waLinkLoading, setWaLinkLoading] = useState<boolean>(false);
  const [botActive, setBotActive] = useState<boolean>(false);
  const [uiError, setUiError] = useState<string>("");
  
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

  // 1. Fetch status of instance from backend proxy
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

  // 2. Load bot toggle status and current connection status on mount
  useEffect(() => {
    checkStatus();
    try {
      const saved = localStorage.getItem("whatsapp_bot_active") === "true";
      setBotActive(saved);
    } catch (e) {}
  }, []);

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

      if (qrData) {
        const cleanedQr = typeof qrData === "string" ? qrData.replace(/^data:image\/[a-z]+;base64,/, "") : qrData;
        setWaLinkQr(cleanedQr);
        setWaLinkStatus("qr_ready");
        triggerToast("✅ Scan the QR code below to connect your device!");
      } else if (data.status === "connected" || data.instance?.state === "open") {
        setWaLinkStatus("connected");
        setWaLinkQr("");
        triggerToast("🟢 WhatsApp is already connected!");
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

  // 4. Toggle Bot Active State
  const toggleBot = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const newState = !botActive;
    setBotActive(newState);
    try {
      localStorage.setItem("whatsapp_bot_active", String(newState));
      await fetch("/api/whatsapp/webhook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botActive: newState })
      });
      triggerToast(newState ? "🤖 Auto-Responder Bot is now ACTIVE!" : "🛑 Auto-Responder Bot is now DEACTIVATED!");
    } catch (err: any) {
      triggerToast("Failed to save bot settings.", true);
    }
  };

  return (
    <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15] flex flex-col">
      <Navbar />

      {/* Floating Success & Error Toasts */}
      {successToast && (
        <div className="fixed top-24 right-6 z-50 px-6 py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center space-x-2 animate-bounce">
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
            WhatsApp <span className="text-gold-gradient">Bot Linker</span> &amp; CRM
          </h1>
          <p className="text-sm text-emerald-100/60 max-w-xl mx-auto">
            Scan the QR code to pair your phone. This enables the auto-responder bot and pushes client interactions directly to the Visriva CRM.
          </p>
        </div>

        {/* Status Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 bg-white/5 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-bold font-mono text-[#D4AF37] uppercase tracking-wider">Device Connection</span>
              <h3 className="font-serif text-2xl font-bold">Pairing Control Panel</h3>
            </div>

            {/* Connection Status Badge */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-white/50">Status:</span>
              {waLinkStatus === "checking" && (
                <span className="px-3 py-1 rounded-full bg-white/5 text-white/70 border border-white/10 text-xs font-bold uppercase tracking-wider animate-pulse">Checking status...</span>
              )}
              {waLinkStatus === "disconnected" && (
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider">Disconnected</span>
              )}
              {waLinkStatus === "qr_ready" && (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold uppercase tracking-wider">QR Code Ready</span>
              )}
              {waLinkStatus === "connected" && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">🟢 Connected &amp; Active</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => connectInstance(e)}
                disabled={waLinkLoading}
                className="flex items-center justify-center space-x-2 px-6 py-3.5 rounded-full bg-gold-gradient text-[#011F15] hover:shadow-gold-md font-extrabold text-sm uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>{waLinkStatus === "connected" ? "Regenerate QR" : "Generate QR Code"}</span>
              </button>

              <button
                type="button"
                onClick={(e) => checkStatus(e)}
                disabled={waLinkLoading}
                className="flex items-center justify-center space-x-2 px-6 py-3.5 rounded-full bg-white/5 text-white border border-white/10 hover:bg-white/10 font-bold text-sm uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${waLinkLoading ? "animate-spin" : ""}`} />
                <span>Check Status</span>
              </button>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/10 relative min-h-[250px]">
            
            {uiError && (
              <div className="p-4 mb-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs text-center font-mono max-w-sm break-words">
                <p className="font-bold mb-1">⚠️ Error Details:</p>
                {uiError}
              </div>
            )}

            {waLinkLoading && !waLinkQr && (
              <div className="flex flex-col items-center space-y-3">
                <RefreshCw className="w-10 h-10 text-[#D4AF37] animate-spin" />
                <span className="text-xs text-white/50 font-mono">Generating Secure QR Code...</span>
              </div>
            )}
            
            {!waLinkLoading && !waLinkQr && !uiError && waLinkStatus !== "connected" && (
              <div className="text-center space-y-2 py-8">
                <QrCode className="w-12 h-12 text-white/20 mx-auto" />
                <p className="text-xs text-white/40">Click "Generate QR Code" to retrieve your coupling code</p>
              </div>
            )}

            {waLinkQr && waLinkStatus === "qr_ready" && (
              <div className="space-y-4 text-center">
                <div className="bg-white p-4 rounded-xl inline-block shadow-lg border-2 border-[#D4AF37]">
                  <img src={`data:image/png;base64,${waLinkQr}`} alt="WhatsApp QR Code" className="mx-auto rounded-lg shadow-lg w-48 h-48" />
                </div>
                <p className="text-xs text-[#D4AF37] font-mono animate-pulse">⚠️ Code changes every 20 seconds. Scan now.</p>
              </div>
            )}

            {waLinkStatus === "connected" && (
              <div className="text-center space-y-3 py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-emerald-500/20 shadow-md">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>
                <h4 className="font-serif text-lg font-bold text-white">Bot Link Established</h4>
                <p className="text-xs text-emerald-100/60 max-w-[250px]">Your personal device is connected. Webhooks will dispatch replies through this line.</p>
              </div>
            )}
          </div>
        </div>

        {/* Auto-Responder Toggle Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 bg-white/5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2 text-[#D4AF37]">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs font-bold font-mono uppercase tracking-wider">AI Responder Core</span>
            </div>
            <h4 className="font-serif text-xl font-bold text-white">WhatsApp Auto-Responder Bot</h4>
            <p className="text-xs text-emerald-100/60 max-w-md">
              Toggle this switch to automatically respond to new inquiries with: "Hi! I am currently operating a live printing station for an event and will get back to you shortly!"
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => toggleBot(e)}
            className={`flex items-center space-x-3 px-6 py-4 rounded-full border transition-all cursor-pointer ${
              botActive 
                ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/40 font-bold" 
                : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
            }`}
          >
            <Power className={`w-4 h-4 ${botActive ? "text-emerald-400" : "text-white/40"}`} />
            <span className="text-xs font-bold uppercase tracking-wider">{botActive ? "Active" : "Deactivated"}</span>
          </button>
        </div>

      </div>

      <Footer />
    </main>
  );
}
