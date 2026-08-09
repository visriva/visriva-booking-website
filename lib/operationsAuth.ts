/** Operations Hub auth — PIN is G1 only (override via OPERATIONS_PIN env on server). */

export const OPS_TRUST_KEY = "visriva_ops_trusted";
export const OPS_TRUST_DAYS = 90;

export function normalizeOperationsPin(pin: string): string {
  return pin.trim().toLowerCase();
}

export function isOperationsPinValid(pin: string): boolean {
  return normalizeOperationsPin(pin) === "g1";
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

export async function createOperationsSession(pin: string): Promise<boolean> {
  const res = await fetch("/api/operations/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ pin }),
  });
  return res.ok;
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
}
