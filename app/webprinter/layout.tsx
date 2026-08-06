import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visriva Web Print Node",
  robots: { index: false, follow: false },
};

export default function WebPrinterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-hidden w-full max-w-full min-h-screen">
      {children}
    </div>
  );
}
