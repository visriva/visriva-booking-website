import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "For Our Clients | Visriva Live Station — Weddings & Events",
  description:
    "Discover why couples, families, and corporate hosts choose Visriva Live Station for premium photo booths, live magnets, keychains, mugs, and experiential gifting across Bengaluru and pan-India.",
  path: "/clients",
});

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
