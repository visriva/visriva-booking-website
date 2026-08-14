import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Captured Moments | Visriva Live Station",
  description:
    "Download your event photos from Visriva Live Station. Follow us on Instagram to unlock high-res captures and Google Drive albums.",
  robots: { index: false, follow: false },
};

export default function CapturedMomentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
