"use client";

import React from "react";
import { Camera, Magnet, Key, Coffee, Clock, Sparkles, Award } from "lucide-react";

interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  speed: string;
  icon: React.ElementType;
  image: string;
  highlights: string[];
}

const services: ServiceItem[] = [
  {
    id: "dsdlr-photo-booth",
    title: "Instant DSLR Photo Booth",
    subtitle: "Studio quality, 8-second print speed",
    description:
      "Professional DSLR cameras paired with sub-10 second thermal print technology. Customized event overlays, instant digital QR sharing, and studio lighting.",
    badge: "Most Popular",
    speed: "⚡ 8 Sec Print Speed",
    icon: Camera,
    image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
    highlights: ["4x6 Studio Gloss Prints", "Live QR Code Download", "Custom Event Branding Frame"],
  },
  {
    id: "fridge-magnets",
    title: "Custom Fridge Magnets",
    subtitle: "Live personalized magnet printing",
    description:
      "Transform guest photos into durable, high-gloss fridge magnets right before their eyes. A tangible keepsake that stays on their fridge for years.",
    badge: "High Keepsake Value",
    speed: "🧲 Premium Gloss Coating",
    icon: Magnet,
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
    highlights: ["Heavy-Duty Rubber Magnet", "Waterproof & Scratch Proof", "Instant On-Site Assembly"],
  },
  {
    id: "instant-keychains",
    title: "Instant Keychains",
    subtitle: "Bespoke metal/acrylic keepsakes",
    description:
      "Double-sided crystal clear acrylic & metallic keychains featuring high-resolution guest portraits, names, or corporate brand logos.",
    badge: "VIP Keepsake",
    speed: "🔑 Dual-Sided HD Print",
    icon: Key,
    image: "https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&w=800&q=80",
    highlights: ["Bespoke Acrylic & Metal Casing", "Double-Sided Custom Artwork", "Pocket-Sized Luxury Gift"],
  },
  {
    id: "live-mug-printing",
    title: "Live Mug Printing",
    subtitle: "Premium VIP return gifts",
    description:
      "High-heat sublimation printing producing vibrant ceramic mugs in under 3 minutes. Perfect for corporate takeaways, wedding return gifts, and VIP swag bags.",
    badge: "VIP Corporate Choice",
    speed: "☕ HD Ceramic Sublimation",
    icon: Coffee,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    highlights: ["Dishwasher & Microwave Safe", "11oz Premium White Ceramic", "Full-Color Wraparound Print"],
  },
];

export default function ServiceShowcase() {
  return (
    <section id="services" className="py-24 bg-emerald-950 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-900/80 border border-gold-500/30 text-gold-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>On-Site Live Printing Capabilities</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-6">
            Bespoke Live Stations for <br className="hidden sm:inline" />
            <span className="text-gold-gradient">Unforgettable Celebrations</span>
          </h2>
          <p className="text-emerald-200/80 text-base sm:text-lg font-light leading-relaxed">
            Our state-of-the-art live production stations deliver high-resolution physical gifts to your guests in seconds, complete with custom event branding.
          </p>
        </div>

        {/* 4-Column Grid (Sleek 2x2 on Mobile/Tablet) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Card Image Header */}
                  <div className="relative h-48 w-full overflow-hidden bg-emerald-900">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/40 to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-950/80 border border-gold-500/40 text-gold-400 text-[11px] font-semibold tracking-wide backdrop-blur-md">
                      {service.badge}
                    </div>

                    {/* Service Icon floating badge */}
                    <div className="absolute -bottom-5 left-5 w-12 h-12 rounded-xl bg-gold-gradient text-emerald-950 flex items-center justify-center shadow-gold-md">
                      <Icon className="w-6 h-6 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 pt-8 space-y-4">
                    <div className="inline-flex items-center space-x-1.5 text-xs text-gold-300 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gold-500" />
                      <span>{service.speed}</span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-white group-hover:text-gold-300 transition-colors">
                      {service.title}
                    </h3>

                    <p className="text-emerald-200/70 text-xs sm:text-sm font-light leading-relaxed">
                      {service.description}
                    </p>

                    {/* Highlights List */}
                    <div className="pt-2 border-t border-emerald-800/60 space-y-2">
                      {service.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-emerald-100/90">
                          <Award className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" />
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="p-6 pt-0 mt-4">
                  <a
                    href="#booking-engine"
                    className="w-full py-2.5 rounded-lg bg-emerald-900/90 border border-gold-500/30 text-gold-300 hover:bg-gold-500 hover:text-emerald-950 font-semibold text-xs transition-all duration-200 flex items-center justify-center space-x-1"
                  >
                    <span>Select for Event</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
