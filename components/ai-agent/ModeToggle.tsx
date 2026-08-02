"use client";

import type { ConversationMode } from "@/types/whatsapp-agent";

interface ModeToggleProps {
  mode: ConversationMode;
  onChange: (mode: ConversationMode) => void;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function ModeToggle({
  mode,
  onChange,
  size = "md",
  showLabel = true,
}: ModeToggleProps) {
  const isAI = mode === "ai";

  const sizes = {
    sm: { track: { width: 44, height: 24 }, thumb: 18, font: 11, gap: 6 },
    md: { track: { width: 52, height: 28 }, thumb: 22, font: 12, gap: 8 },
    lg: { track: { width: 60, height: 32 }, thumb: 26, font: 13, gap: 10 },
  };
  const s = sizes[size];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: `${s.gap}px`,
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={() => onChange(isAI ? "human" : "ai")}
    >
      {showLabel && (
        <span
          style={{
            fontSize: `${s.font}px`,
            fontWeight: 600,
            color: isAI ? "#10b981" : "#818cf8",
            transition: "color 0.3s ease",
            minWidth: "70px",
          }}
        >
          {isAI ? "🤖 AI Mode" : "👤 Human"}
        </span>
      )}

      <div
        style={{
          width: `${s.track.width}px`,
          height: `${s.track.height}px`,
          borderRadius: `${s.track.height}px`,
          background: isAI
            ? "linear-gradient(135deg, #10b981, #059669)"
            : "linear-gradient(135deg, #6366f1, #4f46e5)",
          position: "relative",
          transition: "background 0.3s ease",
          boxShadow: isAI
            ? "0 0 12px rgba(16, 185, 129, 0.3)"
            : "0 0 12px rgba(99, 102, 241, 0.3)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: `${(s.track.height - s.thumb) / 2}px`,
            left: isAI
              ? `${s.track.width - s.thumb - (s.track.height - s.thumb) / 2}px`
              : `${(s.track.height - s.thumb) / 2}px`,
            width: `${s.thumb}px`,
            height: `${s.thumb}px`,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${s.thumb * 0.55}px`,
          }}
        >
          {isAI ? "🤖" : "👤"}
        </div>
      </div>
    </div>
  );
}
