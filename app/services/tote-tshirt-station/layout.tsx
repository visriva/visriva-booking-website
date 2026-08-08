import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Live Tote Bag & T-Shirt Printing Station | Visriva Bengaluru",
  description:
    "On-site live tote bag and t-shirt printing for events in Bengaluru. Custom designs, instant printing, and a premium guest experience for weddings and corporate activations.",
  path: "/services/tote-tshirt-station",
  keywords: [
    "live t-shirt printing event Bangalore",
    "tote bag printing station wedding",
    "custom tee printing Bengaluru",
    "live apparel printing event",
  ],
});

export default function ToteTshirtLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
