import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrustBar from "@/components/TrustBar";
import BentoGrid from "@/components/BentoGrid";
import WhatsIncluded from "@/components/WhatsIncluded";
import WhyVisriva from "@/components/WhyVisriva";
import PortfolioGallery from "@/components/PortfolioGallery";
import PrintFramePreviewer from "@/components/PrintFramePreviewer";
import HomeTestimonialsSection from "@/components/HomeTestimonialsSection";
import GoldenPerksWheel from "@/components/GoldenPerksWheel";
import BookingEngine from "@/components/BookingEngine";
import Footer from "@/components/Footer";

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

      {/* Section 4: What's Included Split-Section */}
      <WhatsIncluded />

      {/* Section 5: Why Visriva Narrative */}
      <WhyVisriva />

      {/* Section 6: Luxury Masonry Portfolio Gallery */}
      <PortfolioGallery />

      {/* Section 6.5: Interactive Custom Print Frame Live Previewer */}
      <PrintFramePreviewer />

      {/* Section 6.75: Client Testimonials */}
      <HomeTestimonialsSection />

      {/* Section 7: Full-width Booking Engine & Budget Estimator */}
      <BookingEngine />

      {/* Interactive Golden Wheel of Perks */}
      <GoldenPerksWheel />

      {/* Corporate Luxury Footer */}
      <Footer />
    </main>
  );
}
