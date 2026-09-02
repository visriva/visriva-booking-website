"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Instagram, Power, Save, ShieldCheck } from "lucide-react";
import AdminGate from "@/components/admin/AdminGate";
import AdminShell from "@/components/admin/AdminShell";
import { saveFeatureToggles, subscribeFeatureToggles, FeatureTogglesConfig } from "@/lib/firebase";
import type { AdminCategory, AdminTab } from "@/lib/adminNav";

export default function AdminQrPage() {
  return (
    <AdminGate>
      <AdminQrPageInner />
    </AdminGate>
  );
}

function AdminQrPageInner() {
  const [limited, setLimited] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return subscribeFeatureToggles((config) => {
      const value = (config as FeatureTogglesConfig & { enableQrGuestHubLimited?: boolean }).enableQrGuestHubLimited;
      setLimited(typeof value === "boolean" ? value : true);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    setToast("");
    setError("");
    const current = await new Promise<FeatureTogglesConfig>((resolve) => {
      let finished = false;
      const unsub = subscribeFeatureToggles((config) => {
        if (finished) return;
        finished = true;
        unsub();
        resolve(config);
      });
      window.setTimeout(() => {
        if (finished) return;
        finished = true;
        unsub();
        resolve({} as FeatureTogglesConfig);
      }, 600);
    });

    const result = await saveFeatureToggles({
      ...current,
      enableQrGuestHubLimited: limited,
    } as FeatureTogglesConfig & { enableQrGuestHubLimited: boolean });

    setSaving(false);
    if (result.success) {
      setToast(limited ? "QR Hub is now LIMITED to Kinya + Instagram." : "QR Hub restored to all guest links.");
    } else {
      setError(result.error || "Could not save QR Hub settings.");
    }
  };

  const activeCategory: AdminCategory = "dashboard";
  const activeTab: AdminTab = "globalSettings";

  return (
    <AdminShell
      activeCategory={activeCategory}
      activeTab={activeTab}
      onNavigate={(category, tab) => {
        window.location.href = tab ? `/admin?category=${category}&tab=${tab}` : `/admin`;
      }}
      onMasterSync={() => window.location.reload()}
      isMasterSyncing={false}
      successToast={toast}
      errorToast={error}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">QR Guest Hub</p>
            <h2 className="font-serif text-3xl font-bold">Guest Link Controls</h2>
          </div>
        </div>

        <div className="rounded-3xl border border-[#D4AF37]/25 bg-white/5 p-6 shadow-2xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
                <Power className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Event Mode — Kinya Coffee</h3>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/50">
                  When enabled, the QR Guest Hub shows only the Kinya Coffee × WATO offer and Instagram. Turn it off to restore the normal guest links.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={limited}
              onClick={() => setLimited((value) => !value)}
              className={`relative h-8 w-14 shrink-0 rounded-full transition ${limited ? "bg-emerald-500" : "bg-white/15"}`}
            >
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${limited ? "left-7" : "left-1"}`} />
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className={`rounded-2xl border p-4 ${limited ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/10 bg-black/20"}`}>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Current QR mode</p>
              <p className="mt-1 text-xl font-bold">{limited ? "Kinya + Instagram" : "Full Guest Hub"}</p>
              <p className="mt-1 text-xs text-white/45">{limited ? "Only two guest choices are visible." : "All original guest portals are visible."}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Live offer</p>
              <p className="mt-1 text-xl font-bold">₹100 OFF</p>
              <p className="mt-1 text-xs text-white/45">Code: COFFEE · 2 photo strips for ₹100</p>
            </div>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-[#011F15] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save QR Mode"}
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
            <h3 className="font-bold">What guests see in Event Mode</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-4 font-bold">Kinya Coffee × WATO Offer</div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 font-bold"><Instagram className="mr-2 inline h-4 w-4" />@visriva.co</div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
