"use client";

import React from "react";
import { motion } from "framer-motion";

interface StaggerTextProps {
  text: string;
  className?: string;
  goldIndex?: number[]; // indices of words to apply gold gradient
}

export default function StaggerText({ text, className = "", goldIndex = [] }: StaggerTextProps) {
  const words = text.split(" ");

  const containerVars = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.04 * i },
    }),
  };

  const wordVars = {
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 18,
        stiffness: 120,
      },
    },
    hidden: {
      y: "100%",
      opacity: 0,
      transition: {
        type: "spring" as const,
        damping: 18,
        stiffness: 120,
      },
    },
  };

  return (
    <motion.h2
      variants={containerVars}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={`inline-flex flex-wrap gap-x-2 gap-y-1 ${className}`}
    >
      {words.map((word, idx) => {
        const isGold = goldIndex.includes(idx);
        return (
          <span key={idx} className="overflow-hidden inline-block py-0.5">
            <motion.span
              variants={wordVars}
              className={`inline-block ${
                isGold ? "text-gold-gradient font-bold" : "text-white"
              }`}
            >
              {word}
            </motion.span>
          </span>
        );
      })}
    </motion.h2>
  );
}
