import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Visriva Live Station | Bengaluru’s Premium Live Event Tech & Printing",
  description:
    "Elevate your corporate events, weddings, & VIP celebrations with instantaneous high-definition DSLR photos, custom fridge magnets, bespoke keychains, and live mug printing.",
  keywords: [
    "Live Event Station Bengaluru",
    "Instant Photo Booth Bengaluru",
    "Custom Fridge Magnet Event",
    "Live Keychain Printing",
    "Live Mug Printing Event",
    "Visriva Live Station",
    "Luxury Event Tech India",
  ],
  authors: [{ name: "Visriva Live Station" }],
  openGraph: {
    title: "Visriva Live Station — Luxury Live Printing & Event Tech",
    description:
      "Instant DSLR Photos, Fridge Magnets, Keychains, & Mug Printing for Weddings, Corporate Galas, and VIP Activations in Bengaluru.",
    type: "website",
    locale: "en_IN",
    siteName: "Visriva Live Station",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-emerald-950 text-white font-sans antialiased selection:bg-gold-500 selection:text-emerald-950">
        {children}
      </body>
    </html>
  );
}
