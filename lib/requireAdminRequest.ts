import { adminAuth } from "@/lib/firebaseAdmin";

/**
 * Server-side admin guard for privileged API routes.
 *
 * firestore.rules gate the browser, but firebase-admin bypasses rules entirely,
 * so any route using adminDb/getStorage is only as protected as its own checks.
 * This verifies the caller's Firebase ID token and requires the `admin` claim
 * minted by app/api/admin/firebase-token after a server-side PIN check.
 *
 * Usage:
 *   const gate = await requireAdminRequest(req);
 *   if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
 */

export type AdminAuthResult =
  | { ok: true; uid: string }
  | { ok: false; status: number; error: string };

export async function requireAdminRequest(req: Request): Promise<AdminAuthResult> {
  if (!adminAuth) {
    return {
      ok: false,
      status: 503,
      error: "Firebase Admin is not configured on the server.",
    };
  }

  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, status: 401, error: "Missing admin credentials." };
  }

  try {
    // Checks signature, expiry and audience. Revoked sessions are rejected too.
    const decoded = await adminAuth.verifyIdToken(match[1].trim(), true);
    if (decoded.admin !== true) {
      return { ok: false, status: 403, error: "Admin privileges required." };
    }
    return { ok: true, uid: decoded.uid };
  } catch {
    return { ok: false, status: 401, error: "Invalid or expired admin session." };
  }
}
