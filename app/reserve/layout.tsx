import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reserve Your Live Station | Visriva — Instant Booking",
  description: "Reserve Visriva's premium live event printing stations for your wedding, corporate event, or celebration in Bengaluru & Pune. Get an instant quote and lock in your date today.",
  openGraph: {
    title: "Reserve Your Live Station | Visriva",
    description: "Book Visriva's luxury on-site Photo Booth, Magnets, Keychains, Mugs & Tote Bag Live Printing Stations for your event. Instant quote, instant booking.",
    url: "https://visriva.com/reserve",
  },
};

export default function ReserveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
