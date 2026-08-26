"use client";

import React from "react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useGuestTheme } from "./GuestThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useGuestTheme();
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="guest-glass inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--guest-gold)]"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </motion.button>
  );
}
