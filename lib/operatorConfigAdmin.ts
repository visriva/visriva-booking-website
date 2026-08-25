import { adminDb } from "@/lib/firebaseAdmin";
import { DEFAULT_OPERATOR_CONFIG, type OperatorConfig } from "@/lib/firebase";

/**
 * Server-side reader for config/operator.
 *
 * Replaces getOperatorConfigServer(), which used the *client* SDK. That worked
 * only while config/operator was world-readable; now that firestore.rules make
 * it admin-only, an unauthenticated server read is denied — and because the
 * caller swallowed the error and returned defaults, it failed silently rather
 * than loudly. firebase-admin bypasses rules, so this keeps the doc private
 * while server routes still get the real values.
 */
export async function getOperatorConfigAdmin(): Promise<OperatorConfig> {
  if (!adminDb) return DEFAULT_OPERATOR_CONFIG;
  try {
    const snap = await adminDb.collection("config").doc("operator").get();
    if (snap.exists) {
      return { ...DEFAULT_OPERATOR_CONFIG, ...(snap.data() as OperatorConfig) };
    }
  } catch (e) {
    console.error("[operatorConfigAdmin] read failed:", e);
  }
  return DEFAULT_OPERATOR_CONFIG;
}
