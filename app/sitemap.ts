import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "/reserve", changeFrequency: "daily", priority: 0.95 },
    { path: "/services/photo-booth", changeFrequency: "weekly", priority: 0.9 },
    { path: "/services/magnet-station", changeFrequency: "weekly", priority: 0.85 },
    { path: "/services/keychain-station", changeFrequency: "weekly", priority: 0.85 },
    { path: "/services/mug-printing", changeFrequency: "weekly", priority: 0.85 },
    { path: "/services/tote-tshirt-station", changeFrequency: "weekly", priority: 0.85 },
    { path: "/gallery", changeFrequency: "weekly", priority: 0.7 },
    { path: "/captured-moments", changeFrequency: "weekly", priority: 0.7 },
    { path: "/qr", changeFrequency: "weekly", priority: 0.85 },
    { path: "/frame-customizer", changeFrequency: "monthly", priority: 0.65 },
    { path: "/photo-booth-bengaluru", changeFrequency: "weekly", priority: 0.8 },
    { path: "/wedding-photo-booth-bangalore", changeFrequency: "weekly", priority: 0.8 },
    { path: "/corporate-photo-booth-bangalore", changeFrequency: "weekly", priority: 0.75 },
    { path: "/live-magnet-station-wedding", changeFrequency: "weekly", priority: 0.75 },
    { path: "/event-gifting-station-bangalore", changeFrequency: "weekly", priority: 0.75 },
    { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/data-deletion", changeFrequency: "yearly", priority: 0.3 },
  ];

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
