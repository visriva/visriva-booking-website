import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "AI Photo Booth Rental for Events in Bengaluru | Visriva",
  description: "Explore AI photo booth experiences for corporate events, brand activations, weddings and celebrations in Bengaluru and Pune with Visriva Live Station.",
  path: "/ai-photo-booth-experiences",
  keywords: [
    "AI photo booth rental Bengaluru",
    "AI photo booth for corporate events",
    "AI portrait booth for events",
    "AI photo activation for brands",
    "AI photo booth Bangalore",
    "Visriva Live Station",
  ],
});

export default function AIPhotoBoothExperiencesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
