"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Plus,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
} from "lucide-react";
import {
  subscribeFinanceTransactions,
  addFinanceTransaction,
  deleteFinanceTransaction,
  summarizeTransactions,
  formatInr,
  monthLabel,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  type FinanceTransaction,
} from "@/lib/finance";

interface Props {
  onToast: (msg: string, isError?: boolean) => void;
}

export default function FinanceDashboard({ onToast }: Props) {
  const now = new Date();
  const [rows, setRows] = useState<Array<FinanceTransaction & { id: string }>>([]);
  const [tab, setTab] = useState<"overview" | "income" | "expense" | "ledger">("overview");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [form, setForm] = useState({
    amount: "",
    category: "",
    description: "",
    party: "",
    eventRef: "",
    date: now.toISOString().split("T")[0],
  });

  useEffect(() => {
    return subscribeFinanceTransactions(setRows);
  }, []);

  const monthSummary = useMemo(() => summarizeTransactions(rows, year, month), [rows, year, month]);
  const yearSummary = useMemo(() => summarizeTransactions(rows, year), [rows, year]);

  const resetForm = (type: "income" | "expense") => {
    setForm({
      amount: "",
      category: type === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
      description: "",
      party: "",
      eventRef: "",
      date: now.toISOString().split("T")[0],
    });
  };

  const submitTx = async (type: "income" | "expense") => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      onToast("Enter a valid amount", true);
      return;
    }
    if (!form.category || !form.description.trim()) {
      onToast("Category and description are required", true);
      return;
    }

    setSaving(true);
    const res = await addFinanceTransaction({
      type,
      amount,
      category: form.category,
      description: form.description.trim(),
      party: form.party.trim() || undefined,
      eventRef: form.eventRef.trim() || undefined,
      date: form.date,
    });
    setSaving(false);

    if (res.success) {
      onToast(type === "income" ? "Income recorded" : "Expense recorded");
      resetForm(type);
      setTab("overview");
    } else {
      onToast(res.error || "Failed to save", true);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const res = await deleteFinanceTransaction(id);
    setDeletingId("");
    if (res.success) onToast("Transaction removed");
    else onToast("Could not delete", true);
  };

  const ledgerFiltered = rows.filter((r) => {
    const [y, m] = r.date.split("-").map(Number);
    return y === year && m === month;
  });

  const StatCard = ({
    label,
    value,
    sub,
    positive,
  }: {
    label: string;
    value: string;
    sub?: string;
    positive?: boolean;
  }) => (
    <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</p>
      <p
        className={`text-2xl font-serif font-bold ${
          positive === undefined ? "text-white" : positive ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-white/40 font-mono">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {monthLabel(year, m)}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <div className="flex gap-1 ml-auto">
          {(["overview", "income", "expense", "ledger"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                if (t === "income") resetForm("income");
                if (t === "expense") resetForm("expense");
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                tab === t ? "bg-[#D4AF37] text-[#011F15]" : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={`Income — ${monthLabel(year, month)}`} value={formatInr(monthSummary.income)} />
            <StatCard label="Expenses" value={formatInr(monthSummary.expenses)} />
            <StatCard
              label="Monthly P&L"
              value={formatInr(monthSummary.profit)}
              sub={`Margin ${monthSummary.marginPct.toFixed(1)}%`}
              positive={monthSummary.profit >= 0}
            />
            <StatCard
              label={`Annual P&L — ${year}`}
              value={formatInr(yearSummary.profit)}
              sub={`Income ${formatInr(yearSummary.income)}`}
              positive={yearSummary.profit >= 0}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Income by category
              </h3>
              {Object.keys(monthSummary.incomeByCategory).length === 0 ? (
                <p className="text-xs text-white/40">No income this month</p>
              ) : (
                Object.entries(monthSummary.incomeByCategory).map(([cat, amt]) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/70">{cat}</span>
                      <span className="font-mono text-emerald-300">{formatInr(amt)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500/60 rounded-full"
                        style={{ width: `${Math.min(100, (amt / monthSummary.income) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" /> Expenses by category
              </h3>
              {Object.keys(monthSummary.expensesByCategory).length === 0 ? (
                <p className="text-xs text-white/40">No expenses this month</p>
              ) : (
                Object.entries(monthSummary.expensesByCategory).map(([cat, amt]) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/70">{cat}</span>
                      <span className="font-mono text-rose-300">{formatInr(amt)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500/50 rounded-full"
                        style={{
                          width: `${Math.min(100, monthSummary.expenses ? (amt / monthSummary.expenses) * 100 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {(tab === "income" || tab === "expense") && (
        <div className="glass-card rounded-2xl border border-[#D4AF37]/30 p-6 max-w-xl space-y-4">
          <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
            {tab === "income" ? (
              <>
                <ArrowDownCircle className="w-5 h-5 text-emerald-400" /> Record Income
              </>
            ) : (
              <>
                <ArrowUpCircle className="w-5 h-5 text-rose-400" /> Record Expense
              </>
            )}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase text-[#D4AF37]">Amount (₹) *</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-[#D4AF37]"
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-[#D4AF37]">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-[#D4AF37]">Category *</label>
              <select
                value={form.category || (tab === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0])}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#D4AF37]"
              >
                {(tab === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase text-[#D4AF37]">
                {tab === "income" ? "Received from" : "Paid to / Where"}
              </label>
              <input
                value={form.party}
                onChange={(e) => setForm({ ...form, party: e.target.value })}
                placeholder={tab === "income" ? "Client name / company" : "Vendor, fuel station, etc."}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase text-[#D4AF37]">Description / Usage *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder={
                  tab === "income"
                    ? "Wedding booking deposit — Sharma sangeet"
                    : "DNP paper + ribbon for March events"
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#D4AF37] resize-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase text-white/40">Booking ref (optional)</label>
              <input
                value={form.eventRef}
                onChange={(e) => setForm({ ...form, eventRef: e.target.value })}
                placeholder="Firestore lead ID or event name"
                className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-2 text-white/80 text-xs outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void submitTx(tab)}
            className="w-full py-3 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Save {tab === "income" ? "Income" : "Expense"}
          </button>
        </div>
      )}

      {tab === "ledger" && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white">Ledger — {monthLabel(year, month)}</h3>
          </div>
          <div className="max-h-[480px] overflow-y-auto divide-y divide-white/5">
            {ledgerFiltered.length === 0 ? (
              <p className="p-6 text-xs text-white/40 text-center">No transactions this month</p>
            ) : (
              ledgerFiltered.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-3 p-4 hover:bg-white/5 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          r.type === "income"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {r.type}
                      </span>
                      <span className="text-xs font-mono text-white/50">{r.date}</span>
                    </div>
                    <p className="text-sm text-white font-medium mt-1">{r.description}</p>
                    <p className="text-[10px] text-white/40">
                      {r.category}
                      {r.party ? ` · ${r.party}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-mono font-bold text-sm ${
                        r.type === "income" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {r.type === "income" ? "+" : "-"}
                      {formatInr(r.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDelete(r.id!)}
                      disabled={deletingId === r.id}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-300"
                    >
                      {deletingId === r.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
