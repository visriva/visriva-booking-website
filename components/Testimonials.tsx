import React from "react";
import { Star } from "lucide-react";
import type { Testimonial } from "@/lib/testimonials";

interface TestimonialsProps {
  testimonials: Testimonial[];
  title?: string;
  subtitle?: string;
}

export default function Testimonials({
  testimonials,
  title = "What Our Clients Say",
  subtitle = "Real celebrations. Real keepsakes. Real reactions.",
}: TestimonialsProps) {
  if (!testimonials.length) return null;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-bold uppercase tracking-widest backdrop-blur-md font-cinzel">
            <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
            <span>Client Love</span>
          </div>
          <h2 className="font-playfair text-3xl sm:text-5xl font-bold text-gold-gradient tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-emerald-100/70 max-w-lg mx-auto">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {testimonials.map((t, idx) => (
            <blockquote
              key={idx}
              className="glass-card glass-card-hover p-6 sm:p-8 space-y-4"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                ))}
              </div>
              <p className="font-conya text-sm sm:text-base text-emerald-100/90 leading-relaxed italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="pt-2 border-t border-white/10">
                <p className="text-sm font-bold text-white">{t.author}</p>
                <p className="text-xs text-[#D4AF37]/80 mt-0.5">{t.event}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
