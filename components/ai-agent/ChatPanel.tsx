"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import type { WAConversation, WAMessage, ConversationMode } from "@/types/whatsapp-agent";
import {
  subscribeMessages,
  markConversationRead,
  formatMessageTime,
  formatPhoneDisplay,
  isWindowOpen,
  updateConversationMode,
  updateConversationNotes,
  resolveConversation,
  getInitials,
  getAvatarColor,
} from "@/lib/ai-agent";

interface ChatPanelProps {
  conversation: WAConversation | null;
  onModeChange: (phone: string, mode: ConversationMode) => void;
}

export default function ChatPanel({ conversation, onModeChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<WAMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [notes, setNotes] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Subscribe to messages
  useEffect(() => {
    if (!conversation?.phone) {
      setMessages([]);
      return;
    }

    const unsub = subscribeMessages(conversation.phone, (msgs) => {
      setMessages(msgs);
      // Check if AI is typing (last message from customer, mode is AI)
      if (
        msgs.length > 0 &&
        msgs[msgs.length - 1].sender === "customer" &&
        conversation.mode === "ai"
      ) {
        setAiTyping(true);
        setTimeout(() => setAiTyping(false), 5000);
      } else {
        setAiTyping(false);
      }
    });

    // Mark as read
    markConversationRead(conversation.phone);
    setNotes(conversation.notes || "");

    return () => unsub();
  }, [conversation?.phone]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping]);

  // Stop AI typing when AI message arrives
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].sender !== "customer") {
      setAiTyping(false);
    }
  }, [messages]);

  // Send message
  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !conversation?.phone || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const res = await fetch("/api/ai-agent/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: conversation.phone,
          message: text,
        }),
      });
      const data = await res.json();
      if (data.isWindowExpired) {
        alert("⚠️ The 24-hour messaging window has expired. Only template messages can be sent.");
      }
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!conversation?.phone) return;
    await updateConversationNotes(conversation.phone, notes);
  };

  // Empty state
  if (!conversation) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>💬</div>
        <h3 style={styles.emptyTitle}>WhatsApp AI Agent</h3>
        <p style={styles.emptyDesc}>
          Select a conversation from the sidebar to start managing messages
        </p>
        <div style={styles.emptyStats}>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>🤖</span>
            <span>AI auto-replies</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>👤</span>
            <span>Human takeover</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>📚</span>
            <span>Knowledge Base RAG</span>
          </div>
        </div>
      </div>
    );
  }

  const windowOpen = isWindowOpen(conversation.customerLastMessageAt);

  return (
    <div style={styles.container}>
      {/* Chat Header */}
      <div style={styles.chatHeader}>
        <div style={styles.headerLeft}>
          <div
            style={{
              ...styles.headerAvatar,
              background: conversation.mode === "ai"
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #6366f1, #818cf8)",
            }}
          >
            {getInitials(conversation.name)}
          </div>
          <div>
            <div style={styles.headerName}>{conversation.name}</div>
            <div style={styles.headerPhone}>
              {formatPhoneDisplay(conversation.phone)}
              {!windowOpen && (
                <span style={styles.windowBadge}>⚠️ Window expired</span>
              )}
            </div>
          </div>
        </div>

        <div style={styles.headerRight}>
          {/* Mode Toggle */}
          <button
            onClick={() => {
              const newMode = conversation.mode === "ai" ? "human" : "ai";
              onModeChange(conversation.phone, newMode);
            }}
            style={{
              ...styles.modeBtn,
              background: conversation.mode === "ai"
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #6366f1, #4f46e5)",
            }}
          >
            {conversation.mode === "ai" ? "🤖 AI Mode" : "👤 Human Mode"}
          </button>

          {/* Info toggle */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            style={styles.infoBtn}
          >
            ℹ️
          </button>
        </div>
      </div>

      <div style={styles.chatBody}>
        {/* Messages Area */}
        <div style={styles.messagesArea}>
          {/* Window warning */}
          {!windowOpen && (
            <div style={styles.windowWarning}>
              ⚠️ The 24-hour messaging window has expired. Only template messages can be sent until the customer messages again.
            </div>
          )}

          {messages.length === 0 ? (
            <div style={styles.noMessages}>
              <p>No messages yet</p>
              <p style={{ fontSize: "12px", opacity: 0.6 }}>
                Messages will appear here when the customer sends a message
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                style={{
                  ...styles.messageBubbleWrap,
                  justifyContent: msg.sender === "customer" ? "flex-start" : "flex-end",
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(msg.sender === "customer"
                      ? styles.customerBubble
                      : msg.sender === "ai"
                      ? styles.aiBubble
                      : styles.agentBubble),
                  }}
                >
                  {/* Sender label */}
                  {msg.sender !== "customer" && (
                    <div style={styles.senderLabel}>
                      {msg.sender === "ai" ? "🤖 AI Agent" : "👤 You"}
                      {msg.ragContextUsed && (
                        <span style={styles.ragBadge}>📚 KB</span>
                      )}
                    </div>
                  )}

                  {/* Image preview */}
                  {msg.type === "image" && msg.mediaUrl && (
                    <div style={styles.mediaPreview}>
                      <span style={styles.mediaIcon}>🖼️</span>
                      <span>Image attachment</span>
                    </div>
                  )}

                  {/* Document preview */}
                  {msg.type === "document" && (
                    <div style={styles.mediaPreview}>
                      <span style={styles.mediaIcon}>📄</span>
                      <span>{msg.mediaFilename || "Document"}</span>
                    </div>
                  )}

                  {/* Audio preview */}
                  {msg.type === "audio" && (
                    <div style={styles.mediaPreview}>
                      <span style={styles.mediaIcon}>🎵</span>
                      <span>Audio message</span>
                    </div>
                  )}

                  {/* Text content */}
                  <div style={styles.messageText}>
                    {msg.content}
                  </div>

                  {/* Timestamp and status */}
                  <div style={styles.messageFooter}>
                    <span style={styles.messageTime}>
                      {formatMessageTime(msg.timestamp)}
                    </span>
                    {msg.sender !== "customer" && (
                      <span style={styles.messageStatus}>
                        {msg.status === "read" ? "✓✓" :
                         msg.status === "delivered" ? "✓✓" :
                         msg.status === "sent" ? "✓" :
                         msg.status === "failed" ? "✕" : "⏳"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* AI Typing Indicator */}
          {aiTyping && (
            <div style={{ ...styles.messageBubbleWrap, justifyContent: "flex-end" }}>
              <div style={{ ...styles.messageBubble, ...styles.aiBubble, ...styles.typingBubble }}>
                <div style={styles.senderLabel}>🤖 AI Agent</div>
                <div style={styles.typingDots}>
                  <span style={{ ...styles.dot, animationDelay: "0ms" }}>●</span>
                  <span style={{ ...styles.dot, animationDelay: "200ms" }}>●</span>
                  <span style={{ ...styles.dot, animationDelay: "400ms" }}>●</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Info Panel (collapsible) */}
        {showInfo && (
          <div style={styles.infoPanel}>
            <h4 style={styles.infoPanelTitle}>Contact Info</h4>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Name</span>
              <span style={styles.infoValue}>{conversation.name}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Phone</span>
              <span style={styles.infoValue}>{formatPhoneDisplay(conversation.phone)}</span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Mode</span>
              <span style={{
                ...styles.infoValue,
                color: conversation.mode === "ai" ? "#10b981" : "#818cf8",
              }}>
                {conversation.mode === "ai" ? "🤖 AI Auto-Reply" : "👤 Human Agent"}
              </span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Window</span>
              <span style={{
                ...styles.infoValue,
                color: windowOpen ? "#10b981" : "#ef4444",
              }}>
                {windowOpen ? "✅ Open (24h)" : "❌ Expired"}
              </span>
            </div>

            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Messages</span>
              <span style={styles.infoValue}>{messages.length}</span>
            </div>

            {/* Notes */}
            <div style={{ marginTop: "12px" }}>
              <span style={styles.infoLabel}>Agent Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="Add notes about this customer..."
                style={styles.notesInput}
                rows={3}
              />
            </div>

            {/* Quick Actions */}
            <div style={styles.quickActions}>
              <a
                href={`https://wa.me/${conversation.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.actionBtn}
              >
                📱 Open in WhatsApp
              </a>
              <button
                onClick={() => resolveConversation(conversation.phone, !conversation.resolved)}
                style={{
                  ...styles.actionBtn,
                  background: conversation.resolved
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(16, 185, 129, 0.1)",
                  color: conversation.resolved ? "#ef4444" : "#10b981",
                }}
              >
                {conversation.resolved ? "🔄 Reopen" : "✅ Mark Resolved"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        <form onSubmit={handleSend} style={styles.inputForm}>
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              conversation.mode === "ai"
                ? "AI is handling this chat. Type to send as human agent..."
                : "Type a message..."
            }
            style={styles.textInput}
            rows={1}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            style={{
              ...styles.sendBtn,
              opacity: !inputText.trim() || sending ? 0.4 : 1,
            }}
          >
            {sending ? "⏳" : "➤"}
          </button>
        </form>
      </div>

      {/* CSS for typing animation */}
      <style>{`
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#0a0e1a",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "40px",
    textAlign: "center",
    background: "#0a0e1a",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    filter: "grayscale(0.3)",
  },
  emptyTitle: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#f1f5f9",
    margin: "0 0 8px",
  },
  emptyDesc: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 24px",
    maxWidth: "320px",
  },
  emptyStats: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#94a3b8",
    padding: "8px 14px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  statIcon: { fontSize: "16px" },

  // Chat Header
  chatHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "#0f1629",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 700,
    color: "#fff",
  },
  headerName: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#f1f5f9",
  },
  headerPhone: {
    fontSize: "12px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  windowBadge: {
    fontSize: "10px",
    color: "#f59e0b",
    background: "rgba(245, 158, 11, 0.1)",
    padding: "1px 6px",
    borderRadius: "4px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  modeBtn: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  infoBtn: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    transition: "all 0.2s ease",
  },

  // Chat Body
  chatBody: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },

  // Messages Area
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  windowWarning: {
    padding: "10px 14px",
    background: "rgba(245, 158, 11, 0.1)",
    border: "1px solid rgba(245, 158, 11, 0.2)",
    borderRadius: "8px",
    color: "#f59e0b",
    fontSize: "12px",
    textAlign: "center",
    marginBottom: "8px",
  },
  noMessages: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    color: "#64748b",
    fontSize: "14px",
    textAlign: "center",
  },

  // Message Bubbles
  messageBubbleWrap: {
    display: "flex",
    width: "100%",
    marginBottom: "2px",
  },
  messageBubble: {
    maxWidth: "70%",
    padding: "8px 12px",
    borderRadius: "12px",
    fontSize: "13px",
    lineHeight: "1.5",
    position: "relative",
  },
  customerBubble: {
    background: "rgba(255,255,255,0.07)",
    color: "#e2e8f0",
    borderBottomLeftRadius: "4px",
  },
  aiBubble: {
    background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))",
    color: "#d1fae5",
    borderBottomRightRadius: "4px",
    border: "1px solid rgba(16,185,129,0.15)",
  },
  agentBubble: {
    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.1))",
    color: "#e0e7ff",
    borderBottomRightRadius: "4px",
    border: "1px solid rgba(99,102,241,0.15)",
  },
  senderLabel: {
    fontSize: "10px",
    fontWeight: 600,
    color: "#94a3b8",
    marginBottom: "4px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  ragBadge: {
    fontSize: "9px",
    background: "rgba(168, 85, 247, 0.15)",
    color: "#c084fc",
    padding: "1px 4px",
    borderRadius: "3px",
  },
  messageText: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  messageFooter: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "4px",
    marginTop: "4px",
  },
  messageTime: {
    fontSize: "10px",
    color: "#64748b",
  },
  messageStatus: {
    fontSize: "10px",
    color: "#64748b",
  },
  mediaPreview: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "6px",
    marginBottom: "4px",
    fontSize: "12px",
    color: "#94a3b8",
  },
  mediaIcon: { fontSize: "18px" },

  // Typing
  typingBubble: {
    minWidth: "80px",
  },
  typingDots: {
    display: "flex",
    gap: "4px",
    padding: "4px 0",
  },
  dot: {
    fontSize: "14px",
    color: "#10b981",
    animation: "blink 1.4s ease-in-out infinite",
  },

  // Info Panel
  infoPanel: {
    width: "260px",
    flexShrink: 0,
    padding: "16px",
    background: "#0f1629",
    borderLeft: "1px solid rgba(255,255,255,0.06)",
    overflowY: "auto",
  },
  infoPanelTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#f1f5f9",
    margin: "0 0 14px",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    marginBottom: "10px",
  },
  infoLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  infoValue: {
    fontSize: "13px",
    color: "#e2e8f0",
  },
  notesInput: {
    width: "100%",
    marginTop: "4px",
    padding: "8px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "12px",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  quickActions: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginTop: "12px",
  },
  actionBtn: {
    display: "block",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "6px",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: 500,
    textAlign: "center",
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.15s ease",
  },

  // Input Area
  inputArea: {
    padding: "12px 16px",
    background: "#0f1629",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  inputForm: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
  },
  textInput: {
    flex: 1,
    padding: "10px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    color: "#e2e8f0",
    fontSize: "13px",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    maxHeight: "120px",
    lineHeight: "1.4",
  },
  sendBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s ease",
  },
};
