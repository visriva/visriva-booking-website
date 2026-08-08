import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Print Frame Customizer | Visriva Live Station",
  description:
    "Design your custom photo booth print frame with Visriva's interactive frame customizer. Preview themes, colours, and layouts before your event.",
  path: "/frame-customizer",
});

export default function FrameCustomizerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
