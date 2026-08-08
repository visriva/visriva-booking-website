import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Live Mug Printing Station Bengaluru | Visriva",
  description:
    "Watch your photo appear on a mug in real time. Visriva's live mug printing station for weddings, corporate events, and celebrations across Bengaluru and India.",
  path: "/services/mug-printing",
  keywords: [
    "live mug printing Bangalore",
    "photo mug printing wedding",
    "custom mug station Bengaluru",
    "event mug printing India",
  ],
});

export default function MugPrintingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
