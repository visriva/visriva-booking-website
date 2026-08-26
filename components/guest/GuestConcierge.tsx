"use client";

import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";
import type { GuestEventConfig } from "@/lib/guestExperience";

interface Props {
  event: GuestEventConfig;
  guestName?: string;
}

type ChatMsg = { role: "user" | "assistant"; text: string };

export default function GuestConcierge({ event, guestName }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: `Hello${guestName ? ` ${guestName}` : ""}! I'm your Visriva concierge. Ask me about timings, the photo booth, parking, or WiFi.`,
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await fetch("/api/guest/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          message: q,
          guestName,
        }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.reply || data.error || "I couldn't reach the concierge just now — ask a Visriva crew member nearby.",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Connection issue. Please try again in a moment." },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50);
    }
  };

  return (
    <>
      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-800 border border-[var(--guest-gold)]/50 text-[var(--guest-gold)] shadow-gold-md"
        aria-label="Open AI concierge"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="guest-glass mx-auto w-full max-w-lg rounded-t-3xl border-b-0 max-h-[78dvh] flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--guest-gold)]" />
                  <div>
                    <p className="text-sm font-bold">Event Concierge</p>
                    <p className="text-[10px] text-[var(--guest-muted)]">Ask anything about tonight</p>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-[240px]">
                {messages.map((m, i) => (
                  <div
                    key={`${i}-${m.role}`}
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "ml-auto bg-[var(--guest-gold)]/25 text-[var(--guest-fg)]"
                        : "mr-auto bg-black/30 text-[var(--guest-muted)]"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                {busy && (
                  <p className="text-[10px] text-[var(--guest-gold)] font-mono animate-pulse">Thinking…</p>
                )}
              </div>

              <div className="p-3 border-t border-white/10 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void send()}
                  placeholder="What time is cake cutting?"
                  className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--guest-gold)]"
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => void send()}
                  disabled={busy}
                  className="h-11 w-11 rounded-xl bg-gold-gradient text-[#011F15] flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
