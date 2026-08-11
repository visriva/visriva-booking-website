/**
 * Firebase Admin SDK — Server-side initializer
 * Uses environment variables set in Vercel (never exposed to browser).
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let app: App | undefined;

function parsePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

if (!getApps().length) {
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonRaw) {
    try {
      const serviceAccount = JSON.parse(jsonRaw);
      app = initializeApp({ credential: cert(serviceAccount) });
    } catch (err) {
      console.error("[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_JSON parse failed:", err);
    }
  }

  if (!app) {
    const projectId =
      process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (projectId && clientEmail && privateKey) {
      try {
        app = initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
      } catch (err) {
        console.error("[firebaseAdmin] initializeApp failed:", err);
      }
    } else if (!jsonRaw) {
      console.warn(
        "[firebaseAdmin] Missing credentials — set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_* env vars"
      );
    }
  }
} else {
  app = getApps()[0];
}

/** Firestore Admin client — use in API routes only (server-side) */
export const adminDb = app
  ? (() => {
      const firestore = getFirestore(app);
      try {
        firestore.settings({ ignoreUndefinedProperties: true });
      } catch {
        // already initialized
      }
      return firestore;
    })()
  : null;
