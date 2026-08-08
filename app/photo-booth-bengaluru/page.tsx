import type { Metadata } from "next";
import LocalLandingPage from "@/components/LocalLandingPage";
import { getLocalLandingBySlug } from "@/lib/localLandingPages";
import { buildPageMetadata } from "@/lib/seo";

const SLUG = "photo-booth-bengaluru";
const data = getLocalLandingBySlug(SLUG)!;

export const metadata: Metadata = buildPageMetadata({
  title: data.title,
  description: data.metaDescription,
  path: `/${SLUG}`,
  keywords: data.keywords,
});

export default function PhotoBoothBengaluruPage() {
  return <LocalLandingPage data={data} />;
}
