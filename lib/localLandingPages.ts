export interface LocalLandingFaq {
  question: string;
  answer: string;
}

export interface LocalLandingPageData {
  slug: string;
  title: string;
  metaDescription: string;
  keywords: string[];
  headline: string;
  subheadline: string;
  intro: string;
  highlights: string[];
  serviceLink: { href: string; label: string };
  faqs: LocalLandingFaq[];
}

export const LOCAL_LANDING_PAGES: LocalLandingPageData[] = [
  {
    slug: "photo-booth-bengaluru",
    title: "Photo Booth Rental Bengaluru | Visriva Live Station",
    metaDescription:
      "Premium photo booth rental in Bengaluru with 8-second dye-sub prints, custom frames, and on-site crew. Book Visriva for weddings, sangeet, and corporate events across Bangalore.",
    keywords: [
      "photo booth rental Bengaluru",
      "photo booth Bangalore",
      "instant print photo booth",
      "wedding photo booth Bengaluru",
    ],
    headline: "Photo Booth Rental in Bengaluru",
    subheadline: "Luxury instant prints. Professional crew. Unforgettable guest moments.",
    intro:
      "Visriva Live Station brings Bengaluru's most premium on-site photo booth experience to your wedding, sangeet, reception, or corporate gala. Our dye-sub printer delivers lab-quality 2×6 photo strips in under 8 seconds — so guests never wait in long queues.",
    highlights: [
      "8-second dye-sub instant prints with custom branded frames",
      "On-site Visriva crew handles setup, flow, and guest experience",
      "Perfect for weddings, sangeet nights, and corporate activations",
      "Pan-India travel available for destination events",
    ],
    serviceLink: { href: "/services/photo-booth", label: "Explore Photo Booth Packages" },
    faqs: [
      {
        question: "How much does a photo booth cost in Bengaluru?",
        answer:
          "Pricing depends on event duration, guest count, and package tier. Use our instant quote tool on the reserve page or WhatsApp us for a same-day estimate tailored to your venue and date.",
      },
      {
        question: "Do you travel outside Bengaluru?",
        answer:
          "Yes. Visriva serves Bengaluru, Bangalore metro venues, and pan-India destination weddings and corporate events.",
      },
      {
        question: "How fast are the prints?",
        answer:
          "Our dye-sub system prints high-quality 2×6 strips in approximately 8 seconds per guest.",
      },
    ],
  },
  {
    slug: "wedding-photo-booth-bangalore",
    title: "Wedding Photo Booth Bangalore | Visriva Live Station",
    metaDescription:
      "Luxury wedding photo booth in Bangalore with instant prints, custom couple frames, and a professional on-site crew. Make your sangeet and reception unforgettable with Visriva.",
    keywords: [
      "wedding photo booth Bangalore",
      "sangeet photo booth Bengaluru",
      "reception photo booth rental",
      "wedding instant prints Bangalore",
    ],
    headline: "Wedding Photo Booth in Bangalore",
    subheadline: "Turn every guest into a storyteller with instant luxury keepsakes.",
    intro:
      "Your wedding deserves more than a basic selfie corner. Visriva's wedding photo booth stations combine cinematic lighting, bespoke print frames featuring your names and wedding date, and an experienced crew who keeps the line moving and the energy high.",
    highlights: [
      "Custom wedding frames with couple names, monogram, and event date",
      "Ideal for sangeet, reception, and post-wedding brunch events",
      "Guests receive physical strips instantly — perfect for sharing and scrapbooks",
      "Pairs beautifully with our live magnet and mug stations",
    ],
    serviceLink: { href: "/services/photo-booth", label: "View Wedding Photo Booth Options" },
    faqs: [
      {
        question: "Can you match our wedding theme colours?",
        answer:
          "Absolutely. We customise print frame designs, backdrop styling, and on-screen overlays to align with your wedding palette and decor vision.",
      },
      {
        question: "Is the booth suitable for large Indian weddings?",
        answer:
          "Yes. Our crew is trained for high-volume events and we optimise queue flow so hundreds of guests can enjoy the booth without bottlenecks.",
      },
      {
        question: "Do you offer combo packages with magnets or mugs?",
        answer:
          "Yes. Many couples book our photo booth alongside live magnet or mug printing stations for a complete live gifting experience.",
      },
    ],
  },
  {
    slug: "corporate-photo-booth-bangalore",
    title: "Corporate Photo Booth Bangalore | Visriva Live Station",
    metaDescription:
      "Branded corporate photo booth for conferences, product launches, and team events in Bangalore. Instant prints, logo frames, and professional on-site crew from Visriva.",
    keywords: [
      "corporate photo booth Bangalore",
      "event activation Bengaluru",
      "branded photo booth corporate",
      "conference photo booth rental",
    ],
    headline: "Corporate Photo Booth in Bangalore",
    subheadline: "Branded activations that employees and clients actually queue for.",
    intro:
      "From product launches to annual day celebrations, Visriva delivers polished corporate photo booth experiences with your logo, campaign hashtag, and brand colours baked into every print. Our team manages the full on-site operation so your event runs on schedule.",
    highlights: [
      "Full brand customisation — logo frames, hashtags, and campaign messaging",
      "Ideal for conferences, offsites, store openings, and client appreciation events",
      "Instant shareable keepsakes that extend your brand beyond the venue",
      "GST invoices and planner-friendly coordination available",
    ],
    serviceLink: { href: "/services/photo-booth", label: "Corporate Photo Booth Details" },
    faqs: [
      {
        question: "Can you add our company logo to every print?",
        answer:
          "Yes. We design custom print frames and digital overlays featuring your logo, event name, and campaign hashtag.",
      },
      {
        question: "Do you work with event agencies?",
        answer:
          "Yes. We partner with planners and agencies across Bangalore with net vendor rates and co-branded setups. Visit our planners page for partnership details.",
      },
      {
        question: "What space and power do you need?",
        answer:
          "Typically a 10×10 ft footprint and one standard power outlet. We share a detailed tech rider after booking confirmation.",
      },
    ],
  },
  {
    slug: "live-magnet-station-wedding",
    title: "Live Fridge Magnet Station for Weddings | Visriva",
    metaDescription:
      "On-site live fridge magnet printing for weddings in Bengaluru and across India. Guests watch their photos become personalised magnet keepsakes in minutes.",
    keywords: [
      "live magnet station wedding",
      "fridge magnet printing wedding Bangalore",
      "wedding magnet booth Bengaluru",
      "personalised wedding magnets",
    ],
    headline: "Live Magnet Station for Weddings",
    subheadline: "The guest favourite that turns every smile into a fridge-worthy keepsake.",
    intro:
      "Visriva's live fridge magnet station is one of the most talked-about activations at modern Indian weddings. Guests pose, pick a design, and watch their photo printed and mounted as a premium magnet — a tangible memory they take home the same night.",
    highlights: [
      "Live on-site printing — guests see the magic happen in real time",
      "Custom wedding branding on magnet templates",
      "Compact footprint fits sangeet lounges and reception foyers",
      "High repeat engagement — guests return with friends and family",
    ],
    serviceLink: { href: "/services/magnet-station", label: "Magnet Station Packages" },
    faqs: [
      {
        question: "How long does each magnet take?",
        answer:
          "Each personalised magnet is typically ready within a few minutes, depending on guest volume. Our crew manages queue flow to keep wait times reasonable.",
      },
      {
        question: "What magnet sizes do you offer?",
        answer:
          "We offer standard fridge magnet sizes suited for wedding keepsakes. Package details and sizing options are available on our magnet station service page.",
      },
      {
        question: "Can this run alongside a photo booth?",
        answer:
          "Yes. Photo booth plus magnet station is one of our most popular wedding combos — guests get both a print strip and a magnet.",
      },
    ],
  },
  {
    slug: "event-gifting-station-bangalore",
    title: "Live Event Gifting Station Bangalore | Visriva",
    metaDescription:
      "Luxury live event gifting stations in Bangalore — photo booths, magnets, keychains, mugs, and tote printing. On-site personalised keepsakes for weddings and corporate events.",
    keywords: [
      "event gifting station Bangalore",
      "live gifting station wedding",
      "personalised event gifts Bengaluru",
      "on-site gift printing event",
    ],
    headline: "Live Event Gifting Station in Bangalore",
    subheadline: "Not just a booth — a full live gifting experience your guests will remember.",
    intro:
      "Visriva Live Station is Bengaluru's luxury live experiential gifting company. We set up on-site stations where guests receive personalised keepsakes in real time — photo strips, fridge magnets, keychains, mugs, and tote bags — all produced live at your event.",
    highlights: [
      "Five live station types: photo booth, magnets, keychains, mugs, and totes",
      "One crew, one seamless guest experience across multiple activations",
      "Premium emerald-and-gold setup that elevates any venue",
      "Trusted by couples, corporates, and top event planners in Bangalore",
    ],
    serviceLink: { href: "/reserve", label: "Get an Instant Quote" },
    faqs: [
      {
        question: "What is a live gifting station?",
        answer:
          "A live gifting station is an on-site activation where guests receive personalised physical keepsakes — printed, pressed, or mounted — during your event, not days later.",
      },
      {
        question: "Which station is best for my event?",
        answer:
          "Photo booths suit most events. Weddings love magnets and mugs. Corporate events often choose branded photo booths and tote stations. Our AI concierge or team can recommend the best mix.",
      },
      {
        question: "How do I book Visriva for my Bangalore event?",
        answer:
          "Visit our reserve page for an instant quote, or WhatsApp us at +91 88844 84828. We confirm availability and share a detailed proposal within hours.",
      },
    ],
  },
];

export function getLocalLandingBySlug(slug: string): LocalLandingPageData | undefined {
  return LOCAL_LANDING_PAGES.find((p) => p.slug === slug);
}

export function buildFaqJsonLd(faqs: LocalLandingFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
