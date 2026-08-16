import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import QrGuestHub from "@/components/QrGuestHub";

export const metadata: Metadata = buildPageMetadata({
  title: "Guest Hub QR | Visriva Live Station",
  description:
    "Scan to unlock Visriva Live Station — AI photo gallery, Captured Moments, live event stats, and guest links for your celebration.",
  path: "/qr",
  keywords: [
    "Visriva QR",
    "event guest hub",
    "photo booth gallery Bangalore",
    "captured moments",
    "live station guest",
  ],
});

export default function QrPage() {
  return <QrGuestHub />;
}
