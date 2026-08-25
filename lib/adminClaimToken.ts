import { adminAuth } from "@/lib/firebaseAdmin";

/**
 * Mints Firebase custom tokens carrying the `admin` claim that firestore.rules
 * checks via `isAdmin()`.
 *
 * This is what lets the admin/ops UI keep reading Firestore directly from the
 * browser after the rules were locked down: a PIN is verified server-side, then
 * the browser exchanges the returned token for a real Firebase Auth session.
 * The PIN itself never has to exist in the client bundle.
 *
 * Server-side only — never import from a client component.
 */

/** Stable synthetic UID for the shared operations console session. */
const OPS_CONSOLE_UID = "visriva-operations-console";

export async function mintAdminClaimToken(
  uid: string = OPS_CONSOLE_UID
): Promise<string | null> {
  if (!adminAuth) {
    console.error(
      "[adminClaimToken] Firebase Admin not initialised — set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_* env vars"
    );
    return null;
  }
  try {
    return await adminAuth.createCustomToken(uid, { admin: true });
  } catch (err) {
    console.error("[adminClaimToken] createCustomToken failed:", err);
    return null;
  }
}
