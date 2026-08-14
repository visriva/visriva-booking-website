import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "AI Event Gallery | Visriva Live Station",
  description:
    "Unlock your Visriva event photos with facial recognition. Follow @visriva.co on Instagram, get your password via DM, and find your moments.",
  path: "/gallery",
});

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
