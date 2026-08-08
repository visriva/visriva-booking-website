import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Live Fridge Magnet Station for Weddings | Visriva Bengaluru",
  description:
    "On-site live fridge magnet printing for weddings and events in Bengaluru. Guests receive personalised magnet keepsakes in minutes. Premium setup, professional crew.",
  path: "/services/magnet-station",
  keywords: [
    "live magnet station wedding",
    "fridge magnet printing Bangalore",
    "wedding magnet booth Bengaluru",
    "custom fridge magnets event",
  ],
});

export default function MagnetStationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
