import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Guest Photo Gallery | Visriva Live Station",
  description:
    "Download your event photos from Visriva Live Station. Enter your event code to access your private guest photo gallery.",
  path: "/gallery",
});

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
