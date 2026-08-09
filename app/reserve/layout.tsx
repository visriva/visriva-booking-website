import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Reserve Your Live Station | Visriva — Instant Quote & Booking",
  description:
    "Reserve Visriva's premium live photo booth, magnet, keychain, and mug printing stations for weddings, corporate events, and celebrations in Bengaluru and pan-India. Instant quote and date hold.",
  path: "/reserve",
  keywords: [
    "book photo booth Bengaluru",
    "Visriva reserve",
    "event booking Bangalore",
    "live gifting station quote",
  ],
});

export default function ReserveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
