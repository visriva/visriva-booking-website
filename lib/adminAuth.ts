/**
 * Client-side admin PIN validation.
 * Passwords are loaded from NEXT_PUBLIC_ADMIN_PASSWORDS (comma-separated).
 * Never hardcode credentials in source — set them in .env.local / Vercel env.
 */

function getAuthorizedPasswords(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_PASSWORDS;
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
}

export function hasAdminPasswordsConfigured(): boolean {
  return getAuthorizedPasswords().length > 0;
}

export function isAuthorizedAdminPassword(password: string): boolean {
  const allowed = getAuthorizedPasswords();
  if (allowed.length === 0) return false;
  return allowed.includes(password.trim().toLowerCase());
}
