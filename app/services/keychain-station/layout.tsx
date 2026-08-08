import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Bespoke Keychain Station for Events | Visriva Bengaluru",
  description:
    "Live custom keychain printing station for weddings, birthdays, and corporate events in Bengaluru. Instant personalised keepsakes your guests will treasure.",
  path: "/services/keychain-station",
  keywords: [
    "keychain printing station Bangalore",
    "live keychain wedding",
    "custom keychain event Bengaluru",
    "personalised keychain booth",
  ],
});

export default function KeychainStationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
