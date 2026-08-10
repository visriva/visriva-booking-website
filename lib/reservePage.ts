export interface ReservePageUsp {
  icon: string;
  title: string;
  desc: string;
}

export interface ReservePageConfig {
  heroBadge: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  uspItems: ReservePageUsp[];
}

export const DEFAULT_RESERVE_PAGE_CONFIG: ReservePageConfig = {
  heroBadge: "Reserve Your Live Station",
  heroTitle: "Lock In Your Date &",
  heroTitleHighlight: "Instant Quote",
  heroSubtitle:
    "Configure your ideal live event printing setup, get an instant pricing estimate, and submit your booking request.",
  uspItems: [
    { icon: "⚡", title: "8-Sec Prints", desc: "Live dye-sublimation" },
    { icon: "🏅", title: "GST Invoice", desc: "Corporate friendly" },
    { icon: "📱", title: "QR Gallery", desc: "Instant digital share" },
    { icon: "🚀", title: "Zero Setup Fee", desc: "All-inclusive pricing" },
  ],
};
