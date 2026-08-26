"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface GuestThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const GuestThemeContext = createContext<GuestThemeContextValue | null>(null);

export function useGuestTheme() {
  const ctx = useContext(GuestThemeContext);
  if (!ctx) throw new Error("useGuestTheme must be used within GuestThemeProvider");
  return ctx;
}

export default function GuestThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("visriva_guest_theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setThemeState("light");
    }
    setReady(true);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("visriva_guest_theme", t);
  };

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <GuestThemeContext.Provider value={{ theme, toggle, setTheme }}>
      <div
        className={`guest-portal ${theme === "light" ? "light" : "dark"} ${ready ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
      >
        {children}
      </div>
    </GuestThemeContext.Provider>
  );
}
