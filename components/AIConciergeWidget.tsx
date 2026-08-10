"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, ArrowRight, RefreshCw, Send, X, User, Zap, Sparkles } from "lucide-react";
import {
  subscribeAIConciergeConfig,
  DEFAULT_AI_CONCIERGE_CONFIG,
  AIConciergeConfig,
} from "@/lib/firebase";

interface Message {
  role: "user" | "model";
  display: string;           // what is shown in the UI
  apiText?: string;          // what is sent to the API (could differ for model messages)
  isRecommendation?: boolean;
  data?: any;
}

interface AIConciergeProps {
  onApplyRecommendation?: (serviceIds: string[]) => void;
  /** Slimmer collapsed banner for booking form */
  compact?: boolean;
}

const SERVICE_LABELS: Record<string, { emoji: string; label: string }> = {
  "photo-booth": { emoji: "📸", label: "Instant Photo Booth" },
  magnets:       { emoji: "🧲", label: "Custom Magnets" },
  keychains:     { emoji: "🔑", label: "Acrylic Keychains" },
  mugs:          { emoji: "☕", label: "Live Mug Printing" },
  totes:         { emoji: "👕", label: "Tote & T-Shirt" },
};

export default function AIConciergeWidget({ onApplyRecommendation, compact = false }: AIConciergeProps) {
  const [config, setConfig]             = useState<AIConciergeConfig>(DEFAULT_AI_CONCIERGE_CONFIG);
  const [isOpen, setIsOpen]             = useState(false);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [inputText, setInputText]       = useState("");
  const [loading, setLoading]           = useState(false);
  const [appliedToast, setAppliedToast] = useState(false);
  const chatRef                         = useRef<HTMLDivElement>(null);
  const inputRef                        = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeAIConciergeConfig((data) => {
      if (data) setConfig(data);
    });
    return () => unsub();
  }, []);

  // Scroll chat container only — never the page
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Show the greeting message instantly (no API call needed for first message)
      setMessages([{
        role: "model",
        display: "Hello! Welcome to Visriva Live Station 👋\n\nI'm Drupitha, your personal event advisor. I'd love to help you find the perfect live station setup for your celebration! 🎉\n\nMay I start by knowing your name?",
      }]);
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // ── Send message to Gemini ────────────────────────────────────────────────
  const sendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", display: trimmed };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setInputText("");
    setLoading(true);

    try {
      // Build history for Gemini — skip the local greeting (role: model, no apiText)
      // The API injects the system persona separately
      const apiHistory = withUser
        .filter((m) => {
          // Skip locally-rendered greeting (model message with no apiText and it's first)
          if (m.role === "model" && !m.apiText && !m.isRecommendation) return false;
          return true;
        })
        .map((m) => ({
          role: m.role,
          text: m.apiText ?? m.display,
        }));

      const res = await fetch("/api/gemini/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiHistory }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error("Concierge API error:", res.status, errBody);
        throw new Error("API error");
      }

      const data = await res.json();
      let aiMsg: Message;

      if (data.mode === "recommendation") {
        // Build a readable display message for the recommendation
        const displayText = [
          `🌟 ${data.recommendationTitle}`,
          data.tagline,
          "",
          data.reasoning,
        ].filter(Boolean).join("\n");

        aiMsg = {
          role: "model",
          display: displayText,
          apiText: displayText,
          isRecommendation: true,
          data,
        };
      } else {
        // Normal conversational reply
        const msg = data.message || "Sorry, could you try that again?";
        aiMsg = {
          role: "model",
          display: msg,
          apiText: msg,
        };
      }

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Widget error:", err);
      setMessages((prev) => [...prev, {
        role: "model",
        display: "Sorry, I had a quick connection issue! Please send your message again 😊",
      }]);
    } finally {
      setLoading(false);
      // Re-focus input so user can type immediately without clicking
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Enter key — prevent page scroll, send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      sendMessage(inputText);
    }
  };

  const handleApply = (rec: any) => {
    if (rec?.recommendedServices && onApplyRecommendation) {
      onApplyRecommendation(rec.recommendedServices);
      setAppliedToast(true);
      setTimeout(() => setAppliedToast(false), 3500);
      const el = document.getElementById("booking-engine") || document.getElementById("booking-calculator");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = "/#booking-engine";
      }
    }
  };

  const handleReset = () => {
    setMessages([{
      role: "model",
      display: "Hello again! Welcome back 👋\n\nI'm Drupitha, your Visriva event advisor. What's your name?",
    }]);
    setInputText("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── Render text — supports **bold** and line breaks ───────────────────────
  const renderText = (text: string) =>
    text.split("\n").map((line, i) => {
      if (line === "") return <div key={i} className="h-2" />;
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={j} className="font-bold text-white">{p.slice(2, -2)}</strong>
          : <span key={j}>{p}</span>
      );
      return <div key={i}>{parts}</div>;
    });

  // ── Message bubble ────────────────────────────────────────────────────────
  const renderMessage = (msg: Message, idx: number) => {
    const isUser = msg.role === "user";

    if (isUser) {
      return (
        <div key={idx} className="flex justify-end">
          <div className="flex items-end gap-2 max-w-[78%]">
            <div className="px-4 py-2.5 rounded-2xl rounded-br-sm bg-[#D4AF37] text-[#011F15] text-sm font-semibold shadow-md leading-relaxed">
              {msg.display}
            </div>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={idx} className="flex justify-start">
        <div className="flex items-start gap-2 max-w-[92%]">
          <div className="w-7 h-7 rounded-full bg-gold-gradient flex items-center justify-center flex-shrink-0 mt-0.5 shadow-gold-sm">
            <Bot className="w-3.5 h-3.5 text-[#011F15]" />
          </div>
          <div className="space-y-3 w-full">
            {/* Bubble */}
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/8 border border-white/15 text-sm text-emerald-100/90 leading-relaxed">
              {renderText(msg.display)}
            </div>

            {/* Recommendation card */}
            {msg.isRecommendation && msg.data && (
              <div className="p-4 rounded-2xl bg-black/60 border border-[#D4AF37]/50 space-y-3">
                {/* Stations */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37]">
                    Recommended Stations
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {msg.data.recommendedServices?.map((id: string) => {
                      const s = SERVICE_LABELS[id];
                      return s ? (
                        <span key={id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs font-bold text-white">
                          {s.emoji} {s.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Why each */}
                {msg.data.whyEachStation && (
                  <div className="space-y-2">
                    {Object.entries(msg.data.whyEachStation).map(([id, why]) => {
                      const s = SERVICE_LABELS[id];
                      return s ? (
                        <div key={id} className="flex items-start gap-2 text-[11px] text-emerald-100/80 leading-relaxed">
                          <span className="flex-shrink-0">{s.emoji}</span>
                          <span><strong className="text-white">{s.label}:</strong> {why as string}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Capacity */}
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 w-fit">
                  <Zap className="w-3 h-3" />
                  {msg.data.capacityEstimate}
                </div>

                {/* Next step */}
                {msg.data.nextStep && (
                  <p className="text-xs text-emerald-100/70 leading-relaxed">{msg.data.nextStep}</p>
                )}

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={() => handleApply(msg.data)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider hover:scale-105 transition flex items-center justify-center gap-2 cursor-pointer shadow-gold-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Apply to Booking Form
                  </button>
                  <a
                    href={`https://wa.me/918884484828?text=${encodeURIComponent(
                      `Hi Visriva! I'd like to book: ${msg.data.recommendedServices?.join(", ")}. AI recommended: ${msg.data.recommendationTitle}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#25D366]/25 transition"
                  >
                    📱 WhatsApp to Book
                  </a>
                </div>

                {appliedToast && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs text-center font-bold">
                    ✅ Stations applied to the booking form below!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── MASTER ENABLE/DISABLE TOGGLE (Managed via Admin Panel Option 12) ─────
  if (config.enabled === false) {
    return null;
  }

  // ── COLLAPSED BANNER ──────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group w-full text-left relative rounded-xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#01281c]/90 to-[#011F15] cursor-pointer hover:border-[#D4AF37]/60 transition-all flex items-center justify-between gap-3 ${
          compact ? "p-3 sm:p-3.5" : "glass-card p-4 sm:p-5 rounded-2xl shadow-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`rounded-lg bg-gold-gradient text-[#011F15] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${compact ? "w-9 h-9" : "w-10 h-10 sm:w-11 sm:h-11 rounded-xl shadow-md"}`}>
            <Bot className={compact ? "w-4 h-4" : "w-5 h-5 sm:w-6 sm:h-6"} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-serif font-bold text-white truncate ${compact ? "text-sm" : "text-sm sm:text-base"}`}>
                {compact ? "Ask Drupitha — AI advisor" : "Chat with Drupitha — AI Station Advisor"}
              </span>
              <span className="text-[9px] font-mono uppercase bg-[#D4AF37]/15 text-[#D4AF37] px-1.5 py-0.5 rounded border border-[#D4AF37]/30 font-bold shrink-0">
                Gemini
              </span>
            </div>
            {!compact && (
              <p className="text-xs text-emerald-100/70 mt-0.5">
                Tell her about your event — she&apos;ll find the perfect stations for you
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-[#D4AF37] shrink-0 group-hover:translate-x-0.5 transition-transform">
          <span className="hidden sm:inline">Chat</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    );
  }

  // ── EXPANDED CHAT ─────────────────────────────────────────────────────────
  return (
    <div
      className="glass-card rounded-3xl border border-[#D4AF37]/60 bg-[#022419] shadow-2xl flex flex-col overflow-hidden"
      style={{ height: "500px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0 bg-[#011F15]/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gold-gradient flex items-center justify-center shadow-gold-sm">
              <Bot className="w-5 h-5 text-[#011F15]" />
            </div>
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#022419]" />
          </div>
          <div>
            <div className="font-bold text-white text-sm flex items-center gap-2">
              Drupitha
              <span className="text-[9px] font-mono bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded border border-[#D4AF37]/30">
                Visriva AI
              </span>
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
              Online · Event Station Advisor
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} title="Start new chat"
            className="w-8 h-8 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 flex items-center justify-center transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages — scrolls internally, never the page */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ overscrollBehavior: "contain" }}
      >
        {messages.map((msg, idx) => renderMessage(msg, idx))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gold-gradient flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-[#011F15]" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/8 border border-white/15 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-white/10 bg-[#011F15]/50 flex-shrink-0">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={loading}
            autoComplete="off"
            className="flex-1 bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-emerald-100/35 focus:border-[#D4AF37] outline-none disabled:opacity-50 transition"
          />
          <button
            onClick={() => sendMessage(inputText)}
            disabled={loading || !inputText.trim()}
            className="flex-shrink-0 w-10 h-10 bg-gold-gradient text-[#011F15] rounded-xl font-extrabold hover:scale-105 transition disabled:opacity-40 flex items-center justify-center cursor-pointer shadow-md"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
