"use client";

import { signInWithCustomToken, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Bridges the PIN-based admin/ops login to a real Firebase Auth session.
 *
 * firestore.rules now requires an `admin` custom claim for every admin read and
 * write. The PIN is checked server-side, which returns a custom token; exchanging
 * it here gives the browser an identity the rules can actually verify. Without
 * this step the admin UI would get permission-denied on locked collections.
 *
 * Firebase persists the session in localStorage and refreshes the ID token
 * automatically, so a reload keeps the operator signed in.
 */

export type AdminSignInResult = { ok: boolean; error?: string };

/** True once a Firebase session carrying the `admin` claim is active. */
export async function hasAdminClaim(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    const token = await user.getIdTokenResult();
    return token.claims.admin === true;
  } catch {
    return false;
  }
}

/** Resolve once Firebase has restored any persisted session (or timed out). */
export function waitForAuthReady(timeoutMs = 6000): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    const unsub = onAuthStateChanged(auth, () => {
      clearTimeout(timer);
      unsub();
      done();
    });
  });
}

/** Sign in with a token already minted by the server (e.g. the ops session route). */
export async function signInWithMintedToken(token: string): Promise<AdminSignInResult> {
  try {
    await signInWithCustomToken(auth, token);
    return { ok: true };
  } catch (e) {
    console.error("[adminFirebaseSignIn] custom token sign-in failed:", e);
    return {
      ok: false,
      error:
        "Could not establish a Firebase session. Enable the Custom Token / Anonymous sign-in providers in the Firebase console.",
    };
  }
}

/** Exchange an admin PIN for a Firebase session with the `admin` claim. */
export async function signInAdminWithPin(pin: string): Promise<AdminSignInResult> {
  try {
    const res = await fetch("/api/admin/firebase-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };

    if (res.status === 429) {
      return { ok: false, error: data.error || "Too many attempts. Try again shortly." };
    }
    if (!res.ok || !data.token) {
      return { ok: false, error: data.error || "Invalid admin PIN." };
    }

    return signInWithMintedToken(data.token);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Network error during sign-in.",
    };
  }
}

/** Clear the Firebase session (use alongside clearing any local PIN flag). */
export async function signOutAdmin(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // non-fatal
  }
}
