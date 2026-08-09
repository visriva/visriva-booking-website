"use client";

import React, { useEffect, useState } from "react";
import { Lock, ShieldCheck, Loader2 } from "lucide-react";
import {
  isOperationsPinValid,
  isOperationsTrustedLocal,
  setOperationsTrustedLocal,
  createOperationsSession,
  checkOperationsSession,
} from "@/lib/operationsAuth";

interface Props {
  children: React.ReactNode;
}

export default function OperationsGate({ children }: Props) {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [pinError, setPinError] = useState("");
  const [checking, setChecking] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const serverOk = await checkOperationsSession();
      const localOk = isOperationsTrustedLocal();
      if (!cancelled) {
        setAuthenticated(serverOk || localOk);
        if (localOk && !serverOk) {
          await createOperationsSession("G1");
        }
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    if (!isOperationsPinValid(pin)) {
      setPinError("Invalid PIN. Operations access requires G1.");
      return;
    }
    setLoggingIn(true);
    const ok = await createOperationsSession(pin);
    setLoggingIn(false);
    if (ok) {
      if (rememberDevice) setOperationsTrustedLocal();
      setAuthenticated(true);
      setPin("");
    } else {
      setPinError("Session could not be created. Try again.");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#011F15] text-white/60 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#D4AF37]" />
        Loading Operations Hub…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#011F15] px-4">
        <form
          onSubmit={(e) => void handleLogin(e)}
          className="w-full max-w-md glass-card rounded-3xl border border-[#D4AF37]/30 p-8 space-y-5"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gold-gradient flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-[#011F15]" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-white">Operations Hub</h1>
            <p className="text-xs text-emerald-100/60">Calendar · Finance · Receipt AI</p>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#D4AF37] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Operations PIN"
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm outline-none focus:border-[#D4AF37]"
              autoFocus
              autoComplete="current-password"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="rounded border-white/20"
            />
            Remember this device for 90 days (no PIN on this browser)
          </label>
          {pinError && <p className="text-xs text-rose-400 text-center">{pinError}</p>}
          <button
            type="submit"
            disabled={loggingIn}
            className="w-full py-3 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-sm uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
            Unlock Operations
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
