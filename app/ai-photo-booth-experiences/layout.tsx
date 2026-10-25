import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "AI Photo Booth for Kids & Families in Bengaluru | Visriva",
  description:
    "Explore themed AI photo booth portrait concepts for kids, families, school celebrations, family days and corporate events in Bengaluru. Discover Young Astronaut, Mini Racing Champion, Magical Fairy and more with Visriva Live Station.",
  path: "/ai-photo-booth-experiences",
  keywords: [
    "AI photo booth Bengaluru",
    "kids photo booth Bengaluru",
    "themed photo booth Bangalore",
    "family day photo booth",
    "kids day event photo booth",
    "corporate family day activities",
    "themed portrait experience",
    "Visriva Live Station",
  ],
});

export default function AIPhotoBoothExperiencesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
