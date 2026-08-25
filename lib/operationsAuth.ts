/** Operations Hub auth — team PINs validated server-side only (never shown in UI). */

import { signInWithMintedToken, signOutAdmin } from "@/lib/adminFirebaseSignIn";

export const OPS_TRUST_KEY = "visriva_ops_trusted";
export const OPS_TRUST_DAYS = 90;

export function normalizeOperationsPin(pin: string): string {
  return pin.trim().toLowerCase();
}

export function setOperationsTrustedLocal(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    OPS_TRUST_KEY,
    JSON.stringify({ ts: Date.now(), v: 1 })
  );
}

export function clearOperationsTrustedLocal(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OPS_TRUST_KEY);
}

export function isOperationsTrustedLocal(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(OPS_TRUST_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw) as { ts: number };
    return Date.now() - ts < OPS_TRUST_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Establish the Firebase Auth session that firestore.rules requires.
 *
 * The Hub's finance dashboard reads finance_transactions directly from the
 * browser, and that collection is now gated on the `admin` claim. The session
 * route returns a custom token alongside the cookie; exchanging it here is what
 * makes those reads succeed.
 */
async function adoptFirebaseSession(res: Response): Promise<void> {
  try {
    const data = (await res.json()) as { firebaseToken?: string | null };
    if (data?.firebaseToken) await signInWithMintedToken(data.firebaseToken);
  } catch {
    // Cookie session still valid for server routes; Firestore reads may be denied.
  }
}

export async function createOperationsSession(pin: string): Promise<boolean> {
  const res = await fetch("/api/operations/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) return false;
  await adoptFirebaseSession(res);
  return true;
}

/** Re-issue session cookie when this browser was previously trusted (no PIN resent). */
export async function refreshOperationsSession(): Promise<boolean> {
  const res = await fetch("/api/operations/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refresh: true }),
  });
  if (!res.ok) return false;
  await adoptFirebaseSession(res);
  return true;
}

export async function checkOperationsSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/operations/session", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

export async function destroyOperationsSession(): Promise<void> {
  await fetch("/api/operations/session", { method: "DELETE", credentials: "include" });
  clearOperationsTrustedLocal();
  await signOutAdmin();
}
