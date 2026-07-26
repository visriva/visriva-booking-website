"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Sparkles, Camera } from "lucide-react";

interface FloatingPolaroidProps {
  title: string;
  subtitle: string;
  badge?: string;
  rotation?: number;
}

export default function FloatingPolaroid({
  title,
  subtitle,
  badge = "8-Sec Print",
  rotation = -4,
}: FloatingPolaroidProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Mouse position values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for 3D tilt
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseXPos = (e.clientX - rect.left) / width - 0.5;
    const mouseYPos = (e.clientY - rect.top) / height - 0.5;

    x.set(mouseXPos);
    y.set(mouseYPos);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      initial={{ rotate: rotation }}
      whileHover={{ scale: 1.05, rotate: 0, zIndex: 30 }}
      transition={{ duration: 0.4 }}
      className="relative cursor-pointer group p-6 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl max-w-sm w-full space-y-4"
    >
      {/* Gold Pin Badge Accent */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gold-gradient shadow-gold-sm border border-white/40 flex items-center justify-center z-10">
        <Sparkles className="w-3 h-3 text-[#011F15]" />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="w-10 h-10 rounded-xl bg-black/40 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
          <Camera className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
          {badge}
        </span>
      </div>

      <div className="space-y-2">
        <h4 className="font-serif font-bold text-xl text-white group-hover:text-[#D4AF37] transition-colors leading-tight">
          {title}
        </h4>
        <p className="font-sans text-xs text-emerald-100/70 font-light leading-relaxed">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}
