"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Calendar, Menu, X, MapPin } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBooking = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const bookingElem = document.getElementById("booking-engine");
    if (bookingElem) {
      bookingElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav py-3 shadow-2xl" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <a href="#" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-full bg-emerald-900 border border-gold-500/40 flex items-center justify-center shadow-gold-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-wider text-white group-hover:text-gold-400 transition-colors">
                VISRIVA
              </span>
              <span className="block text-[10px] uppercase tracking-[0.25em] text-gold-400 font-medium">
                Live Event Station
              </span>
            </div>
          </a>

          {/* Center Info Badge (Desktop) */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-800 text-xs text-gold-300">
            <MapPin className="w-3.5 h-3.5 text-gold-500 animate-bounce" />
            <span>Serving Luxury Events Across Bengaluru & Pan-India</span>
          </div>

          {/* Desktop Nav Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <a
              href="#services"
              className="text-sm font-medium text-emerald-100 hover:text-gold-400 transition-colors"
            >
              Services
            </a>
            <a
              href="#booking-engine"
              onClick={scrollToBooking}
              className="text-sm font-medium text-emerald-100 hover:text-gold-400 transition-colors"
            >
              Pricing & Tiers
            </a>
            <a
              href="#booking-engine"
              onClick={scrollToBooking}
              className="relative inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-gold-gradient text-emerald-950 font-semibold text-sm shadow-gold-sm hover:shadow-gold-md hover:scale-105 transition-all duration-300 active:scale-95"
            >
              <Calendar className="w-4 h-4 text-emerald-950" />
              <span>Check Availability</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-emerald-900/80 border border-gold-500/30 text-gold-400 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-nav border-t border-gold-500/20 px-4 pt-4 pb-6 mt-3 space-y-4">
          <a
            href="#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-emerald-100 hover:text-gold-400 text-base font-medium py-2"
          >
            Capabilities & Showcase
          </a>
          <a
            href="#booking-engine"
            onClick={scrollToBooking}
            className="block text-emerald-100 hover:text-gold-400 text-base font-medium py-2"
          >
            Live Estimator & Tiers
          </a>
          <div className="pt-2">
            <a
              href="#booking-engine"
              onClick={scrollToBooking}
              className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-gold-gradient text-emerald-950 font-bold text-sm shadow-gold-md"
            >
              <Calendar className="w-4 h-4 text-emerald-950" />
              <span>Check Availability</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
