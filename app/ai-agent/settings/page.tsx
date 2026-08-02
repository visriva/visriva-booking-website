"use client";

import SettingsPanel from "@/components/ai-agent/SettingsPanel";

export default function SettingsPage() {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#0a0e1a",
    }}>
      {/* Header Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        background: "#0f1629",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <a
          href="/ai-agent"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#94a3b8",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          ← Back to Chats
        </a>
        <span style={{
          fontSize: "12px",
          color: "#64748b",
        }}>
          WhatsApp AI Agent • Settings
        </span>
      </div>

      {/* Settings Panel */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <SettingsPanel />
      </div>
    </div>
  );
}
