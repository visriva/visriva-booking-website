import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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
  jar.set(OPS_COOKIE, "1", opts);
  jar.set(OPS_REFRESH, "1", opts);
}

export async function GET() {
  const cookie = cookies().get(OPS_COOKIE);
  return NextResponse.json({ authenticated: cookie?.value === "1" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body?.refresh === true) {
      const refresh = cookies().get(OPS_REFRESH);
      if (refresh?.value !== "1") {
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
