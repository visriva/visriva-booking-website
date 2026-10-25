import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "VR Engagement for Corporate Events in Bengaluru | Visriva",
  description: "Explore virtual reality engagement experiences for corporate events, employee days, exhibitions, brand activations and family celebrations in Bengaluru and Pune with Visriva Live Station.",
  path: "/vr-engagement",
  keywords: [
    "VR experience rental Bengaluru",
    "VR games for corporate events",
    "virtual reality event activation",
    "VR engagement activities for employees",
    "VR event setup Bangalore",
    "Visriva Live Station",
  ],
});

export default function VREngagementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
