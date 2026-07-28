/**
 * Firebase Admin SDK — Server-side initializer
 * Uses environment variables set in Vercel (never exposed to browser).
 * Compatible with firebase-admin v12+ modular API.
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let app: App | undefined;

// Prevent re-initialization across hot reloads in Next.js dev mode
if (!getApps().length) {
  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel stores \n as literal \\n in env vars — restore actual newlines
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    console.warn(
      "[firebaseAdmin] Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY. " +
      "Firestore server-side features will be unavailable."
    );
  }
} else {
  app = getApps()[0];
}

/** Firestore Admin client — use in API routes only (server-side) */
export const adminDb = app ? getFirestore(app) : null;

/** Firebase Admin Auth — use in API routes only */
export const adminAuth = app ? getAuth(app) : null;
