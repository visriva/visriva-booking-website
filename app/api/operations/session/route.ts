import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const OPS_COOKIE = "visriva_ops_session";
const MAX_AGE = 90 * 24 * 60 * 60; // 90 days — trusted device

function expectedPin(): string {
  return (process.env.OPERATIONS_PIN || "G1").trim().toLowerCase();
}

export async function GET() {
  const cookie = cookies().get(OPS_COOKIE);
  return NextResponse.json({ authenticated: cookie?.value === "1" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pin = String(body?.pin || "")
      .trim()
      .toLowerCase();
    if (pin !== expectedPin()) {
      return NextResponse.json({ error: "Invalid operations PIN" }, { status: 401 });
    }

    cookies().set(OPS_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });

    return NextResponse.json({ ok: true, authenticated: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE() {
  cookies().set(OPS_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  return NextResponse.json({ ok: true });
}
