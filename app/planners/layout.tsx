import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner With Visriva | Event Planner & Decorator Rates",
  description: "Exclusive net vendor rates for event planners and decorators. Partner with Visriva Live Station for premium live photo booths, magnets, keychains, mugs, and tote printing stations in Bengaluru & Pune.",
  robots: { index: false, follow: false }, // Hidden from search engines
};

export default function PlannersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
