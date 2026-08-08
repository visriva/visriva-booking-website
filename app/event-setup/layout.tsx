import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event-Day Setup Guide | Visriva Crew",
  description: "Pre-event checklist and LAN setup guide for Visriva on-site crew.",
  robots: { index: false, follow: false },
};

export default function EventSetupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
