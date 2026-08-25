import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrustBar from "@/components/TrustBar";
import BentoGrid from "@/components/BentoGrid";
import PortfolioGallery from "@/components/PortfolioGallery";
import WhatsIncluded from "@/components/WhatsIncluded";
import WhyVisriva from "@/components/WhyVisriva";
import PrintFramePreviewer from "@/components/PrintFramePreviewer";
import HomeTestimonialsSection from "@/components/HomeTestimonialsSection";
import ClientConcerns from "@/components/ClientConcerns";
import GoldenPerksWheel from "@/components/GoldenPerksWheel";
import BookingEngine from "@/components/BookingEngine";
import Footer from "@/components/Footer";

/**
 * Homepage order follows the client's decision path: interest → proof → detail
 * → reassurance → incentive → book. Two ordering constraints are load-bearing:
 *
 *  - GoldenPerksWheel must precede BookingEngine. The wheel writes its perk to
 *    localStorage and fires `visriva_perk_applied`, which BookingEngine listens
 *    for to discount the live estimate. Downstream of the form, a visitor only
 *    meets the offer after they have already submitted.
 *  - ClientConcerns copy points backwards to PrintFramePreviewer ("further up
 *    this page") and forwards to the estimator ("below"), so it sits between
 *    them.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-transparent text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
      {/* Sticky Glassmorphism Header */}
      <Navbar />

      {/* Section 1: Hero Section */}
      <HeroSection />

      {/* Section 2: Trust & Reputation Bar */}
      <TrustBar />

      {/* Section 3: Premium Service Bento Grid */}
      <BentoGrid />

      {/* Section 4: Luxury Masonry Portfolio Gallery — the work is the pitch,
          so it runs before the written detail rather than after it. */}
      <PortfolioGallery />

      {/* Section 5: What's Included Split-Section */}
      <WhatsIncluded />

      {/* Section 6: Why Visriva Narrative */}
      <WhyVisriva />

      {/* Section 7: Interactive Custom Print Frame Live Previewer */}
      <PrintFramePreviewer />

      {/* Section 8: Client Testimonials */}
      <HomeTestimonialsSection />

      {/* Section 9: Pre-Booking Objection Handling */}
      <ClientConcerns />

      {/* Section 10: Interactive Golden Wheel of Perks — must stay ahead of the
          booking engine so the won perk reaches the live estimate. */}
      <GoldenPerksWheel />

      {/* Section 11: Full-width Booking Engine & Budget Estimator */}
      <BookingEngine />

      {/* Corporate Luxury Footer */}
      <Footer />
    </main>
  );
}
