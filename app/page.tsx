import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServiceShowcase from "@/components/ServiceShowcase";
import BookingEngine from "@/components/BookingEngine";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-emerald-950 text-white selection:bg-gold-500 selection:text-emerald-950">
      {/* Sticky Glassmorphism Header */}
      <Navbar />

      {/* Section 1: Hero Section */}
      <HeroSection />

      {/* Section 2: Service Showcase (4-Column Grid) */}
      <ServiceShowcase />

      {/* Section 3 & 4: Dynamic Booking Engine & Calendar Integration */}
      <BookingEngine />

      {/* Corporate Luxury Footer */}
      <Footer />
    </main>
  );
}
