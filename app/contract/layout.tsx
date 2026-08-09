import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Contract | Visriva Live Station",
  robots: { index: false, follow: false },
};

export default function ContractLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
