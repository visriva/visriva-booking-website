import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signOpsToken, verifyOpsToken, opsSessionSecretConfigured } from "@/lib/opsSession";

export const runtime = "nodejs";

const OPS_COOKIE = "visriva_ops_session";
const OPS_REFRESH = "visriva_ops_refresh";
const MAX_AGE = 90 * 24 * 60 * 60; // 90 days — trusted device

/** Team PINs for Operations Hub. Override with OPERATIONS_PINS (comma-separated). */
function allowedPins(): string[] {
  const fromEnv = (process.env.OPERATIONS_PINS || "")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (fromEnv.length > 0) return fromEnv;
  return ["drupitha", "punith", "arpitha", "jeevan"];
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
      return NextResponse.json({ ok: true, authenticated: true });
    }

    const pin = String(body?.pin || "")
      .trim()
      .toLowerCase();
    if (!pin || !allowedPins().includes(pin)) {
      return NextResponse.json({ error: "Invalid operations PIN" }, { status: 401 });
    }

    setSessionCookies();
    return NextResponse.json({ ok: true, authenticated: true });
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
