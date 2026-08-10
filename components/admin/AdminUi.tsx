"use client";

import React from "react";

interface Props {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: string;
}

export function AdminPageHeader({ title, description, icon, actions, badge }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="w-11 h-11 rounded-xl bg-gold-gradient text-[#011F15] flex items-center justify-center shrink-0 shadow-gold-sm">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">{title}</h2>
              {badge && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-white/55 mt-1 leading-relaxed max-w-2xl">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

export function AdminCard({
  children,
  className = "",
  padding = "p-5 sm:p-6",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-black/25 backdrop-blur-sm ${padding} ${className}`}>
      {children}
    </div>
  );
}

export function AdminFieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block">
        {children}
      </label>
      {hint && <p className="text-[11px] text-white/45 leading-relaxed">{hint}</p>}
    </div>
  );
}

export const adminInputClass =
  "w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/70 focus:ring-1 focus:ring-[#D4AF37]/30 transition";

export const adminTextareaClass =
  "w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/70 focus:ring-1 focus:ring-[#D4AF37]/30 transition min-h-[100px]";

export const adminBtnPrimary =
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] text-xs font-extrabold uppercase tracking-wider shadow-gold-sm hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50";

export const adminBtnSecondary =
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/12 transition disabled:opacity-50";
