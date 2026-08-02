"use client";

import { useState, useEffect } from "react";
import type { WAConversation, ConversationMode, AgentSettings } from "@/types/whatsapp-agent";
import { DEFAULT_AGENT_SETTINGS } from "@/types/whatsapp-agent";
import {
  updateConversationMode,
  subscribeSettings,
  updateSettings,
} from "@/lib/ai-agent";
import ConversationList from "@/components/ai-agent/ConversationList";
import ChatPanel from "@/components/ai-agent/ChatPanel";

type ViewMode = "chat" | "settings";

export default function AIAgentDashboard() {
  const [selectedConversation, setSelectedConversation] = useState<WAConversation | null>(null);
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_AGENT_SETTINGS);
  const [viewMode, setViewMode] = useState<ViewMode>("chat");

  useEffect(() => {
    const unsub = subscribeSettings((s) => setSettings(s));
    return () => unsub();
  }, []);

  const handleSelectConversation = (conv: WAConversation) => {
    setSelectedConversation(conv);
    setViewMode("chat");
  };

  const handleModeChange = async (phone: string, mode: ConversationMode) => {
    await updateConversationMode(phone, mode);
    if (selectedConversation?.phone === phone) {
      setSelectedConversation({ ...selectedConversation, mode });
    }
  };

  const handleToggleGlobalAI = async () => {
    const newEnabled = !settings.aiEnabled;
    setSettings({ ...settings, aiEnabled: newEnabled });
    await updateSettings({ aiEnabled: newEnabled });
  };

  return (
    <div style={styles.dashboard}>
      {/* Left Sidebar — Conversation List */}
      <div style={styles.sidebar}>
        <ConversationList
          selectedPhone={selectedConversation?.phone || null}
          onSelectConversation={handleSelectConversation}
          globalAIMode={settings.aiEnabled}
          onToggleGlobalAI={handleToggleGlobalAI}
        />

        {/* Bottom Nav */}
        <div style={styles.bottomNav}>
          <button
            onClick={() => setViewMode("chat")}
            style={{
              ...styles.navBtn,
              color: viewMode === "chat" ? "#6366f1" : "#64748b",
            }}
          >
            💬 Chats
          </button>
          <button
            onClick={() => setViewMode("settings")}
            style={{
              ...styles.navBtn,
              color: viewMode === "settings" ? "#6366f1" : "#64748b",
            }}
          >
            ⚙️ Settings
          </button>
          <a
            href="/"
            style={styles.navBtn}
            target="_blank"
          >
            🌐 Website
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={styles.mainArea}>
        {viewMode === "chat" ? (
          <ChatPanel
            conversation={selectedConversation}
            onModeChange={handleModeChange}
          />
        ) : (
          <SettingsView />
        )}
      </div>
    </div>
  );
}

// ─── Settings View (lazy-loaded inline) ──────────────────────────────────────

function SettingsView() {
  const [SettingsPanel, setSettingsPanel] = useState<any>(null);

  useEffect(() => {
    import("@/components/ai-agent/SettingsPanel").then((mod) => {
      setSettingsPanel(() => mod.default);
    });
  }, []);

  if (!SettingsPanel) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "#64748b",
        fontSize: "14px",
      }}>
        Loading settings...
      </div>
    );
  }

  return <SettingsPanel />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  dashboard: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    background: "#0a0e1a",
  },
  sidebar: {
    width: "320px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    background: "#0f1629",
  },
  bottomNav: {
    display: "flex",
    justifyContent: "space-around",
    padding: "8px 4px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    background: "#0f1629",
    flexShrink: 0,
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "8px 12px",
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    borderRadius: "6px",
    transition: "all 0.15s ease",
    textDecoration: "none",
  },
  mainArea: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
};
