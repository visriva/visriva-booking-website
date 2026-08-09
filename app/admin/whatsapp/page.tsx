"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  QrCode, RefreshCw, Power, ShieldCheck, Check, AlertCircle,
  MessageSquare, Save, Link2, Send, User, Bot, Phone, Wifi, WifiOff,
  Settings, X, ChevronRight, Activity, Zap, Search, SlidersHorizontal,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { subscribeWhatsAppBotConfig, saveWhatsAppBotConfig, WhatsAppBotConfig } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatThread {
  phoneNum: string;
  displayName?: string;
  lastMessage: string;
  lastTimestamp: string | null;
}

interface ChatMessage {
  id?: string;
  sender: "user" | "bot" | "admin";
  text: string;
  timestamp: string | null;
}

type WaStatus = "checking" | "connected" | "disconnected" | "qr_ready";

type MetaStatus = {
  configured: boolean;
  tokenValid?: boolean;
  webhookUrl?: string;
  verifyToken?: string;
  tokenError?: string;
  displayPhone?: string;
} | null;

type MetaDiagnose = {
  tokenValid?: boolean;
  displayPhone?: string;
  verifiedName?: string;
  wabaIdFromApi?: string;
  webhookUrl?: string;
  verifyToken?: string;
  webhookVerified?: boolean;
  wabaSubscribe?: { ok?: boolean };
  subscribedApps?: { data?: unknown[] };
  manualSteps?: string[];
  envWabaMismatch?: boolean;
} | null;

type WebhookResult = {
  success: boolean;
  message?: string;
  url?: string;
  webhookUrl?: string;
  verifyToken?: string;
  webhookVerified?: boolean;
  manualRequired?: boolean;
  manualSteps?: string[];
  note?: string;
  error?: string;
  details?: unknown;
  status?: number;
} | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatMsgTime(ts: string | null): string {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function bubbleClass(sender: string): string {
  if (sender === "user")  return "bg-white/10 border border-white/10 text-white self-start rounded-2xl rounded-tl-sm max-w-[80%]";
  if (sender === "bot")   return "bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#F5E6A3] self-end rounded-2xl rounded-tr-sm max-w-[80%] ml-auto";
  return "bg-emerald-600/30 border border-emerald-500/30 text-emerald-200 self-end rounded-2xl rounded-tr-sm max-w-[80%] ml-auto";
}

// ─── Main Admin Dashboard Component ──────────────────────────────────────────
export default function WhatsAppCRMPage() {

  // ── Bot Config / Firestore ─────────────────────────────────────────────────
  const [botConfig,          setBotConfig]          = useState<WhatsAppBotConfig | null>(null);
  const [botActive,          setBotActive]          = useState(true);
  const [autoReplyText,      setAutoReplyText]      = useState("");
  const [saveLoading,        setSaveLoading]        = useState(false);
  const [showSettings,       setShowSettings]       = useState(false);

  // ── Connection State ───────────────────────────────────────────────────────
  const [waStatus,           setWaStatus]           = useState<WaStatus>("checking");
  const [metaStatus,         setMetaStatus]         = useState<MetaStatus>(null);
  const [metaDiagnose,       setMetaDiagnose]       = useState<MetaDiagnose>(null);
  const [waQr,               setWaQr]               = useState("");
  const [waLoading,          setWaLoading]          = useState(false);

  // ── Webhook Sync Result ────────────────────────────────────────────────────
  const [webhookSyncLoading, setWebhookSyncLoading] = useState(false);
  const [webhookResult,      setWebhookResult]      = useState<WebhookResult>(null);

  // ── CRM Threads & Messages ─────────────────────────────────────────────────
  const [threads,        setThreads]        = useState<ChatThread[]>([]);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [activePhone,    setActivePhone]    = useState<string | null>(null);
  const [messages,       setMessages]       = useState<ChatMessage[]>([]);
  const [msgLoading,     setMsgLoading]     = useState(false);
  const [composeText,    setComposeText]    = useState("");
  const [sendingMsg,     setSendingMsg]     = useState(false);
  const [msgError,       setMsgError]       = useState("");

  // ── Toast Notifications ─────────────────────────────────────────────────────
  const [successToast, setSuccessToast] = useState("");
  const [errorToast,   setErrorToast]   = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadsPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgPollRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const toast = useCallback((msg: string, isError = false) => {
    if (isError) { setErrorToast(msg);   setTimeout(() => setErrorToast(""),   5000); }
    else         { setSuccessToast(msg); setTimeout(() => setSuccessToast(""), 4000); }
  }, []);

  // ── Subscribe to Firestore Config in real-time ─────────────────────────────
  useEffect(() => {
    const unsub = subscribeWhatsAppBotConfig((cfg) => {
      setBotConfig(cfg);
      setBotActive(cfg.isActive);
      setAutoReplyText(cfg.autoReplyText);
      if (cfg.connectionStatus === "open")       setWaStatus("connected");
      else if (cfg.connectionStatus === "connecting") setWaStatus("disconnected");
    });
    return () => unsub();
  }, []);

  const loadMetaDiagnose = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/meta-diagnose", { signal: AbortSignal.timeout(12000) });
      const data = await res.json().catch(() => null);
      setMetaDiagnose(data);
      if (data?.tokenValid) {
        setWaStatus("connected");
        setMetaStatus({
          configured: true,
          tokenValid: true,
          webhookUrl: data.webhookUrl,
          verifyToken: data.verifyToken,
          displayPhone: data.displayPhone,
        });
      }
    } catch {
      setMetaDiagnose(null);
    }
  }, []);

  // ── Load Meta diagnostics & threads on mount ───────────────────────────────
  useEffect(() => {
    loadMetaDiagnose();
    loadThreads();
  }, []);

  // ── Thread Polling every 10 seconds ───────────────────────────────────────
  useEffect(() => {
    if (threadsPollRef.current) clearInterval(threadsPollRef.current);
    threadsPollRef.current = setInterval(loadThreads, 10_000);
    return () => { if (threadsPollRef.current) clearInterval(threadsPollRef.current); };
  }, []);

  // ── Message Polling every 4 seconds for active thread ──────────────────────
  useEffect(() => {
    if (msgPollRef.current) clearInterval(msgPollRef.current);
    if (!activePhone) { setMessages([]); return; }
    loadMessages(activePhone);
    msgPollRef.current = setInterval(() => loadMessages(activePhone), 4_000);
    return () => { if (msgPollRef.current) clearInterval(msgPollRef.current); };
  }, [activePhone]);

  // ── Scroll to bottom when messages update ─────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── API Fetchers ───────────────────────────────────────────────────────────
  const loadThreads = useCallback(async () => {
    setThreadsLoading(true);
    try {
      const res = await fetch("/api/whatsapp/chats", { signal: AbortSignal.timeout(8000) });
      const data = await res.json().catch(() => ({ threads: [] }));
      setThreads(Array.isArray(data.threads) ? data.threads : []);
    } catch (err: any) {
      console.warn("[CRM] loadThreads non-blocking fallback:", err.message);
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (phone: string) => {
    setMsgLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/chats?phone=${phone}`, { signal: AbortSignal.timeout(6000) });
      const data = await res.json().catch(() => ({ messages: [] }));
      if (Array.isArray(data.messages)) setMessages(data.messages);
    } catch (err: any) {
      console.warn("[CRM] loadMessages non-blocking fallback:", err.message);
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const checkStatus = async (autoQr = false) => {
    setWaStatus("checking");
    try {
      const res = await fetch("/api/whatsapp/connect?action=status", { signal: AbortSignal.timeout(8000) });
      if (!res.ok) { setWaStatus("disconnected"); return; }
      const data = await res.json().catch(() => ({ status: "disconnected", state: "unknown" }));
      if (data.status === "connected") {
        setWaStatus("connected");
        return;
      }
      if (data.status === "connecting" || data.state === "connecting") {
        setWaStatus("disconnected");
        if (autoQr) await connectInstance();
        return;
      }
      setWaStatus("disconnected");
    } catch { setWaStatus("disconnected"); }
  };

  const connectInstance = async () => {
    setWaLoading(true);
    setWaQr("");
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      const data = await res.json().catch(() => ({ error: `Server error (HTTP ${res.status})` }));
      if (data.connected)   { setWaStatus("connected"); toast("✅ WhatsApp is already connected!"); }
      else if (data.base64) { setWaQr(data.base64); setWaStatus("qr_ready"); toast("📱 Scan the QR code with WhatsApp."); }
      else                  throw new Error(data.error || "No QR code returned");
    } catch (err: any) { toast(`Connection failed: ${err.message}`, true); setWaStatus("disconnected"); }
    finally { setWaLoading(false); }
  };

  const syncWebhook = async () => {
    setWebhookSyncLoading(true);
    setWebhookResult(null);
    try {
      const res  = await fetch("/api/whatsapp/meta-setup", { method: "POST" });
      const data = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
      setWebhookResult(data);
      await loadMetaDiagnose();
      if (data.webhookVerified) {
        toast("Webhook ready — complete the Meta Console steps below.");
      }
    } catch (err: any) {
      setWebhookResult({ success: false, error: err.message });
      toast(`Network error: ${err.message}`, true);
    } finally { setWebhookSyncLoading(false); }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast(`Copied ${label}`)).catch(() => toast("Copy failed", true));
  };

  const toggleBot = async () => {
    const next = !botActive;
    setBotActive(next);
    try {
      await saveWhatsAppBotConfig({ isActive: next });
      toast(next ? "🤖 Bot is now ACTIVE" : "🛑 Bot is PAUSED (Manual Mode)");
    } catch { setBotActive(!next); toast("Failed to update bot state.", true); }
  };

  const saveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await saveWhatsAppBotConfig({ autoReplyText });
      toast("💾 Auto-reply message updated!");
    } catch { toast("Failed to save auto-reply.", true); }
    finally { setSaveLoading(false); }
  };

  const sendManualMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePhone || !composeText.trim()) return;
    setSendingMsg(true);
    setMsgError("");
    try {
      const res  = await fetch("/api/whatsapp/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: activePhone, text: composeText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setComposeText("");
      await loadMessages(activePhone);
      await loadThreads();
    } catch (err: any) { setMsgError(err.message); }
    finally { setSendingMsg(false); }
  };

  // Filter threads by search query
  const filteredThreads = threads.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.phoneNum.toLowerCase().includes(q) ||
      (t.displayName && t.displayName.toLowerCase().includes(q)) ||
      (t.lastMessage && t.lastMessage.toLowerCase().includes(q))
    );
  });

  const activeThread = threads.find((t) => t.phoneNum === activePhone);

  return (
    <main className="min-h-screen bg-[#011F15] text-white flex flex-col selection:bg-[#D4AF37] selection:text-[#011F15]">
      <Navbar />

      {/* Floating Toast Alerts */}
      {successToast && (
        <div className="fixed top-24 right-5 z-50 px-5 py-3 rounded-xl bg-[#D4AF37] text-[#011F15] font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" /> {successToast}
        </div>
      )}
      {errorToast && (
        <div className="fixed top-24 right-5 z-50 px-5 py-3 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4" /> {errorToast}
        </div>
      )}

      <div className="pt-24 pb-8 px-3 sm:px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-4">

        {/* ── Top Navigation & Control Header ───────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-extrabold tracking-tight">
              WhatsApp <span className="text-[#D4AF37]">Live CRM</span>
            </h1>
            <p className="text-[11px] text-white/40 mt-1">Visriva Live Gifting Station — Inbox & Auto-Responder</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live Connection Status Badge */}
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
              metaStatus?.tokenValid || waStatus === "connected" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
              waStatus === "checking"     ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" :
              waStatus === "qr_ready"     ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20" :
                                           "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              {metaStatus?.tokenValid ? <ShieldCheck className="w-3 h-3" /> : waStatus === "connected" ? <Wifi className="w-3 h-3" /> : waStatus === "checking" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <WifiOff className="w-3 h-3" />}
              {metaStatus?.tokenValid ? "Meta API Active" : waStatus === "connected" ? "Connected ✅" : waStatus === "checking" ? "Checking..." : waStatus === "qr_ready" ? "Scan QR below" : "Setup needed"}
            </span>

            {/* Master Bot Toggle Switch */}
            <button
              type="button"
              onClick={toggleBot}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                botActive ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-white/50 border-white/10"
              }`}
            >
              <Power className="w-3 h-3" />
              {botActive ? "Bot Active" : "Bot Paused"}
            </button>

            {/* Manual Thread Refresh */}
            <button
              type="button"
              onClick={loadThreads}
              disabled={threadsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/70 text-[10px] font-bold uppercase tracking-wider transition hover:bg-white/10 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${threadsLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            {/* Drawer Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider transition hover:bg-[#D4AF37]/10 cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              Settings
            </button>
          </div>
        </div>

        {metaStatus?.configured && !metaStatus.tokenValid && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            Meta API token issue — check <code className="text-amber-100">WHATSAPP_ACCESS_TOKEN</code> on Vercel.
            {metaStatus.tokenError ? ` (${metaStatus.tokenError.slice(0, 80)})` : ""}
          </div>
        )}

        {metaStatus?.tokenValid && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-200/90 space-y-2">
            <p>
              <strong>Meta Cloud API</strong> active
              {metaDiagnose?.displayPhone ? ` · ${metaDiagnose.displayPhone}` : ""}
              {metaDiagnose?.verifiedName ? ` (${metaDiagnose.verifiedName})` : ""}
              — no QR scan needed.
            </p>
            {!metaDiagnose?.subscribedApps?.data?.length && (
              <p className="text-amber-200">
                <strong>One-time setup:</strong> Open Settings below and complete the Meta webhook steps (takes 2 min).
              </p>
            )}
          </div>
        )}

        {metaStatus?.tokenValid && metaStatus.webhookUrl && (
          <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-5 space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#D4AF37]">Meta Webhook — one-time setup (you have app access)</h3>
            <ol className="text-xs text-white/80 space-y-2 list-decimal pl-4">
              <li>Open <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] underline">developers.facebook.com</a> → Your App → <strong>WhatsApp</strong> → <strong>Configuration</strong></li>
              <li>Paste Callback URL (click Copy):</li>
            </ol>
            <div className="flex gap-2 items-center">
              <code className="flex-1 text-[10px] bg-black/40 p-2 rounded-lg break-all">{metaStatus.webhookUrl}</code>
              <button type="button" onClick={() => copyText(metaStatus.webhookUrl!, "URL")} className="px-3 py-2 rounded-lg bg-[#D4AF37] text-[#011F15] text-[10px] font-bold cursor-pointer">Copy</button>
            </div>
            <p className="text-xs text-white/80">Verify token (click Copy):</p>
            <div className="flex gap-2 items-center">
              <code className="flex-1 text-[10px] bg-black/40 p-2 rounded-lg">{metaStatus.verifyToken}</code>
              <button type="button" onClick={() => copyText(metaStatus.verifyToken!, "token")} className="px-3 py-2 rounded-lg bg-[#D4AF37] text-[#011F15] text-[10px] font-bold cursor-pointer">Copy</button>
            </div>
            <ol className="text-xs text-white/80 space-y-1 list-decimal pl-4" start={3}>
              <li>Click <strong>Verify and Save</strong> (green checkmark)</li>
              <li>Under Webhook fields → <strong>Manage</strong> → subscribe to <strong>messages</strong></li>
              <li>Test: send <strong>hi</strong> from another phone to +91 88844 84828</li>
            </ol>
            <button type="button" onClick={syncWebhook} disabled={webhookSyncLoading} className="text-[10px] text-white/50 underline cursor-pointer">
              {webhookSyncLoading ? "Checking…" : "Re-check webhook status"}
            </button>
          </div>
        )}

        {/* ── Settings Drawer / Control Panel ───────────────────────── */}
        {showSettings && (
          <div className="rounded-2xl bg-black/40 border border-white/10 p-5 space-y-4 transition-all">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-[#D4AF37]">Control Panel & Diagnostics</h3>
              <button type="button" onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meta Webhook Setup */}
              <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Meta Webhook Setup</p>
                <p className="text-[10px] text-white/40 font-mono break-all">
                  {metaStatus?.webhookUrl || "visriva-booking-website-visriva.vercel.app/api/whatsapp/webhook"}
                </p>

                <button
                  type="button"
                  onClick={syncWebhook}
                  disabled={webhookSyncLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] text-[#011F15] text-[10px] font-extrabold uppercase tracking-wider shadow transition disabled:opacity-50 cursor-pointer hover:brightness-110 active:scale-95"
                >
                  {webhookSyncLoading
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Registering Meta webhook...</>
                    : <><Zap className="w-3.5 h-3.5" /> Register Meta Webhook</>
                  }
                </button>

                {webhookResult && (
                  <div className={`rounded-lg p-2.5 text-[10px] font-mono border ${
                    webhookResult.webhookVerified ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-amber-500/10 border-amber-500/20 text-amber-200"
                  }`}>
                    <p className="font-bold mb-1">
                      {webhookResult.webhookVerified ? "✅ WEBHOOK READY — DO THESE 4 STEPS IN META" : "⚠️ WEBHOOK CHECK"}
                    </p>
                    {webhookResult.message && <p className="mb-2 opacity-90">{webhookResult.message}</p>}
                    {webhookResult.note && <p className="mb-2 opacity-75 italic">{webhookResult.note}</p>}
                    {webhookResult.manualSteps && (
                      <ol className="mt-1 list-decimal pl-4 space-y-1">
                        {(webhookResult.manualSteps as string[]).map((s) => <li key={s}>{s}</li>)}
                      </ol>
                    )}
                    {webhookResult.webhookUrl && (
                      <p className="mt-2 break-all opacity-75">URL: {webhookResult.webhookUrl}</p>
                    )}
                    {webhookResult.verifyToken && (
                      <p className="break-all opacity-75">Token: {webhookResult.verifyToken}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Custom Auto-Reply Text Editor */}
              <form onSubmit={saveReply} className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Fallback Auto-Reply Text</p>
                <textarea
                  value={autoReplyText}
                  onChange={(e) => setAutoReplyText(e.target.value)}
                  rows={4}
                  maxLength={400}
                  placeholder="Fallback message sent when keywords do not match..."
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-[11px] text-white focus:outline-none focus:border-[#D4AF37] resize-none placeholder-white/30"
                />
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D4AF37] text-[#011F15] text-[10px] font-extrabold uppercase tracking-wider disabled:opacity-50 cursor-pointer hover:brightness-110"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saveLoading ? "Saving..." : "Save Message"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Dual-Pane Live CRM Dashboard ───────────────────────────── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-h-[580px]">

          {/* LEFT PANE: Conversation Threads List */}
          <div className="flex flex-col rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
            {/* Header + Search bar */}
            <div className="p-3 border-b border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Inbox Conversations</span>
                  {threads.length > 0 && (
                    <span className="text-[10px] bg-[#D4AF37] text-[#011F15] rounded-full px-1.5 py-0.5 font-black">{threads.length}</span>
                  )}
                </div>
                {threadsLoading && <RefreshCw className="w-3 h-3 text-white/30 animate-spin" />}
              </div>

              {/* Search filter input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search number or name..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* List of Chat Threads */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-[#D4AF37]/40" />
                  </div>
                  <p className="text-xs font-bold text-white/50">
                    {searchQuery ? "No matching contacts found." : "No customer conversations yet."}
                  </p>
                  <p className="text-[10px] text-white/30 leading-relaxed max-w-[200px]">
                    {searchQuery ? "Try searching for a different number or clear your search." : "Test your bot by sending a WhatsApp message from an external phone to your business number!"}
                  </p>
                </div>
              ) : (
                filteredThreads.map((thread) => (
                  <button
                    key={thread.phoneNum}
                    type="button"
                    onClick={() => setActivePhone(thread.phoneNum)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition hover:bg-white/5 cursor-pointer ${
                      activePhone === thread.phoneNum ? "bg-white/10 border-l-2 border-l-[#D4AF37]" : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/25 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-white truncate">
                          {thread.displayName && thread.displayName !== thread.phoneNum
                            ? thread.displayName
                            : `+${thread.phoneNum}`}
                        </span>
                        <span className="text-[9px] text-white/30 ml-2 flex-shrink-0">{formatTime(thread.lastTimestamp)}</span>
                      </div>
                      <p className="text-[11px] text-white/40 truncate">{thread.lastMessage || "No messages"}</p>
                    </div>
                    {activePhone === thread.phoneNum && <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0 mt-2" />}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT PANE: Live Chat Window */}
          <div className="flex flex-col rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
            {!activePhone ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-5">
                  <MessageSquare className="w-9 h-9 text-[#D4AF37]/30" />
                </div>
                <h3 className="font-serif text-xl font-bold text-white mb-2">Select a Conversation</h3>
                <p className="text-[11px] text-white/40 max-w-xs">
                  Click a contact from the inbox list on the left to inspect their chat history and send manual replies directly.
                </p>
              </div>
            ) : (
              <>
                {/* Active Chat Header */}
                <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/25 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {activeThread?.displayName && activeThread.displayName !== activeThread.phoneNum
                          ? activeThread.displayName
                          : `+${activePhone}`}
                      </p>
                      <p className="text-[10px] text-white/30 font-mono">+{activePhone} · WhatsApp Client</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {botActive
                      ? <span className="flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full font-bold uppercase"><Bot className="w-2.5 h-2.5" /> Bot Active</span>
                      : <span className="flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-full font-bold uppercase"><Bot className="w-2.5 h-2.5" /> Manual Mode</span>
                    }
                    <button type="button" onClick={() => setActivePhone(null)} className="text-white/30 hover:text-white cursor-pointer ml-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Display Area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
                  {messages.length === 0 && !msgLoading && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[11px] text-white/30">No message history for this contact yet.</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={msg.id || idx} className={`flex flex-col ${msg.sender !== "user" ? "items-end" : "items-start"}`}>
                      <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${bubbleClass(msg.sender)}`}>
                        {msg.text}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 px-1">
                        {msg.sender === "user"  && <User        className="w-2.5 h-2.5 text-white/20" />}
                        {msg.sender === "bot"   && <Bot         className="w-2.5 h-2.5 text-[#D4AF37]/40" />}
                        {msg.sender === "admin" && <ShieldCheck className="w-2.5 h-2.5 text-emerald-400/50" />}
                        <span className="text-[9px] text-white/25">{formatMsgTime(msg.timestamp)}</span>
                        {msg.sender !== "user" && <span className="text-[9px] text-white/15">· {msg.sender === "bot" ? "Auto-reply" : "You (Admin)"}</span>}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Text Message Composer Input */}
                <form onSubmit={sendManualMessage} className="p-3.5 border-t border-white/10">
                  {msgError && <p className="text-[10px] text-red-400 mb-2 font-mono">{msgError}</p>}
                  <div className="flex items-end gap-2">
                    <textarea
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendManualMessage(e as any); } }}
                      rows={1}
                      placeholder="Type a manual reply... (Enter to send, Shift+Enter for newline)"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] resize-none placeholder-white/30 min-h-[48px] max-h-[120px]"
                    />
                    <button
                      type="submit"
                      disabled={sendingMsg || !composeText.trim()}
                      className="w-12 h-12 flex-shrink-0 rounded-xl bg-[#D4AF37] text-[#011F15] flex items-center justify-center disabled:opacity-40 cursor-pointer hover:brightness-110"
                    >
                      {sendingMsg ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-white/20 mt-1.5">Manual replies send directly via Evolution API. The bot remains active for future incoming messages.</p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
