"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  QrCode, RefreshCw, Power, ShieldCheck, Check, AlertCircle,
  MessageSquare, Save, Link2, Send, User, Bot, Phone, Wifi, WifiOff,
  Settings, X, ChevronRight,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatMessageTime(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WhatsAppCRMPage() {
  // Bot config (real-time from Firestore)
  const [botConfig, setBotConfig] = useState<WhatsAppBotConfig | null>(null);
  const [botActive, setBotActive] = useState(true);
  const [autoReplyText, setAutoReplyText] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [webhookSyncLoading, setWebhookSyncLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; message?: string; url?: string; error?: string; detail?: unknown; status?: number } | null>(null);

  // Connection
  const [waStatus, setWaStatus] = useState<"checking" | "connected" | "disconnected" | "qr_ready">("checking");
  const [waQr, setWaQr] = useState("");
  const [waLoading, setWaLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // CRM inbox
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composeText, setComposeText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [msgError, setMsgError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const threadsRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Toasts
  const [successToast, setSuccessToast] = useState("");
  const [errorToast, setErrorToast] = useState("");
  const toast = (msg: string, isError = false) => {
    if (isError) { setErrorToast(msg); setTimeout(() => setErrorToast(""), 5000); }
    else { setSuccessToast(msg); setTimeout(() => setSuccessToast(""), 4000); }
  };

  // ── Subscribe to bot config from Firestore ──────────────────────────────────
  useEffect(() => {
    const unsub = subscribeWhatsAppBotConfig((cfg) => {
      setBotConfig(cfg);
      setBotActive(cfg.isActive);
      setAutoReplyText(cfg.autoReplyText);
      if (cfg.connectionStatus === "open") setWaStatus("connected");
      else if (cfg.connectionStatus === "connecting") setWaStatus("checking");
    });
    return () => unsub();
  }, []);

  // ── Check connection status on load ────────────────────────────────────────
  useEffect(() => {
    checkStatus();
  }, []);

  // ── Load threads on load + poll every 15s ─────────────────────────────────
  useEffect(() => {
    loadThreads();
    threadsRef.current = setInterval(loadThreads, 15000);
    return () => { if (threadsRef.current) clearInterval(threadsRef.current); };
  }, []);

  // ── Poll active chat messages every 4s ────────────────────────────────────
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activePhone) return;
    loadMessages(activePhone);
    pollRef.current = setInterval(() => loadMessages(activePhone), 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activePhone]);

  // ── Scroll to bottom on new messages ──────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── API helpers ────────────────────────────────────────────────────────────
  const loadThreads = async () => {
    try {
      const res = await fetch("/api/whatsapp/chats");
      if (!res.ok) return;
      const data = await res.json();
      setThreads(data.threads || []);
    } catch {}
  };

  const loadMessages = useCallback(async (phone: string) => {
    try {
      const res = await fetch(`/api/whatsapp/chats?phone=${phone}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/connect?action=status");
      if (!res.ok) return;
      const data = await res.json();
      setWaStatus(data.status === "connected" ? "connected" : "disconnected");
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
      const data = await res.json();
      if (data.connected) { setWaStatus("connected"); toast("✅ WhatsApp is already connected!"); }
      else if (data.base64) { setWaQr(data.base64); setWaStatus("qr_ready"); toast("Scan the QR code to connect."); }
      else throw new Error(data.error || "No QR returned");
    } catch (err: any) { toast(`Connection failed: ${err.message}`, true); }
    finally { setWaLoading(false); }
  };

  const syncWebhook = async () => {
    setWebhookSyncLoading(true);
    setWebhookResult(null);
    console.log("[Force Sync] Calling /api/whatsapp/sync-webhook...");
    try {
      const res = await fetch("/api/whatsapp/sync-webhook", { method: "POST" });
      const data = await res.json();
      console.log("[Force Sync] Response:", data);
      setWebhookResult(data);
      if (data.success) {
        toast(`✅ Webhook registered! Railway → Vercel active.`);
      } else {
        toast(`Railway returned ${data.status}: ${data.error}`, true);
      }
    } catch (err: any) {
      console.error("[Force Sync] Threw:", err);
      setWebhookResult({ success: false, error: err.message });
      toast(`Network error: ${err.message}`, true);
    } finally {
      setWebhookSyncLoading(false);
    }
  };

  const toggleBot = async () => {
    const next = !botActive;
    setBotActive(next);
    await saveWhatsAppBotConfig({ isActive: next });
    toast(next ? "🤖 Bot is now ACTIVE" : "🛑 Bot is now PAUSED");
  };

  const saveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await saveWhatsAppBotConfig({ autoReplyText });
      toast("💾 Auto-reply message saved!");
    } catch { toast("Failed to save.", true); }
    finally { setSaveLoading(false); }
  };

  const sendManualMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePhone || !composeText.trim()) return;
    setSendingMsg(true);
    setMsgError("");
    try {
      const res = await fetch("/api/whatsapp/chats", {
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

  // ── Bubble colors ──────────────────────────────────────────────────────────
  const bubbleStyle = (sender: string) => {
    if (sender === "user") return "bg-white/10 border border-white/10 text-white self-start rounded-2xl rounded-tl-sm";
    if (sender === "bot") return "bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#F5E6A3] self-end rounded-2xl rounded-tr-sm";
    return "bg-emerald-600/30 border border-emerald-500/30 text-emerald-200 self-end rounded-2xl rounded-tr-sm";
  };

  return (
    <main className="min-h-screen bg-[#011F15] text-white flex flex-col selection:bg-[#D4AF37] selection:text-[#011F15]">
      <Navbar />

      {/* ── Toasts ─────────────────────────────────────────────────── */}
      {successToast && (
        <div className="fixed top-24 right-6 z-50 px-5 py-3 rounded-xl bg-[#D4AF37] text-[#011F15] font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" /> {successToast}
        </div>
      )}
      {errorToast && (
        <div className="fixed top-24 right-6 z-50 px-5 py-3 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4" /> {errorToast}
        </div>
      )}

      <div className="pt-24 pb-8 px-3 sm:px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-4">

        {/* ── Top Header Bar ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-extrabold tracking-tight">
              WhatsApp <span className="text-[#D4AF37]">Live CRM</span>
            </h1>
            <p className="text-xs text-white/50 font-sans mt-1">Visriva Live Gifting Station — Inbox & Auto-Responder Control</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Connection badge */}
            <span className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider ${waStatus === "connected" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : waStatus === "checking" ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
              {waStatus === "connected" ? <Wifi className="w-3.5 h-3.5" /> : waStatus === "checking" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <WifiOff className="w-3.5 h-3.5" />}
              {waStatus === "connected" ? "Connected ✅" : waStatus === "checking" ? "Checking..." : "Disconnected ❌"}
            </span>

            {/* Bot toggle pill */}
            <button
              type="button"
              onClick={toggleBot}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider transition cursor-pointer ${botActive ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-white/50 border-white/10"}`}
            >
              <Power className="w-3.5 h-3.5" />
              {botActive ? "Bot Active" : "Bot Off"}
            </button>

            {/* Settings toggle */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>
        </div>

        {/* ── Settings Drawer ─────────────────────────────────────────── */}
        {showSettings && (
          <div className="rounded-2xl bg-black/40 border border-white/10 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#D4AF37]">Control Panel</h3>
              <button type="button" onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Connect/QR */}
              <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">WhatsApp Device</p>
                {waQr && waStatus === "qr_ready" && (
                  <div className="bg-white p-2 rounded-xl inline-block">
                    <img src={`data:image/png;base64,${waQr}`} alt="QR" className="w-36 h-36 rounded" />
                  </div>
                )}
                {waStatus === "connected" && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4" /> Phone Linked
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={connectInstance} disabled={waLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D4AF37] text-[#011F15] text-xs font-extrabold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer">
                    {waLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                    {waStatus === "connected" ? "Re-Link" : "Generate QR"}
                  </button>
                  <button type="button" onClick={checkStatus}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer hover:bg-white/10">
                    <RefreshCw className="w-3.5 h-3.5" /> Sync
                  </button>
                </div>
              </div>

              {/* Webhook */}
              <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Webhook Registration</p>
                <p className="text-[11px] text-white/50 font-mono break-all">Target: visriva.com/api/whatsapp/webhook</p>

                {/* Prominent Force Sync button */}
                <button
                  type="button"
                  onClick={syncWebhook}
                  disabled={webhookSyncLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#D4AF37] text-[#011F15] text-xs font-extrabold uppercase tracking-wider shadow-lg transition disabled:opacity-50 cursor-pointer hover:brightness-110 active:scale-95"
                >
                  {webhookSyncLoading
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Registering on Railway...</>
                    : <><Link2 className="w-4 h-4" /> ⚡ Force Sync Webhook</>
                  }
                </button>

                {/* Inline result panel */}
                {webhookResult && (
                  <div className={`rounded-lg p-3 text-[10px] font-mono border ${webhookResult.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>
                    <p className="font-bold mb-1 text-[11px]">{webhookResult.success ? "✅ SUCCESS" : `❌ FAILED (HTTP ${webhookResult.status ?? "—"})`}</p>
                    {webhookResult.success && <p>URL: {webhookResult.url}</p>}
                    {webhookResult.error && <p>Error: {webhookResult.error}</p>}
                    {webhookResult.detail !== undefined && (
                      <pre className="mt-1 whitespace-pre-wrap break-all opacity-80">{JSON.stringify(webhookResult.detail, null, 2)}</pre>
                    )}
                  </div>
                )}

                {botConfig?.lastSyncedAt && (
                  <p className="text-[10px] text-white/30 font-mono">Last sync: {new Date(botConfig.lastSyncedAt).toLocaleString()}</p>
                )}
              </div>

              {/* Auto-reply message */}
              <form onSubmit={saveReply} className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Auto-Reply Text</p>
                <textarea
                  value={autoReplyText}
                  onChange={(e) => setAutoReplyText(e.target.value)}
                  rows={3}
                  maxLength={400}
                  placeholder="Fallback auto-reply message..."
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] resize-none font-sans placeholder-white/30"
                />
                <button type="submit" disabled={saveLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D4AF37] text-[#011F15] text-xs font-extrabold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer">
                  <Save className="w-3.5 h-3.5" />
                  {saveLoading ? "Saving..." : "Save"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Main Dual-Pane CRM ──────────────────────────────────────── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-h-[600px]">

          {/* LEFT: Conversation List ───────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">Conversations</span>
                {threads.length > 0 && (
                  <span className="text-[10px] bg-[#D4AF37] text-[#011F15] rounded-full px-2 py-0.5 font-black">{threads.length}</span>
                )}
              </div>
              <button type="button" onClick={loadThreads} className="text-white/40 hover:text-white transition cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {threads.length === 0 && (
                <div className="p-8 text-center">
                  <Phone className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-xs text-white/40">No conversations yet.</p>
                  <p className="text-[10px] text-white/25 mt-1">Messages will appear here once the webhook receives them.</p>
                </div>
              )}
              {threads.map((thread) => (
                <button
                  key={thread.phoneNum}
                  type="button"
                  onClick={() => setActivePhone(thread.phoneNum)}
                  className={`w-full text-left p-4 flex items-start gap-3 transition cursor-pointer hover:bg-white/5 ${activePhone === thread.phoneNum ? "bg-white/10 border-l-2 border-l-[#D4AF37]" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-white truncate">
                        {thread.displayName && thread.displayName !== thread.phoneNum ? thread.displayName : `+${thread.phoneNum}`}
                      </span>
                      <span className="text-[10px] text-white/30 ml-2 flex-shrink-0">{formatTime(thread.lastTimestamp)}</span>
                    </div>
                    <p className="text-[11px] text-white/50 truncate">{thread.lastMessage || "No messages"}</p>
                  </div>
                  {activePhone === thread.phoneNum && <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0 mt-2" />}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Chat Window ─────────────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
            {!activePhone ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-5">
                  <MessageSquare className="w-9 h-9 text-[#D4AF37]/50" />
                </div>
                <h3 className="font-serif text-xl font-bold text-white mb-2">Select a Conversation</h3>
                <p className="text-xs text-white/40 max-w-xs">Click a contact on the left to view their full message history and send replies directly from here.</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {threads.find(t => t.phoneNum === activePhone)?.displayName !== activePhone
                          ? threads.find(t => t.phoneNum === activePhone)?.displayName
                          : `+${activePhone}`}
                      </p>
                      <p className="text-[10px] text-white/40 font-mono">+{activePhone} · WhatsApp</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {botActive
                      ? <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase"><Bot className="w-3 h-3" /> Bot Active</span>
                      : <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold uppercase"><Bot className="w-3 h-3" /> Manual Mode</span>
                    }
                    <button type="button" onClick={() => setActivePhone(null)} className="text-white/30 hover:text-white transition cursor-pointer ml-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-white/30">No messages yet for this contact.</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={msg.id || idx} className={`flex flex-col max-w-[78%] ${msg.sender !== "user" ? "self-end items-end ml-auto" : "self-start items-start"}`}>
                      <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${bubbleStyle(msg.sender)}`}>
                        {msg.text}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 px-1">
                        {msg.sender === "user" && <User className="w-2.5 h-2.5 text-white/30" />}
                        {msg.sender === "bot" && <Bot className="w-2.5 h-2.5 text-[#D4AF37]/50" />}
                        {msg.sender === "admin" && <ShieldCheck className="w-2.5 h-2.5 text-emerald-400/60" />}
                        <span className="text-[10px] text-white/30">{formatMessageTime(msg.timestamp)}</span>
                        {msg.sender !== "user" && <span className="text-[10px] text-white/20">· {msg.sender === "bot" ? "Auto-reply" : "You"}</span>}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Compose Bar */}
                <form onSubmit={sendManualMessage} className="p-4 border-t border-white/10">
                  {msgError && <p className="text-[10px] text-red-400 mb-2 font-mono">{msgError}</p>}
                  <div className="flex items-end gap-3">
                    <textarea
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendManualMessage(e as any); }
                      }}
                      rows={1}
                      placeholder="Type a manual reply... (Enter to send, Shift+Enter for new line)"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] resize-none font-sans placeholder-white/30 min-h-[48px] max-h-[120px]"
                    />
                    <button
                      type="submit"
                      disabled={sendingMsg || !composeText.trim()}
                      className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#D4AF37] text-[#011F15] flex items-center justify-center transition disabled:opacity-40 cursor-pointer hover:brightness-110"
                    >
                      {sendingMsg ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-white/25 mt-2">Replying manually overrides the bot for this message. Bot auto-replies are still active for future messages.</p>
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
