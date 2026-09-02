import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import KinyaWatoOffer from "@/components/KinyaWatoOffer";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Kinya Coffee × WATO Photo Offer | Visriva",
    description:
      "Kinya Coffee / WATO guest offer at the Visriva photo booth — ₹100 off photo strips. Pay ₹100 for two strips.",
    path: "/kinya-wato",
    keywords: ["Kinya Coffee", "WATO", "Visriva photo booth", "photo strip offer"],
  }),
  robots: { index: false, follow: false },
};

export default function KinyaWatoPage() {
  return <KinyaWatoOffer />;
}
