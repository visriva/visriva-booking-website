import type { Metadata } from "next";
import { Cormorant_Garamond, Playfair_Display, Montserrat, Cinzel, Bodoni_Moda } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/react";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-bodoni",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.visriva.com"),
  title: "Visriva Live Station | Premium Event Tech & Photo Booths in Bengaluru",
  description:
    "Bengaluru's luxury live gifting station. Instant Photo Booths, Custom Fridge Magnets, Keychains, and Mug Printing for weddings and corporate events.",
  keywords: [
    "Visriva",
    "Visriva Live Station",
    "Photo booth Bengaluru",
    "Live Magnet Printing Bangalore",
    "Corporate event tech",
    "Visriva Live Booth",
    "Live Mug Printing Bangalore",
  ],
  authors: [{ name: "Visriva Live Station", url: "https://www.visriva.com" }],
  openGraph: {
    title: "Visriva Live Station | Premium Event Tech & Photo Booths in Bengaluru",
    description:
      "Bengaluru's luxury live gifting station. Instant Photo Booths, Custom Fridge Magnets, Keychains, and Mug Printing for weddings and corporate events.",
    url: "https://www.visriva.com",
    siteName: "Visriva Live Station",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Visriva Live Station | Premium Event Tech & Photo Booths in Bengaluru",
    description:
      "Bengaluru's luxury live gifting station. Instant Photo Booths, Custom Fridge Magnets, Keychains, and Mug Printing for weddings and corporate events.",
  },
  icons: {
    icon: "/mycomapnylogo.png",
    shortcut: "/mycomapnylogo.png",
    apple: "/mycomapnylogo.png",
  },
};

import PageTransition from "@/components/PageTransition";
import WhatsAppWidget from "@/components/WhatsAppWidget";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${playfair.variable} ${cinzel.variable} ${bodoni.variable} ${montserrat.variable} overflow-x-hidden w-full`}>
      <head>
        <link rel="icon" href="/icon.png" sizes="any" />
        <link rel="icon" href="/mycomapnylogo.png" sizes="any" />
        <link rel="apple-touch-icon" href="/mycomapnylogo.png" />
      </head>
      <body
        className="relative min-h-screen bg-[#011F15] bg-fixed bg-cover bg-center bg-no-repeat font-sans antialiased text-white selection:bg-[#D4AF37] selection:text-[#011F15] overflow-x-hidden w-full max-w-full"
        style={{ backgroundImage: "url('/background.png')" }}
      >
        {/* ULTRA LUXURY AMBIENT BACKGROUND GLOW HALOS */}
        <div className="fixed top-[-10%] left-[-10%] w-[65vw] h-[65vw] max-w-[800px] max-h-[800px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.22)_0%,_rgba(4,26,18,0.4)_50%,_transparent_70%)] blur-[100px] pointer-events-none z-0 animate-pulse" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[65vw] h-[65vw] max-w-[800px] max-h-[800px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.18)_0%,_rgba(1,31,21,0.5)_50%,_transparent_70%)] blur-[120px] pointer-events-none z-0" />
        <div className="fixed top-[40%] right-[5%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.15)_0%,_transparent_70%)] blur-[90px] pointer-events-none z-0" />

        <div className="relative z-10 min-h-screen overflow-x-hidden w-full">
          <PageTransition>{children}</PageTransition>
          <WhatsAppWidget />
          <SpeedInsights />
        </div>
      </body>
    </html>
  );
}
