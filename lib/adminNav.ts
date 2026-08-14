import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Calendar,
  CalendarCheck,
  Camera,
  DollarSign,
  FileText,
  Heart,
  Layers,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export type AdminCategory =
  | "dashboard"
  | "branding"
  | "impact"
  | "capturedMoments"
  | "reserve"
  | "services"
  | "clients"
  | "crm"
  | "operator"
  | "ai";

export type AdminTab =
  | "globalSettings"
  | "websiteText"
  | "printPreviewer"
  | "goldenWheel"
  | "pricingServices"
  | "galleryManager"
  | "bookingCRM"
  | "operatorTab"
  | "featureToggles"
  | "bentoGrid"
  | "serviceToggles"
  | "heroCardStudio"
  | "aiConciergeCMS"
  | "aiWhatsAppCMS"
  | "aiWhatsAppScanner"
  | "impactStatsCMS"
  | "capturedMomentsCMS"
  | "testimonialsCMS"
  | "reservePageCMS"
  | "clientsCMS";

export interface AdminNavItem {
  id: AdminCategory;
  label: string;
  description: string;
  icon: LucideIcon;
  defaultTab?: AdminTab;
}

export interface AdminHubLink {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: "gold" | "emerald";
}

export interface AdminSubNavItem {
  id: AdminTab;
  label: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  {
    id: "dashboard",
    label: "Overview",
    description: "Site map & quick access to every editor",
    icon: Layers,
  },
  {
    id: "branding",
    label: "Homepage",
    description: "Hero, bento grid & client feedback",
    icon: FileText,
    defaultTab: "websiteText",
  },
  {
    id: "impact",
    label: "Real Impact",
    description: "Event track record, stats & partner brands",
    icon: TrendingUp,
    defaultTab: "impactStatsCMS",
  },
  {
    id: "capturedMoments",
    label: "Captured Moments",
    description: "Event albums, passwords & Google Drive unlock",
    icon: Camera,
    defaultTab: "capturedMomentsCMS",
  },
  {
    id: "reserve",
    label: "Reserve Page",
    description: "/reserve — booking hero, quote form & packages",
    icon: CalendarCheck,
    defaultTab: "reservePageCMS",
  },
  {
    id: "services",
    label: "Services & Pricing",
    description: "Service pages, packages & feature toggles",
    icon: DollarSign,
    defaultTab: "pricingServices",
  },
  {
    id: "clients",
    label: "Clients Page",
    description: "/clients — client experience & FAQs",
    icon: Heart,
    defaultTab: "clientsCMS",
  },
  {
    id: "crm",
    label: "Leads & Gallery",
    description: "Booking leads, portfolio & contact info",
    icon: Briefcase,
    defaultTab: "bookingCRM",
  },
  {
    id: "operator",
    label: "Crew & On-Site",
    description: "Operator PINs and event-day tools",
    icon: ShieldCheck,
    defaultTab: "operatorTab",
  },
  {
    id: "ai",
    label: "AI Studio",
    description: "Concierge and WhatsApp prompts",
    icon: Sparkles,
    defaultTab: "aiConciergeCMS",
  },
];

export const ADMIN_HUB_LINKS: AdminHubLink[] = [
  {
    label: "Operations Hub",
    description: "Calendar, blocked dates, finance & AI scan",
    href: "/admin/operations",
    icon: Calendar,
    accent: "emerald",
  },
  {
    label: "WhatsApp CRM",
    description: "Inbox, chats & auto-replies",
    href: "/admin/whatsapp",
    icon: MessageCircle,
    accent: "gold",
  },
];

export const ADMIN_SUBNAV: Record<Exclude<AdminCategory, "dashboard">, AdminSubNavItem[]> = {
  branding: [
    { id: "websiteText", label: "Homepage Copy" },
    { id: "heroCardStudio", label: "Hero Cards" },
    { id: "bentoGrid", label: "Bento Grid" },
    { id: "testimonialsCMS", label: "Client Feedback" },
  ],
  impact: [
    { id: "impactStatsCMS", label: "Track Record" },
  ],
  capturedMoments: [
    { id: "capturedMomentsCMS", label: "Event Albums" },
  ],
  reserve: [
    { id: "reservePageCMS", label: "Page Content" },
    { id: "pricingServices", label: "Pricing & Packages" },
    { id: "featureToggles", label: "Service Visibility" },
  ],
  services: [
    { id: "pricingServices", label: "Pricing Matrix" },
    { id: "printPreviewer", label: "Print Previewer" },
    { id: "goldenWheel", label: "Golden Wheel" },
    { id: "serviceToggles", label: "Service Pages" },
    { id: "featureToggles", label: "Feature Toggles" },
  ],
  clients: [{ id: "clientsCMS", label: "Clients Page" }],
  crm: [
    { id: "bookingCRM", label: "Booking Leads" },
    { id: "galleryManager", label: "Gallery" },
    { id: "globalSettings", label: "Contact Info" },
  ],
  operator: [{ id: "operatorTab", label: "Operator Config" }],
  ai: [
    { id: "aiConciergeCMS", label: "Concierge AI" },
    { id: "aiWhatsAppCMS", label: "WhatsApp Templates" },
    { id: "aiWhatsAppScanner", label: "Lead Scanner" },
  ],
};

export interface AdminSitePage {
  path: string;
  label: string;
  category: AdminCategory;
  tab: AdminTab;
  note?: string;
}

export const ADMIN_SITE_PAGES: AdminSitePage[] = [
  { path: "/", label: "Homepage", category: "branding", tab: "websiteText" },
  { path: "/", label: "Real Impact Stats", category: "impact", tab: "impactStatsCMS", note: "Homepage track record counters" },
  { path: "/captured-moments", label: "Captured Moments", category: "capturedMoments", tab: "capturedMomentsCMS", note: "Guest Drive unlock portal" },
  { path: "/clients", label: "Clients Page", category: "clients", tab: "clientsCMS" },
  { path: "/reserve", label: "Reserve / Booking", category: "reserve", tab: "reservePageCMS" },
  { path: "/gallery", label: "Gallery", category: "crm", tab: "galleryManager" },
  { path: "/services/photo-booth", label: "Photo Booth Service", category: "services", tab: "serviceToggles" },
  { path: "/services/magnet-station", label: "Magnet Station", category: "services", tab: "serviceToggles" },
  { path: "/contact", label: "Contact (footer & global)", category: "crm", tab: "globalSettings", note: "Phone, email, WhatsApp" },
];

export function getAdminBreadcrumb(
  category: AdminCategory,
  tab: AdminTab
): { section: string; page: string } {
  const section = ADMIN_NAV.find((n) => n.id === category)?.label || "Admin";
  if (category === "dashboard") return { section: "Admin", page: "Overview" };
  const page =
    ADMIN_SUBNAV[category]?.find((t) => t.id === tab)?.label || "Settings";
  return { section, page };
}
