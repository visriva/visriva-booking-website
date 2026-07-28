"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MapPin, Phone, Mail, Sparkles, ArrowUpRight, MessageCircle } from "lucide-react";
import { FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import {
  subscribeGlobalContactSettings,
  DEFAULT_GLOBAL_SETTINGS,
  GlobalSettingsConfig,
  subscribeWebsiteText,
  DEFAULT_WEBSITE_TEXT,
  WebsiteTextConfig,
  subscribeFeatureToggles,
  DEFAULT_FEATURE_TOGGLES,
  FeatureTogglesConfig,
} from "@/lib/firebase";

export default function Footer() {
  const [contact, setContact] = useState<GlobalSettingsConfig>(DEFAULT_GLOBAL_SETTINGS);
  const [websiteText, setWebsiteText] = useState<WebsiteTextConfig>(DEFAULT_WEBSITE_TEXT);
  const [toggles, setToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);

  useEffect(() => {
    const unsubContact = subscribeGlobalContactSettings((data) => {
      if (data) setContact(data);
    });
    const unsubText = subscribeWebsiteText((data) => {
      if (data) setWebsiteText(data);
    });
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) setToggles(data);
    });
    return () => {
      unsubContact();
      unsubText();
      unsubToggles();
    };
  }, []);

  return (
    <footer className="bg-[#011F15]/90 backdrop-blur-xl border-t border-[#D4AF37]/30 text-emerald-100/80 pt-16 pb-12 relative overflow-hidden z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* 4-Column Mega Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand Pitch & Glowing Logo */}
          <div className="space-y-4">
            <a
              href="/"
              className="flex items-center space-x-3 group cursor-pointer inline-flex"
            >
              <Image
                src="/mycomapnylogo.png"
                alt="Visriva Logo"
                width={50}
                height={50}
                className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.5)] group-hover:scale-105 transition-all"
              />
              <span className="font-catilya text-2xl font-bold tracking-wider text-white group-hover:text-[#D4AF37] transition-colors">
                VISRIVA
              </span>
            </a>
            <p className="font-conya text-xs sm:text-sm font-light leading-relaxed text-emerald-100/80">
              {websiteText.footerDescription || DEFAULT_WEBSITE_TEXT.footerDescription}
            </p>
            <div className="inline-flex items-center space-x-2 text-[11px] font-bogale text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bengaluru • Pan-India VIP Activations</span>
            </div>
          </div>

          {/* Column 2: Virtual Assistant Service Links */}
          <div className="space-y-4">
            <h4 className="font-aylia text-base font-bold uppercase tracking-wider text-white border-b border-white/10 pb-2">
              Virtual Assistant Services
            </h4>
            <ul className="space-y-2.5 text-xs font-graven">
              {toggles.enablePhotoBoothService !== false && (
                <li>
                  <a href="/photo-booth" className="hover:text-[#D4AF37] transition-colors flex items-center justify-between group">
                    <span>Photo Booth Collections</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              )}
              {toggles.enableMagnetService !== false && (
                <li>
                  <a href="/services/magnet-station" className="hover:text-[#D4AF37] transition-colors flex items-center justify-between group">
                    <span>Custom Fridge Magnets</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              )}
              {toggles.enableKeychainService !== false && (
                <li>
                  <a href="/services/keychain-station" className="hover:text-[#D4AF37] transition-colors flex items-center justify-between group">
                    <span>Bespoke Keychains</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              )}
              {toggles.enableMugService !== false && (
                <li>
                  <a href="/services/mug-printing" className="hover:text-[#D4AF37] transition-colors flex items-center justify-between group">
                    <span>Live Mug Printing</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              )}
              {toggles.enableToteTshirtService !== false && (
                <li>
                  <a href="/services/tote-tshirt-station" className="hover:text-[#D4AF37] transition-colors flex items-center justify-between group">
                    <span>Tote Bag &amp; T-Shirt Station</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Contact & Address */}
          <div className="space-y-4">
            <h4 className="font-aylia text-base font-bold uppercase tracking-wider text-white border-b border-white/10 pb-2">
              Official Headquarters
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {contact.physicalAddress || DEFAULT_GLOBAL_SETTINGS.physicalAddress}
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                <a href={`tel:${contact.phoneNumber?.replace(/\s+/g, "")}`} className="hover:text-[#D4AF37] font-mono transition-colors">
                  {contact.phoneNumber || DEFAULT_GLOBAL_SETTINGS.phoneNumber}
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                <a href={`mailto:${contact.contactEmail}`} className="hover:text-[#D4AF37] transition-colors">
                  {contact.contactEmail || DEFAULT_GLOBAL_SETTINGS.contactEmail}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Social Proof & Media */}
          <div className="space-y-4">
            <h4 className="font-aylia text-base font-bold uppercase tracking-wider text-white border-b border-white/10 pb-2">
              Social Proof &amp; Media
            </h4>
            <p className="font-conya text-xs text-emerald-100/70 leading-relaxed font-light">
              Follow our live event streams and explore real-time setup highlights across social media.
            </p>

            <div className="flex items-center space-x-4 pt-2">
              <a
                href={contact.instagramUrl || "https://instagram.com/visriva.live"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-[#D4AF37] hover:border-[#D4AF37]/60 hover:scale-110 transition-all duration-300 drop-shadow-md hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]"
              >
                <FaInstagram className="w-5 h-5" />
              </a>

              <a
                href={`https://wa.me/${contact.whatsappNumber || "918884484828"}?text=Hello%20Visriva%20Live%20Station`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Us"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-[#D4AF37] hover:border-[#D4AF37]/60 hover:scale-110 transition-all duration-300 drop-shadow-md hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]"
              >
                <FaWhatsapp className="w-5 h-5" />
              </a>

              <a
                href={contact.linkedinUrl || DEFAULT_GLOBAL_SETTINGS.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:text-[#D4AF37] hover:border-[#D4AF37]/60 hover:scale-110 transition-all duration-300 drop-shadow-md hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]"
              >
                <FaLinkedin className="w-5 h-5" />
              </a>
            </div>

            <div className="pt-2">
              <a
                href={`https://wa.me/${contact.whatsappNumber || "918884484828"}?text=Hello%20Visriva%20Live%20Station`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-xs font-semibold text-[#D4AF37] hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat via WhatsApp</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Legal Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-100/60 gap-4">
          <p className="font-cavona">© {new Date().getFullYear()} Visriva Live Station. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <a href="/photo-booth" className="hover:text-[#D4AF37] transition-colors">Packages &amp; Pricing</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
