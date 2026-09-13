/**
 * Server-side crew PINs for /admin and /admin/operations.
 * Never import this from a client component — it must not ship in the browser bundle.
 * Login screens must not list these values.
 */
export const CREW_ADMIN_PINS = [
  "jeevan",
  "drupitha",
  "punith",
  "arpitha",
  "4848",
  "0315",
] as const;

export function pinsFromEnv(name: string): string[] {
  return (process.env[name] || "")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
}

export function allowedAdminPins(): string[] {
  return [
    ...new Set([
      ...pinsFromEnv("ADMIN_PASSWORDS"),
      ...pinsFromEnv("NEXT_PUBLIC_ADMIN_PASSWORDS"),
      ...CREW_ADMIN_PINS,
    ]),
  ];
}

export function allowedOperationsPins(): string[] {
  return [
    ...new Set([
      ...pinsFromEnv("OPERATIONS_PINS"),
      ...CREW_ADMIN_PINS,
    ]),
  ];
}
