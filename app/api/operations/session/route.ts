import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signOpsToken, verifyOpsToken, opsSessionSecretConfigured } from "@/lib/opsSession";
import { mintAdminClaimToken } from "@/lib/adminClaimToken";
import { allowedOperationsPins } from "@/lib/crewPins";

export const runtime = "nodejs";

const OPS_COOKIE = "visriva_ops_session";
const OPS_REFRESH = "visriva_ops_refresh";
const MAX_AGE = 90 * 24 * 60 * 60; // 90 days — trusted device

/**
 * Team PINs for the Operations Hub.
 * OPERATIONS_PINS env (comma-separated) is merged with the same crew PINs as /admin.
 * Values are never shown on the login screen.
 */
function allowedPins(): string[] {
  return allowedOperationsPins();
}

function setSessionCookies() {
  const jar = cookies();
  const opts = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE,
    path: "/",
  };
  const session = signOpsToken(MAX_AGE);
  const refresh = signOpsToken(MAX_AGE);
  if (!session || !refresh) {
    // No signing secret configured — refuse to issue a session rather than
    // fall back to a forgeable static value.
    throw new Error("ops-session-secret-missing");
  }
  jar.set(OPS_COOKIE, session, opts);
  jar.set(OPS_REFRESH, refresh, opts);
}

export async function GET() {
  const cookie = cookies().get(OPS_COOKIE);
  return NextResponse.json({ authenticated: verifyOpsToken(cookie?.value) });
}

export async function POST(req: Request) {
  try {
    if (!opsSessionSecretConfigured()) {
      return NextResponse.json(
        { error: "Operations sessions are not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();

    if (body?.refresh === true) {
      const refresh = cookies().get(OPS_REFRESH);
      if (!verifyOpsToken(refresh?.value)) {
        return NextResponse.json({ error: "Refresh not allowed" }, { status: 401 });
      }
      setSessionCookies();
      // Re-mint so a refreshed tab regains its Firestore identity too.
      const firebaseToken = await mintAdminClaimToken();
      return NextResponse.json({ ok: true, authenticated: true, firebaseToken });
    }

    // Throttle PIN guessing.
    const limit = rateLimit(`ops-session:${clientIp(req)}`, 8, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const pins = allowedPins();
    if (pins.length === 0) {
      return NextResponse.json(
        { error: "Operations access is not configured. Set OPERATIONS_PINS on the server." },
        { status: 503 }
      );
    }

    const pin = String(body?.pin || "")
      .trim()
      .toLowerCase();
    if (!pin || !pins.includes(pin)) {
      return NextResponse.json({ error: "Invalid operations PIN" }, { status: 401 });
    }

    setSessionCookies();

    // The Hub reads the finance ledger directly from the browser, which
    // firestore.rules now gates on the `admin` claim. Hand back a custom token
    // so the client can establish that Firebase identity.
    const firebaseToken = await mintAdminClaimToken();

    return NextResponse.json({ ok: true, authenticated: true, firebaseToken });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE() {
  const jar = cookies();
  jar.set(OPS_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  jar.set(OPS_REFRESH, "", { httpOnly: true, maxAge: 0, path: "/" });
  return NextResponse.json({ ok: true });
}
