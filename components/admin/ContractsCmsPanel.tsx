"use client";

import React, { useEffect, useState } from "react";
import {
  Copy,
  ExternalLink,
  FileText,
  MessageCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  ContractStatus,
  EventContract,
  deleteContract,
  saveContract,
  subscribeContracts,
  updateContractStatus,
} from "@/lib/firebase";

interface Props {
  onToast: (message: string, isError?: boolean) => void;
}

const EMPTY_FORM = {
  clientName: "",
  clientPhone: "",
  eventType: "",
  eventDate: "",
  venue: "",
  servicesText: "Instant Photo Booth",
  totalAmount: "",
  customHashtag: "",
  clientLogoUrl: "",
  isGstInvoice: false,
  companyName: "",
  companyGstin: "",
};

function statusChip(status: ContractStatus) {
  if (status === "signed")
    return "bg-emerald-500/20 text-emerald-300 border-emerald-400/40";
  if (status === "sent") return "bg-amber-500/20 text-amber-200 border-amber-400/40";
  return "bg-white/10 text-white/70 border-white/20";
}

export default function ContractsCmsPanel({ onToast }: Props) {
  const [contracts, setContracts] = useState<EventContract[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  useEffect(() => subscribeContracts(setContracts), []);

  const shareUrl = (id: string) =>
    typeof window !== "undefined"
      ? `${window.location.origin}/contract/${id}`
      : `https://www.visriva.com/contract/${id}`;

  const handleSave = async () => {
    if (!form.clientName.trim() || !form.eventType.trim() || !form.eventDate.trim() || !form.venue.trim()) {
      onToast("Client name, event type, date, and venue are required", true);
      return;
    }
    const amount = Number(String(form.totalAmount).replace(/[^0-9.]/g, ""));
    if (!amount || amount <= 0) {
      onToast("Enter a valid total contract amount", true);
      return;
    }

    setIsSaving(true);
    const existing = editingId ? contracts.find((c) => c.id === editingId) : undefined;
    const res = await saveContract({
      id: editingId || undefined,
      clientName: form.clientName,
      clientPhone: form.clientPhone,
      eventType: form.eventType,
      eventDate: form.eventDate,
      venue: form.venue,
      services: form.servicesText.split(",").map((s) => s.trim()).filter(Boolean),
      totalAmount: amount,
      customHashtag: form.customHashtag,
      clientLogoUrl: form.clientLogoUrl,
      isGstInvoice: form.isGstInvoice,
      companyName: form.companyName,
      companyGstin: form.companyGstin,
      status: existing?.status || "draft",
      signatureName: existing?.signatureName,
      signedAt: existing?.signedAt,
      termsAcceptedAt: existing?.termsAcceptedAt,
      leadId: existing?.leadId,
      invoiceNumber: existing?.invoiceNumber,
    });
    setIsSaving(false);

    if (!res.success || !res.id) {
      onToast(res.error || "Failed to save contract", true);
      return;
    }

    setLastSavedId(res.id);
    setEditingId(res.id);
    onToast(`Contract saved — ${res.invoiceNumber || res.id}`);
  };

  const handleEdit = (c: EventContract) => {
    setEditingId(c.id);
    setLastSavedId(c.id);
    setForm({
      clientName: c.clientName || "",
      clientPhone: c.clientPhone || "",
      eventType: c.eventType || "",
      eventDate: c.eventDate || "",
      venue: c.venue || "",
      servicesText: (c.services || []).join(", "),
      totalAmount: String(c.totalAmount || ""),
      customHashtag: c.customHashtag || "",
      clientLogoUrl: c.clientLogoUrl || "",
      isGstInvoice: Boolean(c.isGstInvoice),
      companyName: c.companyName || "",
      companyGstin: c.companyGstin || "",
    });
  };

  const handleNew = () => {
    setEditingId(null);
    setLastSavedId(null);
    setForm(EMPTY_FORM);
  };

  const handleCopy = async (id: string) => {
    const url = shareUrl(id);
    try {
      await navigator.clipboard.writeText(url);
      onToast("Share link copied");
    } catch {
      onToast(url);
    }
  };

  const handleWhatsApp = async (c: EventContract) => {
    if (c.status === "draft") {
      await updateContractStatus(c.id, "sent");
    }
    const url = shareUrl(c.id);
    const phone = (c.clientPhone || "918884484828").replace(/[^0-9]/g, "");
    const msg = `Hello ${c.clientName || "Valued Client"}! Here is your official Visriva Service Agreement & 40% Deposit Invoice (${c.invoiceNumber}): ${url}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    onToast("Opened WhatsApp — status marked sent if it was draft");
  };

  const handleDelete = async (id: string, name: string) => {
    const res = await deleteContract(id);
    if (res.success) {
      if (editingId === id) handleNew();
      onToast(`Deleted contract for ${name}`);
    } else {
      onToast(res.error || "Delete failed", true);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gold-gradient text-[#011F15] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-white">Event Contracts</h2>
            </div>
            <p className="text-xs text-emerald-100/75 leading-relaxed max-w-2xl">
              Create a unique agreement per event. Save → share{" "}
              <span className="font-mono text-[#D4AF37]">/contract/&#123;id&#125;</span>. Clients can
              sign digitally; status shows as draft / sent / signed.
            </p>
          </div>
          <button
            type="button"
            onClick={handleNew}
            className="px-4 py-2.5 rounded-xl border border-white/20 text-white text-xs font-bold hover:bg-white/10 transition flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            New contract
          </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-white">
              {editingId ? "Edit contract" : "Create contract"}
            </h3>
            <p className="text-xs text-emerald-100/60 mt-1">
              {editingId
                ? `Editing ${editingId.slice(0, 8)}…`
                : "Fill event details and save to generate a shareable link."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving…" : "Save contract"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              ["clientName", "Client name", "Rohan Sharma"],
              ["clientPhone", "Client WhatsApp", "9198XXXXXXXX"],
              ["eventType", "Event type", "Wedding Reception"],
              ["eventDate", "Event date", "14 December 2026"],
              ["venue", "Venue", "Taj West End, Bengaluru"],
              ["totalAmount", "Total amount (₹)", "38000"],
              ["servicesText", "Services (comma-separated)", "Instant Photo Booth, Magnets"],
              ["customHashtag", "Hashtag / monogram", "#RohanWedsAnanya"],
              ["clientLogoUrl", "Client logo URL (optional)", "https://..."],
            ] as const
          ).map(([key, label, placeholder]) => (
            <div key={key} className={`space-y-1 ${key === "servicesText" || key === "venue" || key === "clientLogoUrl" ? "md:col-span-2" : ""}`}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">{label}</label>
              <input
                type="text"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-[#D4AF37] outline-none"
              />
            </div>
          ))}
        </div>

        <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isGstInvoice}
            onChange={(e) => setForm({ ...form, isGstInvoice: e.target.checked })}
            className="w-5 h-5 accent-[#D4AF37]"
          />
          <span className="text-sm text-white">GST invoice (18%)</span>
        </label>

        {form.isGstInvoice && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Company name</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">GSTIN</label>
              <input
                type="text"
                value={form.companyGstin}
                onChange={(e) => setForm({ ...form, companyGstin: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm"
              />
            </div>
          </div>
        )}

        {lastSavedId && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 space-y-3">
            <p className="text-xs text-emerald-200 font-bold">Shareable client link</p>
            <code className="block text-[11px] text-white/80 break-all font-mono">{shareUrl(lastSavedId)}</code>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCopy(lastSavedId)}
                className="px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy link
              </button>
              <a
                href={`/contract/${lastSavedId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
        <h3 className="font-serif text-lg font-bold text-white">All contracts</h3>
        {contracts.length === 0 ? (
          <p className="text-xs text-emerald-100/60">No contracts yet. Create your first event agreement above.</p>
        ) : (
          <div className="space-y-3">
            {contracts.map((c) => (
              <div
                key={c.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-black/40 border border-white/10"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-white text-sm">{c.clientName}</p>
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${statusChip(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-100/70">
                    {c.eventType} · {c.eventDate} · ₹{(c.totalAmount || 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] font-mono text-[#D4AF37]">{c.invoiceNumber}</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(c)}
                    className="px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-bold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(c.id)}
                    className="px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <a
                    href={`/contract/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                  <button
                    type="button"
                    onClick={() => handleWhatsApp(c)}
                    className="px-3 py-2 rounded-lg bg-green-500/20 text-green-300 text-xs font-bold flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.clientName)}
                    className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
