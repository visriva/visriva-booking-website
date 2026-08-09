import type { Metadata } from "next";

export const SITE_URL = "https://www.visriva.com";
export const SITE_NAME = "Visriva Live Station";
export const DEFAULT_OG_IMAGE = "/og-default.jpg";

export const DEFAULT_CONTACT = {
  phone: "+91 88844 84828",
  email: "visriva.work@gmail.com",
  address: "Bengaluru, Karnataka, India",
  instagram: "https://instagram.com/visriva.live",
  linkedin: "https://linkedin.com/company/visriva",
};

export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function buildServiceJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: { "@type": "LocalBusiness", name: SITE_NAME, url: SITE_URL },
    areaServed: { "@type": "City", name: "Bengaluru" },
    url: `${SITE_URL}${path}`,
  };
}

export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    url: SITE_URL,
    image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
    telephone: DEFAULT_CONTACT.phone,
    email: DEFAULT_CONTACT.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
    areaServed: [
      { "@type": "City", name: "Bengaluru" },
      { "@type": "City", name: "Bangalore" },
      { "@type": "Country", name: "India" },
    ],
    sameAs: [DEFAULT_CONTACT.instagram, DEFAULT_CONTACT.linkedin],
    priceRange: "₹₹₹",
    description:
      "Luxury live experiential gifting and photo booth stations for weddings, corporate events, and celebrations across India.",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Live Event Stations",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Instant Photo Booth",
            url: `${SITE_URL}/services/photo-booth`,
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Custom Fridge Magnet Station",
            url: `${SITE_URL}/services/magnet-station`,
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Bespoke Keychain Station",
            url: `${SITE_URL}/services/keychain-station`,
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Live Mug Printing",
            url: `${SITE_URL}/services/mug-printing`,
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Tote Bag & T-Shirt Station",
            url: `${SITE_URL}/services/tote-tshirt-station`,
          },
        },
      ],
    },
  };
}
