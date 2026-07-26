"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CameraFlash() {
  const [flashing, setFlashing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setFlashing(false), 450);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {flashing && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 bg-white z-[99999] pointer-events-none"
        />
      )}
    </AnimatePresence>
  );
}
