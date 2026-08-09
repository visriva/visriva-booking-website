"use client";

import React, { useEffect, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { isAuthorizedAdminPassword } from "@/lib/adminAuth";

const AUTH_KEY = "visriva_admin_session";
const SESSION_HOURS = 12;

export function setAdminSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTH_KEY, String(Date.now()));
}

export function isAdminSessionValid(): boolean {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(AUTH_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < SESSION_HOURS * 60 * 60 * 1000;
}

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [pinError, setPinError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setAuthenticated(isAdminSessionValid());
    setChecking(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthorizedAdminPassword(pin)) {
      setAdminSession();
      setAuthenticated(true);
      setPinError("");
    } else {
      setPinError("Invalid PIN. Access denied.");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#011F15] text-white/60 text-sm">
        Verifying session…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#011F15] px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md glass-card rounded-3xl border border-[#D4AF37]/30 p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gold-gradient flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-[#011F15]" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-white">Visriva Admin</h1>
            <p className="text-xs text-emerald-100/60">Enter crew PIN to continue</p>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#D4AF37] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Admin PIN"
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm outline-none focus:border-[#D4AF37]"
              autoFocus
            />
          </div>
          {pinError && <p className="text-xs text-rose-400 text-center">{pinError}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-sm uppercase tracking-wider"
          >
            Unlock Panel
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
