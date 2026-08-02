"use client";

import { useState, useEffect, useRef } from "react";
import type { WAConversation } from "@/types/whatsapp-agent";
import {
  subscribeConversations,
  formatRelativeTime,
  getInitials,
  getAvatarColor,
  formatPhoneDisplay,
} from "@/lib/ai-agent";

interface ConversationListProps {
  selectedPhone: string | null;
  onSelectConversation: (conv: WAConversation) => void;
  globalAIMode: boolean;
  onToggleGlobalAI: () => void;
}

export default function ConversationList({
  selectedPhone,
  onSelectConversation,
  globalAIMode,
  onToggleGlobalAI,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<WAConversation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeConversations((convs) => {
      setConversations(convs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h2 style={styles.title}>💬 Chats</h2>
          <span style={styles.badge}>{conversations.length}</span>
        </div>

        {/* Global AI Toggle */}
        <button
          onClick={onToggleGlobalAI}
          style={{
            ...styles.globalToggle,
            background: globalAIMode
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, #6366f1, #4f46e5)",
          }}
        >
          <span style={styles.toggleIcon}>{globalAIMode ? "🤖" : "👤"}</span>
          <span style={styles.toggleText}>
            {globalAIMode ? "AI Mode Active" : "Human Mode"}
          </span>
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={styles.clearBtn}
          >
            ✕
          </button>
        )}
      </div>

      {/* Conversation List */}
      <div style={styles.list}>
        {loading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={styles.skeleton}>
                <div style={styles.skeletonAvatar} />
                <div style={styles.skeletonLines}>
                  <div style={{ ...styles.skeletonLine, width: "60%" }} />
                  <div style={{ ...styles.skeletonLine, width: "85%" }} />
                </div>
              </div>
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            {search ? "No conversations match your search" : "No conversations yet"}
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.phone}
              onClick={() => onSelectConversation(conv)}
              style={{
                ...styles.convItem,
                background:
                  selectedPhone === conv.phone
                    ? "rgba(99, 102, 241, 0.15)"
                    : "transparent",
                borderLeft:
                  selectedPhone === conv.phone
                    ? "3px solid #6366f1"
                    : "3px solid transparent",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  ...styles.avatar,
                  backgroundImage: `linear-gradient(135deg, var(--from), var(--to))`,
                }}
                className={`bg-gradient-to-br ${getAvatarColor(conv.phone)}`}
              >
                <div
                  style={{
                    ...styles.avatarInner,
                    background: conv.mode === "ai"
                      ? "linear-gradient(135deg, #10b981, #059669)"
                      : "linear-gradient(135deg, #6366f1, #818cf8)",
                  }}
                >
                  {getInitials(conv.name)}
                </div>
              </div>

              {/* Content */}
              <div style={styles.convContent}>
                <div style={styles.convTop}>
                  <span style={styles.convName}>{conv.name || "Unknown"}</span>
                  <span style={styles.convTime}>
                    {formatRelativeTime(conv.lastActivityAt)}
                  </span>
                </div>
                <div style={styles.convBottom}>
                  <span style={styles.convPreview}>
                    {conv.lastMessageSender === "ai" && "🤖 "}
                    {conv.lastMessageSender === "agent" && "👤 "}
                    {conv.lastMessage || "No messages"}
                  </span>
                  <div style={styles.convMeta}>
                    {conv.unreadCount > 0 && (
                      <span style={styles.unreadBadge}>{conv.unreadCount}</span>
                    )}
                    {conv.mode === "ai" && (
                      <span style={styles.modeDot} title="AI Mode">🤖</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#0f1629",
    borderRight: "1px solid rgba(255,255,255,0.06)",
  },
  header: {
    padding: "16px 16px 8px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  title: {
    fontSize: "18px",
    fontWeight: 700,
    margin: 0,
    color: "#f1f5f9",
  },
  badge: {
    fontSize: "12px",
    fontWeight: 600,
    background: "rgba(99, 102, 241, 0.2)",
    color: "#818cf8",
    padding: "2px 8px",
    borderRadius: "12px",
  },
  globalToggle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    width: "100%",
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 600,
    transition: "all 0.3s ease",
  },
  toggleIcon: {
    fontSize: "16px",
  },
  toggleText: {
    fontSize: "13px",
  },
  searchWrap: {
    padding: "8px 12px",
    position: "relative",
  },
  searchInput: {
    width: "100%",
    padding: "8px 32px 8px 12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  },
  clearBtn: {
    position: "absolute",
    right: "18px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "14px",
    padding: "2px",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
  },
  convItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    width: "100%",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s ease",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  avatar: {
    width: "42px",
    height: "42px",
    flexShrink: 0,
  },
  avatarInner: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "0.5px",
  },
  convContent: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  convTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  convName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#f1f5f9",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  convTime: {
    fontSize: "11px",
    color: "#64748b",
    flexShrink: 0,
    marginLeft: "6px",
  },
  convBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "4px",
  },
  convPreview: {
    fontSize: "12px",
    color: "#94a3b8",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  convMeta: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexShrink: 0,
  },
  unreadBadge: {
    fontSize: "10px",
    fontWeight: 700,
    background: "#10b981",
    color: "#fff",
    padding: "1px 6px",
    borderRadius: "10px",
    minWidth: "18px",
    textAlign: "center",
  },
  modeDot: {
    fontSize: "12px",
  },
  skeleton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px",
  },
  skeletonAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
    flexShrink: 0,
  },
  skeletonLines: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  skeletonLine: {
    height: "10px",
    borderRadius: "4px",
    background: "rgba(255,255,255,0.05)",
  },
  empty: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
  },
};
