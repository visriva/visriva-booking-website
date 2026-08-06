import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visriva Web Booth",
  robots: { index: false, follow: false },
};

export default function WebBoothLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-hidden w-full max-w-full fixed inset-0">
      {children}
    </div>
  );
}
