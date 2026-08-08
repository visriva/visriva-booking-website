import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/seo";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const siteTitle = "Visriva Live Station | Premium Event Tech & Photo Booths in Bengaluru";
const siteDescription =
  "Bengaluru's luxury live gifting station. Instant Photo Booths, Custom Fridge Magnets, Keychains, and Mug Printing for weddings and corporate events.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: siteTitle,
  description: siteDescription,
  keywords: [
    "Visriva",
    "Visriva Live Station",
    "Photo booth Bengaluru",
    "Live Magnet Printing Bangalore",
    "Corporate event tech",
    "Visriva Live Booth",
    "Live Mug Printing Bangalore",
  ],
  authors: [{ name: "Visriva Live Station", url: SITE_URL }],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: SITE_URL,
    siteName: "Visriva Live Station",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Visriva Live Station — Luxury Live Event Gifting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [{ url: "/icon.png" }, { url: "/mycomapnylogo.png" }],
    shortcut: "/mycomapnylogo.png",
    apple: "/mycomapnylogo.png",
  },
};

import PageTransition from "@/components/PageTransition";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import JsonLd from "@/components/JsonLd";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable} overflow-x-hidden w-full`}>
      <head>
        <JsonLd />
        {/* Google Tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GTLC8F1PQD"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-GTLC8F1PQD');
          `}
        </Script>
      </head>
      <body
        className="relative min-h-screen bg-[#01140D] bg-fixed bg-cover bg-center bg-no-repeat font-sans antialiased text-white selection:bg-[#D4AF37] selection:text-[#011F15] overflow-x-hidden w-full max-w-full"
        style={{ backgroundImage: "linear-gradient(to bottom, rgba(1, 20, 13, 0.85), rgba(1, 31, 21, 0.88), rgba(1, 18, 11, 0.92)), url('/background.png')" }}
      >
        {/* ULTRA LUXURY MULTI-LAYERED AMBIENT BACKGROUND GLOW HALOS */}
        <div className="fixed top-[-12%] left-[-10%] w-[70vw] h-[70vw] max-w-[850px] max-h-[850px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.24)_0%,_rgba(4,26,18,0.45)_50%,_transparent_70%)] blur-[110px] pointer-events-none z-0 animate-ambient-float" />
        <div className="fixed bottom-[-15%] right-[-10%] w-[75vw] h-[75vw] max-w-[900px] max-h-[900px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.20)_0%,_rgba(1,31,21,0.55)_50%,_transparent_70%)] blur-[130px] pointer-events-none z-0 animate-ambient-float-slow" />
        <div className="fixed top-[35%] right-[2%] w-[50vw] h-[50vw] max-w-[550px] max-h-[550px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.18)_0%,_transparent_70%)] blur-[95px] pointer-events-none z-0 animate-pulse" />

        {/* LUXURY GOLD MICRO-GRID MESH & VIGNETTE OVERLAY */}
        <div className="fixed inset-0 bg-luxury-grid pointer-events-none z-0 opacity-80" />
        <div className="fixed inset-0 bg-vignette pointer-events-none z-0" />

        <div className="relative z-10 min-h-screen overflow-x-hidden w-full">
          <PageTransition>{children}</PageTransition>
          <WhatsAppWidget />
          <SpeedInsights />
        </div>
      </body>
    </html>
  );
}
