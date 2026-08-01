"use client";

import React, { useState, useEffect, useRef } from "react";
import { Menu, X, Calendar, Camera, Magnet, Key, Coffee, ShieldCheck, Sparkles, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import Magnetic3DButton from "@/components/Magnetic3DButton";
import {
  subscribeGlobalContactSettings,
  DEFAULT_GLOBAL_SETTINGS,
  GlobalSettingsConfig,
  subscribeFeatureToggles,
  DEFAULT_FEATURE_TOGGLES,
  FeatureTogglesConfig,
} from "@/lib/firebase";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contact, setContact] = useState<GlobalSettingsConfig>(DEFAULT_GLOBAL_SETTINGS);
  const [toggles, setToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubContact = subscribeGlobalContactSettings((data) => {
      if (data) setContact(data);
    });
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) setToggles(data);
    });
    return () => {
      unsubContact();
      unsubToggles();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen]);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMenuOpen(false);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  return (
    <header
      ref={menuRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav py-3 shadow-2xl" : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between relative">
          
          {/* LEFT SIDE: Menu Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-black/40 border border-[#D4AF37]/40 text-[#D4AF37] hover:border-[#D4AF37] hover:bg-black/60 hover:text-white transition-all backdrop-blur-md focus:outline-none cursor-pointer shadow-gold-sm"
              aria-label="Toggle Menu"
            >
              {menuOpen ? <X className="w-5 h-5 text-[#D4AF37]" /> : <Menu className="w-5 h-5 text-[#D4AF37]" />}
              <span className="hidden sm:inline text-xs font-bogale uppercase tracking-wider text-[#D4AF37] font-bold">Menu</span>
            </button>
          </div>

          {/* CENTER: VISRIVA LOGO */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <a href="/" className="group inline-block">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                whileHover={{ scale: 1.06 }}
                className="cursor-pointer"
              >
                <Image
                  src="/mycomapnylogo.png"
                  alt="Visriva Falcon Logo"
                  width={260}
                  height={90}
                  priority
                  className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.6)] group-hover:drop-shadow-[0_0_30px_rgba(212,175,55,0.9)] transition-all duration-300"
                />
              </motion.div>
            </a>
          </div>

          {/* RIGHT SIDE: Mobile Compact Check Availability Button */}
          <div className="flex items-center">
            <Magnetic3DButton onClick={(e) => scrollToSection(e, "booking-engine")} href="/#booking-engine">
              <div className="relative inline-flex items-center space-x-1.5 px-3 py-1.5 text-[11px] sm:px-5 sm:py-2.5 sm:text-sm font-bold rounded-full bg-gold-gradient text-[#011F15] shadow-gold-sm hover:shadow-gold-md transition-all duration-300 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#011F15]" />
                <span>Check Availability</span>
              </div>
            </Magnetic3DButton>
          </div>

        </div>
      </div>

      {/* Luxury Glass Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3"
          >
            <div className="glass-card rounded-2xl p-6 border border-[#D4AF37]/40 max-w-md space-y-2.5 shadow-2xl backdrop-blur-2xl bg-[#011F15]/95">
              <div className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-catilya pb-2 border-b border-white/10 flex items-center justify-between font-bold">
                <span>Services &amp; Portals</span>
                <span className="text-[10px] font-graven text-emerald-200/60 font-normal">Live Options</span>
              </div>

              {/* Service 1: Photo Booth */}
              {toggles.enablePhotoBoothService !== false && (
                <a
                  href="/photo-booth"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-white hover:text-[#D4AF37] font-medium py-2 px-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <Camera className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-aylia text-sm uppercase tracking-wider">Instant Photo Booth</span>
                  </div>
                  <span className="text-[11px] font-graven text-emerald-200/70">8-Sec Dye-Sub Print</span>
                </a>
              )}

              {/* Service 2: Fridge Magnet */}
              {toggles.enableMagnetService !== false && (
                <a
                  href="/services/magnet-station"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-white hover:text-[#D4AF37] font-medium py-2 px-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <Magnet className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-aylia text-sm uppercase tracking-wider">Fridge Magnet Station</span>
                  </div>
                  <span className="text-[11px] font-graven text-emerald-200/70">Acrylic Gloss Frame</span>
                </a>
              )}

              {/* Service 3: Keychains */}
              {toggles.enableKeychainService !== false && (
                <a
                  href="/services/keychain-station"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-white hover:text-[#D4AF37] font-medium py-2 px-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <Key className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-aylia text-sm uppercase tracking-wider">Keychain Station</span>
                  </div>
                  <span className="text-[11px] font-graven text-emerald-200/70">Bespoke Metal / Acrylic</span>
                </a>
              )}

              {/* Service 4: Mug Printing */}
              {toggles.enableMugService !== false && (
                <a
                  href="/services/mug-printing"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-white hover:text-[#D4AF37] font-medium py-2 px-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <Coffee className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-aylia text-sm uppercase tracking-wider">Live Mug Printing</span>
                  </div>
                  <span className="text-[11px] font-graven text-emerald-200/70">Sublimation VIP Gift</span>
                </a>
              )}

              {/* Service 5: Tote Bag & T-Shirt Station */}
              {toggles.enableToteTshirtService !== false && (
                <a
                  href="/services/tote-tshirt-station"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-white hover:text-[#D4AF37] font-medium py-2 px-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-aylia text-sm uppercase tracking-wider">Tote Bag &amp; Tee Station</span>
                  </div>
                  <span className="text-[11px] font-graven text-emerald-200/70">Canvas Sublimation</span>
                </a>
              )}

              {/* Feature Portal 1: On-Site Crew Command Center */}
              {toggles.showOperatorInNavbar !== false && toggles.enableOperatorPortal !== false && (
                <a
                  href="/operator"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-amber-200 font-bold py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-400/30 hover:bg-amber-500 hover:text-[#011F15] transition-all"
                >
                  <div className="flex items-center space-x-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-aylia text-sm uppercase tracking-wider">Crew Command Center</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-[#D4AF37] text-black px-2 py-0.5 rounded font-bold">/operator</span>
                </a>
              )}

              {/* Feature Portal 2: Guest Photo Portal */}
              {toggles.enableGuestGallery !== false && (
                <a
                  href="/gallery"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-[#D4AF37] font-bold py-2 px-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-[#011F15] transition-all"
                >
                  <div className="flex items-center space-x-2.5">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-aylia text-sm uppercase tracking-wider">Guest Photo Portal</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-[#D4AF37] text-black px-2 py-0.5 rounded font-bold">Download</span>
                </a>
              )}

              {/* Feature Portal 3: Print Frame Customizer */}
              {toggles.enableFrameCustomizer !== false && (
                <a
                  href="/frame-customizer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-[#D4AF37] font-bold py-2 px-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-[#011F15] transition-all"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base">🎨</span>
                    <span className="font-aylia text-sm uppercase tracking-wider">Print Frame Customizer</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-[#D4AF37] text-black px-2 py-0.5 rounded font-bold">Studio</span>
                </a>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
