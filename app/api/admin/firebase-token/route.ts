import { NextResponse } from "next/server";
import { mintAdminClaimToken } from "@/lib/adminClaimToken";
import { adminDb } from "@/lib/firebaseAdmin";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * Exchanges an admin or operator PIN for a Firebase custom token carrying the
 * `admin` claim that firestore.rules requires.
 *
 * The PIN is verified HERE, on the server. Previously:
 *   - the admin check ran in the browser (lib/adminAuth.ts) against
 *     NEXT_PUBLIC_ADMIN_PASSWORDS plus a hardcoded MASTER_PIN of "4848";
 *   - the operator check compared against config/operator.pin, which the
 *     browser read straight out of a world-readable Firestore doc.
 * Both were readable in DevTools. The "4848" master PIN is NOT honoured here.
 *
 * config/operator is now admin-read-only, but firebase-admin bypasses rules, so
 * the operator PIN can stay managed from the admin CMS without being public.
 */

function envPins(name: string): string[] {
  return (process.env[name] || "")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
}

function adminPins(): string[] {
  // NEXT_PUBLIC_ADMIN_PASSWORDS is a migration fallback only — it still ships in
  // the client bundle. Set ADMIN_PASSWORDS and remove the public one.
  const primary = envPins("ADMIN_PASSWORDS");
  return primary.length > 0 ? primary : envPins("NEXT_PUBLIC_ADMIN_PASSWORDS");
}

/** Operator PIN from the admin-managed config doc, read with the admin SDK. */
async function operatorPinFromConfig(): Promise<string | null> {
  if (!adminDb) return null;
  try {
    const snap = await adminDb.collection("config").doc("operator").get();
    const pin = snap.exists ? (snap.data()?.pin as string | undefined) : undefined;
    const trimmed = pin?.trim().toLowerCase();
    return trimmed && trimmed.length > 0 ? trimmed : null;
  } catch (err) {
    console.error("[firebase-token] failed to read config/operator:", err);
    return null;
  }
}

export async function POST(req: Request) {
  // Short PINs are brute-forceable now that the check is server-side.
  const limit = rateLimit(`admin-token:${clientIp(req)}`, 8, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let pin = "";
  try {
    const body = await req.json();
    pin = String(body?.pin ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!pin) {
    return NextResponse.json({ error: "PIN required" }, { status: 400 });
  }

  const allowed = new Set<string>([...adminPins(), ...envPins("OPERATOR_PINS")]);

  const configPin = await operatorPinFromConfig();
  if (configPin) allowed.add(configPin);

  if (allowed.size === 0) {
    return NextResponse.json(
      {
        error:
          "Access is not configured. Set ADMIN_PASSWORDS on the server (or an operator PIN in the admin CMS).",
      },
      { status: 503 }
    );
  }

  if (!allowed.has(pin)) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const token = await mintAdminClaimToken();
  if (!token) {
    return NextResponse.json(
      { error: "Firebase Admin credentials are not configured on the server." },
      { status: 503 }
    );
  }

  return NextResponse.json({ token });
}
