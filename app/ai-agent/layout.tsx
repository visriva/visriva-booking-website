import type { Metadata } from "next";
import AuthGuard from "@/components/ai-agent/AuthGuard";

export const metadata: Metadata = {
  title: "WhatsApp AI Agent | Visriva",
  description: "AI-powered WhatsApp conversation management dashboard",
  robots: "noindex, nofollow",
};

export default function AIAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#0a0e1a",
        color: "#e2e8f0",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <AuthGuard>{children}</AuthGuard>
    </div>
  );
}
