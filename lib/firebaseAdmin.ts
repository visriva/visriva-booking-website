/**
 * Firebase Admin SDK — Server-side initializer
 * Uses environment variables set in Vercel (never exposed to browser).
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

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
  } else {
    console.warn(
      "[firebaseAdmin] Missing credentials — projectId:",
      !!projectId,
      "clientEmail:",
      !!clientEmail,
      "privateKey:",
      !!privateKey
    );
  }
} else {
  app = getApps()[0];
}

/** Firestore Admin client — use in API routes only (server-side) */
export const adminDb = app ? getFirestore(app) : null;

/** Firebase Admin Auth — use in API routes only */
export const adminAuth = app ? getAuth(app) : null;
