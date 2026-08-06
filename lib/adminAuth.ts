/**
 * Client-side admin PIN validation.
 * Passwords are loaded from NEXT_PUBLIC_ADMIN_PASSWORDS (comma-separated).
 * Falls back to master PIN 4848 when env is not configured.
 */

const MASTER_PIN = "4848";

function getAuthorizedPasswords(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_PASSWORDS;
  const fromEnv = raw?.trim()
    ? raw
        .split(",")
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean)
    : [];
  const master = MASTER_PIN.toLowerCase();
  if (fromEnv.length > 0) {
    return fromEnv.includes(master) ? fromEnv : [...fromEnv, master];
  }
  return [master];
}

export function hasAdminPasswordsConfigured(): boolean {
  return getAuthorizedPasswords().length > 0;
}

export function isAuthorizedAdminPassword(password: string): boolean {
  const allowed = getAuthorizedPasswords();
  if (allowed.length === 0) return false;
  return allowed.includes(password.trim().toLowerCase());
}
