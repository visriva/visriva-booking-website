"use client";
import React from 'react';
import { motion } from 'framer-motion';
import BookingEngine from '@/components/BookingEngine';

export default function BookingEngineSplit() {
  return (
    <section className="py-24 bg-transparent relative overflow-hidden">
      <motion.div
        className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
        viewport={{ once: true }}
      >
        {/* Left side copy */}
        <div className="space-y-6">
          <h2 className="text-4xl md:text-5xl font-playfair text-white">
            Dynamic Budget Estimator &amp; Booking
          </h2>
          <p className="text-lg text-emerald-200/80">
            Use our instant budget estimator to see an investment preview, then
            fill out the form to reserve your live station. All data is saved
            securely via Firebase and you’ll receive a Calendly link for a
            consultation call.
          </p>
        </div>
        {/* Right side booking form */}
        <div className="glass-card glass-card-hover rounded-2xl p-6">
          <BookingEngine />
        </div>
      </motion.div>
    </section>
  );
}
