"use client";

import React from "react";
import { Sparkles, MapPin, Phone, Mail } from "lucide-react";
import { FaInstagram, FaLinkedin, FaFacebook } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-emerald-950 border-t border-gold-500/20 text-emerald-200/80 pt-16 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-emerald-900 border border-gold-500/40 flex items-center justify-center shadow-gold-sm">
                <Sparkles className="w-5 h-5 text-gold-500" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-wider text-white">
                VISRIVA <span className="text-gold-400 text-sm font-sans block tracking-[0.25em] uppercase">Live Event Station</span>
              </span>
            </div>
            <p className="text-sm font-light leading-relaxed max-w-md text-emerald-200/70">
              Bengaluru’s premier luxury live event technology and instant production station. Delivering studio-grade DSLR photos, custom fridge magnets, bespoke keychains, and live mug printing on-site.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-emerald-900/80 border border-emerald-800 flex items-center justify-center text-gold-400 hover:border-gold-500 hover:text-white transition-colors" aria-label="Instagram">
                <FaInstagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-emerald-900/80 border border-emerald-800 flex items-center justify-center text-gold-400 hover:border-gold-500 hover:text-white transition-colors" aria-label="LinkedIn">
                <FaLinkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-emerald-900/80 border border-emerald-800 flex items-center justify-center text-gold-400 hover:border-gold-500 hover:text-white transition-colors" aria-label="Facebook">
                <FaFacebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-white tracking-wide">
              Capabilities
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#services" className="hover:text-gold-400 transition-colors">Instant DSLR Photo Booth</a>
              </li>
              <li>
                <a href="#services" className="hover:text-gold-400 transition-colors">Custom Fridge Magnets</a>
              </li>
              <li>
                <a href="#services" className="hover:text-gold-400 transition-colors">Bespoke Keychains</a>
              </li>
              <li>
                <a href="#services" className="hover:text-gold-400 transition-colors">Live Mug Sublimation</a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-white tracking-wide">
              Contact & Location
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <span>Bengaluru, Karnataka, India</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <span>+91 (080) VIP-VISRIVA</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <span>events@visriva.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-emerald-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/60 gap-4">
          <p>© {new Date().getFullYear()} Visriva Live Station. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <a href="#" className="hover:text-gold-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gold-400 transition-colors">Terms of Service</a>
            <a href="#booking-engine" className="hover:text-gold-400 transition-colors">Book Station</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
