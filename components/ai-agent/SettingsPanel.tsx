"use client";

import { useState, useEffect } from "react";
import type { AgentSettings } from "@/types/whatsapp-agent";
import { DEFAULT_AGENT_SETTINGS } from "@/types/whatsapp-agent";
import { subscribeSettings, updateSettings } from "@/lib/ai-agent";
import KnowledgeBaseUploader from "./KnowledgeBaseUploader";

type TabId = "ai" | "kb" | "defaults" | "api";

export default function SettingsPanel() {
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_AGENT_SETTINGS);
  const [activeTab, setActiveTab] = useState<TabId>("ai");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = subscribeSettings((s) => setSettings(s));
    return () => unsub();
  }, []);

  const handleSave = async (updates: Partial<AgentSettings>) => {
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Settings save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "ai", label: "AI Config", icon: "🤖" },
    { id: "kb", label: "Knowledge Base", icon: "📚" },
    { id: "defaults", label: "Defaults", icon: "⚙️" },
    { id: "api", label: "API & Status", icon: "🔌" },
  ];

  if (!settings) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>⚙️ Settings</h2>
        </div>
        <div style={{ padding: "20px", color: "#64748b" }}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>⚙️ Settings</h2>
        {saved && <span style={styles.savedBadge}>✅ Saved</span>}
        {saving && <span style={styles.savingBadge}>Saving...</span>}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {/* AI Configuration */}
        {activeTab === "ai" && (
          <div style={styles.section}>
            <div style={styles.field}>
              <label style={styles.label}>System Prompt</label>
              <p style={styles.hint}>
                This prompt controls how the AI behaves. It's sent as context with every message.
              </p>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                onBlur={() => handleSave({ systemPrompt: settings.systemPrompt })}
                style={styles.textarea}
                rows={12}
                placeholder="Enter system prompt..."
              />
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Gemini Model</label>
                <select
                  value={settings.geminiModel}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings({ ...settings, geminiModel: val });
                    handleSave({ geminiModel: val });
                  }}
                  style={styles.select}
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Temperature: {settings.temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSettings({ ...settings, temperature: val });
                  }}
                  onMouseUp={() => handleSave({ temperature: settings.temperature })}
                  onTouchEnd={() => handleSave({ temperature: settings.temperature })}
                  style={styles.slider}
                />
                <div style={styles.sliderLabels}>
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Max Output Tokens</label>
              <input
                type="number"
                value={settings.maxTokens}
                onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) || 800 })}
                onBlur={() => handleSave({ maxTokens: settings.maxTokens })}
                style={styles.input}
                min={100}
                max={4096}
              />
            </div>
          </div>
        )}

        {/* Knowledge Base */}
        {activeTab === "kb" && (
          <div style={styles.section}>
            <KnowledgeBaseUploader />
          </div>
        )}

        {/* Defaults */}
        {activeTab === "defaults" && (
          <div style={styles.section}>
            <div style={styles.field}>
              <label style={styles.label}>AI Auto-Reply</label>
              <p style={styles.hint}>
                When enabled, AI will automatically respond to incoming messages.
              </p>
              <button
                onClick={() => {
                  const val = !settings.aiEnabled;
                  setSettings({ ...settings, aiEnabled: val });
                  handleSave({ aiEnabled: val });
                }}
                style={{
                  ...styles.toggleBtn,
                  background: settings.aiEnabled
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : "rgba(255,255,255,0.05)",
                  borderColor: settings.aiEnabled
                    ? "rgba(16, 185, 129, 0.3)"
                    : "rgba(255,255,255,0.1)",
                }}
              >
                {settings.aiEnabled ? "🤖 AI Enabled" : "⏸️ AI Disabled"}
              </button>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Default Mode for New Conversations</label>
              <select
                value={settings.defaultMode}
                onChange={(e) => {
                  const val = e.target.value as "ai" | "human";
                  setSettings({ ...settings, defaultMode: val });
                  handleSave({ defaultMode: val });
                }}
                style={styles.select}
              >
                <option value="ai">🤖 AI Mode — Auto-reply with AI</option>
                <option value="human">👤 Human Mode — Wait for agent</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Greeting Message</label>
              <p style={styles.hint}>
                Sent to new conversations (leave empty to disable).
              </p>
              <textarea
                value={settings.greetingMessage}
                onChange={(e) => setSettings({ ...settings, greetingMessage: e.target.value })}
                onBlur={() => handleSave({ greetingMessage: settings.greetingMessage })}
                style={styles.textarea}
                rows={3}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Away Message</label>
              <p style={styles.hint}>
                Sent when AI is disabled and no human agent is available.
              </p>
              <textarea
                value={settings.awayMessage}
                onChange={(e) => setSettings({ ...settings, awayMessage: e.target.value })}
                onBlur={() => handleSave({ awayMessage: settings.awayMessage })}
                style={styles.textarea}
                rows={3}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Auto Read Receipts</label>
              <button
                onClick={() => {
                  const val = !settings.autoReadReceipts;
                  setSettings({ ...settings, autoReadReceipts: val });
                  handleSave({ autoReadReceipts: val });
                }}
                style={{
                  ...styles.toggleBtn,
                  background: settings.autoReadReceipts
                    ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                    : "rgba(255,255,255,0.05)",
                  borderColor: settings.autoReadReceipts
                    ? "rgba(99, 102, 241, 0.3)"
                    : "rgba(255,255,255,0.1)",
                }}
              >
                {settings.autoReadReceipts ? "✅ Enabled" : "❌ Disabled"}
              </button>
            </div>
          </div>
        )}

        {/* API & Status */}
        {activeTab === "api" && (
          <div style={styles.section}>
            <div style={styles.field}>
              <label style={styles.label}>Gemini API Key</label>
              <p style={styles.hint}>
                Stored in server environment (.env.local). Currently configured:
              </p>
              <div style={styles.apiStatus}>
                <span style={styles.statusDot}>●</span>
                <span>Gemini API Key: Configured ✅</span>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>WhatsApp Business API</label>
              <div style={styles.apiStatus}>
                <span style={styles.statusDot}>●</span>
                <span>Meta Cloud API: Configured ✅</span>
              </div>
              <div style={styles.apiDetail}>
                Phone Number ID: {process.env.NEXT_PUBLIC_WA_PHONE_ID || "••••••"}
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Webhook URL</label>
              <p style={styles.hint}>
                Configure this URL in your Meta App Dashboard:
              </p>
              <div style={styles.codeBlock}>
                https://www.visriva.com/api/whatsapp/webhook
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Verify Token</label>
              <div style={styles.codeBlock}>
                visriva_whatsapp_verify_token_2026
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Version Info</label>
              <div style={styles.apiDetail}>
                WhatsApp AI Agent v1.0.0<br />
                Framework: Next.js 13 + Firestore<br />
                AI: Gemini 2.5 Flash<br />
                RAG: Keyword-based (Firestore)<br />
                Contact: visriva.work@gmail.com
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "#0a0e1a",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "#0f1629",
    flexShrink: 0,
  },
  title: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#f1f5f9",
    margin: 0,
  },
  savedBadge: {
    fontSize: "12px",
    color: "#34d399",
    background: "rgba(16, 185, 129, 0.1)",
    padding: "3px 10px",
    borderRadius: "6px",
  },
  savingBadge: {
    fontSize: "12px",
    color: "#f59e0b",
    background: "rgba(245, 158, 11, 0.1)",
    padding: "3px 10px",
    borderRadius: "6px",
  },
  tabs: {
    display: "flex",
    padding: "0 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "#0f1629",
    overflowX: "auto",
    flexShrink: 0,
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 14px",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
  },
  tabActive: {
    color: "#f1f5f9",
    borderBottomColor: "#6366f1",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
  },
  section: {
    maxWidth: "640px",
  },
  field: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#e2e8f0",
    marginBottom: "4px",
  },
  hint: {
    fontSize: "12px",
    color: "#64748b",
    margin: "0 0 8px",
    lineHeight: "1.4",
  },
  textarea: {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "13px",
    resize: "vertical",
    outline: "none",
    fontFamily: "'Inter', monospace",
    lineHeight: "1.5",
    boxSizing: "border-box",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "13px",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    background: "#0f1629",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "13px",
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  slider: {
    width: "100%",
    accentColor: "#6366f1",
    cursor: "pointer",
  },
  sliderLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "10px",
    color: "#64748b",
    marginTop: "2px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  toggleBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid",
    cursor: "pointer",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  apiStatus: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#94a3b8",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "6px",
    marginBottom: "6px",
  },
  statusDot: {
    color: "#10b981",
    fontSize: "10px",
  },
  apiDetail: {
    fontSize: "12px",
    color: "#64748b",
    padding: "6px 12px",
    lineHeight: "1.6",
  },
  codeBlock: {
    padding: "10px 14px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: "6px",
    color: "#94a3b8",
    fontSize: "12px",
    fontFamily: "'Courier New', monospace",
    wordBreak: "break-all",
  },
};
