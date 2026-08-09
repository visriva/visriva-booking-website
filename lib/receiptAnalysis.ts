export interface ReceiptAnalysis {
  type: "income" | "expense";
  amount: number;
  currency: string;
  category: string;
  description: string;
  party: string;
  bank: string;
  paymentMethod: string;
  date: string;
  reason: string;
  confidence: "high" | "medium" | "low";
  rawNotes?: string;
}
