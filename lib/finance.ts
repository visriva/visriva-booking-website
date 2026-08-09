import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type FinanceTransactionType = "income" | "expense";

export interface FinanceTransaction {
  id?: string;
  type: FinanceTransactionType;
  amount: number;
  category: string;
  description: string;
  /** Where money was spent (expense) or received from (income) */
  party?: string;
  eventRef?: string;
  date: string; // YYYY-MM-DD
  bank?: string;
  paymentMethod?: string;
  reason?: string;
  createdAt?: unknown;
}

export const INCOME_CATEGORIES = [
  "Event Booking",
  "Deposit",
  "Final Payment",
  "Add-on / Reorder",
  "Planner Referral",
  "Other Income",
] as const;

export const EXPENSE_CATEGORIES = [
  "Crew / Labour",
  "Travel & Fuel",
  "Print Supplies",
  "Equipment",
  "Marketing",
  "Rent / Storage",
  "Software & Subscriptions",
  "Maintenance",
  "Miscellaneous",
] as const;

export interface FinanceSummary {
  income: number;
  expenses: number;
  profit: number;
  marginPct: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

function isDummyFirebase(): boolean {
  return !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
}

export function subscribeFinanceTransactions(
  callback: (rows: Array<FinanceTransaction & { id: string }>) => void
): () => void {
  if (isDummyFirebase()) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(collection(db, "finance_transactions"), orderBy("date", "desc"));
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as FinanceTransaction),
        }));
        callback(rows);
      },
      (err) => {
        console.warn("finance_transactions snapshot:", err.message);
        callback([]);
      }
    );
  } catch (e) {
    console.warn("subscribeFinanceTransactions:", e);
    return () => {};
  }
}

export async function addFinanceTransaction(
  tx: Omit<FinanceTransaction, "id" | "createdAt">
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!tx.date || !tx.amount || tx.amount <= 0) {
    return { success: false, error: "Amount and date are required" };
  }

  if (isDummyFirebase()) {
    return { success: true, id: `demo-${Date.now()}` };
  }

  try {
    const ref = await addDoc(collection(db, "finance_transactions"), {
      ...tx,
      amount: Number(tx.amount),
      createdAt: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save transaction",
    };
  }
}

export async function deleteFinanceTransaction(id: string): Promise<{ success: boolean }> {
  if (isDummyFirebase()) return { success: true };
  try {
    await deleteDoc(doc(db, "finance_transactions", id));
    return { success: true };
  } catch {
    return { success: false };
  }
}


export function summarizeTransactions(
  rows: FinanceTransaction[],
  year: number,
  month?: number
): FinanceSummary {
  const filtered = rows.filter((r) => {
    const [y, m] = r.date.split("-").map(Number);
    if (y !== year) return false;
    if (month !== undefined && m !== month) return false;
    return true;
  });

  let income = 0;
  let expenses = 0;
  const incomeByCategory: Record<string, number> = {};
  const expensesByCategory: Record<string, number> = {};

  for (const r of filtered) {
    const amt = Number(r.amount) || 0;
    if (r.type === "income") {
      income += amt;
      incomeByCategory[r.category] = (incomeByCategory[r.category] || 0) + amt;
    } else {
      expenses += amt;
      expensesByCategory[r.category] = (expensesByCategory[r.category] || 0) + amt;
    }
  }

  const profit = income - expenses;
  const marginPct = income > 0 ? (profit / income) * 100 : 0;

  return { income, expenses, profit, marginPct, incomeByCategory, expensesByCategory };
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
}
