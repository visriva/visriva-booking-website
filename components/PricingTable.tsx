// components/PricingTable.tsx
import React from 'react';

interface PricingItem {
  feature: string;
  dslr: string;
  ipad: string;
}

interface PricingTableProps {
  pricing: PricingItem[];
}

export default function PricingTable({ pricing }: PricingTableProps) {
  return (
    <section className="my-12">
      <h2 className="text-3xl font-playfair text-center text-gold-400 mb-6">Pricing</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto bg-emerald-900/60 backdrop-blur-sm border border-emerald-800 rounded-lg">
          <thead className="bg-emerald-800/80">
            <tr>
              <th className="px-4 py-2 text-left text-emerald-200">Feature</th>
              <th className="px-4 py-2 text-left text-emerald-200">DSLR</th>
              <th className="px-4 py-2 text-left text-emerald-200">iPad</th>
            </tr>
          </thead>
          <tbody>
            {pricing.map((item, idx) => (
              <tr key={idx} className="border-t border-emerald-700/50 hover:bg-emerald-800/30 transition-colors">
                <td className="px-4 py-2 text-emerald-100">{item.feature}</td>
                <td className="px-4 py-2 text-emerald-100">{item.dslr}</td>
                <td className="px-4 py-2 text-emerald-100">{item.ipad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
