import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FinanceTransaction } from "@/lib/finance";

export interface FinanceSettings {
  googleSheetUrl?: string;
  /** Google Apps Script web app URL for appending rows */
  googleSheetWebhookUrl?: string;
  autoSyncOnSave?: boolean;
}

export const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
  googleSheetUrl: "",
  googleSheetWebhookUrl: "",
  autoSyncOnSave: true,
};

const DOC_PATH = "config/finance_settings";

export function subscribeFinanceSettings(callback: (s: FinanceSettings) => void): () => void {
  try {
    const ref = doc(db, "config", "finance_settings");
    return onSnapshot(
      ref,
      (snap) => {
        callback(snap.exists() ? { ...DEFAULT_FINANCE_SETTINGS, ...(snap.data() as FinanceSettings) } : DEFAULT_FINANCE_SETTINGS);
      },
      () => callback(DEFAULT_FINANCE_SETTINGS)
    );
  } catch {
    callback(DEFAULT_FINANCE_SETTINGS);
    return () => {};
  }
}

export async function saveFinanceSettings(
  settings: FinanceSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    await setDoc(doc(db, "config", "finance_settings"), settings, { merge: true });
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Save failed" };
  }
}

export async function getFinanceSettings(): Promise<FinanceSettings> {
  try {
    const snap = await getDoc(doc(db, "config", "finance_settings"));
    if (snap.exists()) return { ...DEFAULT_FINANCE_SETTINGS, ...(snap.data() as FinanceSettings) };
  } catch {
    // ignore
  }
  return DEFAULT_FINANCE_SETTINGS;
}

export function transactionToSheetRow(tx: FinanceTransaction & { id?: string }): string[] {
  return [
    tx.date,
    tx.type,
    String(tx.amount),
    tx.category,
    tx.description,
    tx.party || "",
    tx.bank || "",
    tx.paymentMethod || "",
    tx.reason || "",
    tx.eventRef || "",
    tx.id || "",
    new Date().toISOString(),
  ];
}

export const SHEET_HEADERS = [
  "Date",
  "Type",
  "Amount (INR)",
  "Category",
  "Description",
  "Party",
  "Bank",
  "Payment Method",
  "Reason",
  "Event Ref",
  "Firestore ID",
  "Synced At",
];
