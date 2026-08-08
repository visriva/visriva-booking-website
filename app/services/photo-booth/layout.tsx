import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Instant Photo Booth Rental Bengaluru | Visriva Live Station",
  description:
    "Luxury instant photo booth rental in Bengaluru with 8-second dye-sub prints, custom frames, and on-site crew. Perfect for weddings, sangeet, and corporate events across Bangalore.",
  path: "/services/photo-booth",
  keywords: [
    "photo booth rental Bengaluru",
    "wedding photo booth Bangalore",
    "instant print photo booth",
    "corporate photo booth Bangalore",
    "Visriva photo booth",
  ],
});

export default function PhotoBoothLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
