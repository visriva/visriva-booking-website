"use client";

import React from "react";
import { Check } from "lucide-react";

export interface BookingProgressState {
  step1Complete: boolean;
  step2Complete: boolean;
  step3Complete: boolean;
}

const STEPS = [
  { id: 1, label: "Event", hint: "Date & venue" },
  { id: 2, label: "Stations", hint: "Live packages" },
  { id: 3, label: "Details", hint: "Contact & book" },
] as const;

function activeStep(state: BookingProgressState): number {
  if (!state.step1Complete) return 1;
  if (!state.step2Complete) return 2;
  if (!state.step3Complete) return 3;
  return 3;
}

export default function BookingProgressStepper({ state }: { state: BookingProgressState }) {
  const current = activeStep(state);
  const doneCount = [state.step1Complete, state.step2Complete, state.step3Complete].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
          Booking progress
        </p>
        <p className="text-[10px] font-mono text-white/45">
          {doneCount}/3 complete
        </p>
      </div>

      <div className="flex items-start">
        {STEPS.map((step, index) => {
          const complete =
            step.id === 1
              ? state.step1Complete
              : step.id === 2
                ? state.step2Complete
                : state.step3Complete;
          const isCurrent = step.id === current && !complete;
          const isLast = index === STEPS.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    complete
                      ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                      : isCurrent
                        ? "bg-gold-gradient text-[#011F15] shadow-gold-sm ring-2 ring-[#D4AF37]/50"
                        : "bg-white/5 text-white/40 border border-white/15"
                  }`}
                >
                  {complete ? <Check className="w-4 h-4" strokeWidth={3} /> : step.id}
                </div>
                <p
                  className={`mt-2 text-xs font-bold truncate w-full text-center ${
                    complete || isCurrent ? "text-white" : "text-white/40"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[9px] text-white/35 mt-0.5 hidden sm:block text-center">{step.hint}</p>
              </div>
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mt-[18px] mx-1 sm:mx-2 rounded-full transition-colors ${
                    complete ? "bg-emerald-500/70" : "bg-white/10"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
