import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin Control Panel",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-root">{children}</div>;
}
