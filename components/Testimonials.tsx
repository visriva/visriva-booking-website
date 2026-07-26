// components/Testimonials.tsx
import React from 'react';

interface Testimonial {
  quote: string;
  author: string;
}

interface TestimonialsProps {
  testimonials: Testimonial[];
}

export default function Testimonials({ testimonials }: TestimonialsProps) {
  return (
    <section className="my-12">
      <h2 className="text-3xl font-playfair text-center text-gold-400 mb-6">What Our Clients Say</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {testimonials.map((t, idx) => (
          <blockquote
            key={idx}
            className="bg-emerald-900/60 backdrop-blur-sm p-6 rounded-lg border border-emerald-800 hover:border-gold-400 transition-colors"
          >
            <p className="text-emerald-100 italic mb-4">“{t.quote}”</p>
            <footer className="text-sm text-gold-300 text-right">— {t.author}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
