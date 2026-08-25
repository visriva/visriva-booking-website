import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * Grants the `admin` custom claim to an allowlisted email/password account.
 *
 * The /ai-agent dashboard authenticates with signInWithEmailAndPassword
 * (components/ai-agent/AuthGuard). Those sessions satisfy `request.auth != null`
 * but carry no `admin` claim, so firestore.rules would deny wa_conversations,
 * wa_agent_settings and wa_kb_documents.
 *
 * Relaxing those rules to "any signed-in user" is not an option: while the
 * Email/Password provider is enabled, createUserWithEmailAndPassword works from
 * the browser with only the public API key, so anyone could self-register and
 * read the whole WhatsApp corpus. Instead the server decides, from an email
 * allowlist it alone can see.
 *
 * Set ADMIN_EMAILS (comma-separated). Fails closed when unset.
 */

function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req: Request) {
  const limit = rateLimit(`grant-claim:${clientIp(req)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  if (!adminAuth) {
    return NextResponse.json(
      { error: "Firebase Admin is not configured on the server." },
      { status: 503 }
    );
  }

  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const emails = allowedEmails();
  if (emails.length === 0) {
    return NextResponse.json(
      { error: "Agent access is not configured. Set ADMIN_EMAILS on the server." },
      { status: 503 }
    );
  }

  let uid: string;
  let email: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(match[1].trim());
    uid = decoded.uid;
    email = decoded.email?.toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  // Require a verified-by-Firebase email that we explicitly trust.
  if (!email || !emails.includes(email)) {
    return NextResponse.json(
      { error: "This account is not authorised for the agent dashboard." },
      { status: 403 }
    );
  }

  try {
    await adminAuth.setCustomUserClaims(uid, { admin: true });
  } catch (err) {
    console.error("[grant-claim] setCustomUserClaims failed:", err);
    return NextResponse.json({ error: "Could not grant access." }, { status: 500 });
  }

  // The client must refresh its ID token before the claim appears in rules.
  return NextResponse.json({ ok: true });
}
