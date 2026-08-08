import { buildLocalBusinessJsonLd } from "@/lib/seo";

export default function JsonLd() {
  const data = buildLocalBusinessJsonLd();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
