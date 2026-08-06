import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/whatsapp", "/operator", "/webbooth", "/webprinter"],
    },
    sitemap: "https://www.visriva.com/sitemap.xml",
  };
}
