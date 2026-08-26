import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guest Experience | Visriva Live Station",
  robots: { index: false, follow: false },
};

export default function GuestEventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
