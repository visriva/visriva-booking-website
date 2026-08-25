import crypto from "crypto";

/**
 * Signed, expiring session tokens for the Operations Hub.
 *
 * Replaces the previous forgeable `cookie?.value === "1"` check: a client can
 * no longer mint a valid session by sending `Cookie: visriva_ops_session=1`.
 * A token is only accepted if its HMAC matches a server-only secret and it has
 * not expired.
 *
 * Token format: `<b64url(payload)>.<b64url(HMAC_SHA256(payload, secret))>`
 * where payload = base64url(JSON.stringify({ exp: <unix seconds> })).
 */

/**
 * Server-only signing secret. Prefers a dedicated OPS_SESSION_SECRET, then
 * falls back to other server secrets that already exist in this project's
 * environment so signed sessions work without adding new configuration.
 * Set OPS_SESSION_SECRET explicitly in production for a stable, dedicated key.
 */
function getSecret(): string | null {
  const secret =
    process.env.OPS_SESSION_SECRET ||
    process.env.CRON_SECRET ||
    process.env.WHATSAPP_APP_SECRET ||
    process.env.META_APP_SECRET ||
    "";
  return secret.length >= 8 ? secret : null;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string, secret: string): string {
  return b64url(crypto.createHmac("sha256", secret).update(payload).digest());
}

/** Mint a signed session token valid for `ttlSeconds`. Null if no secret configured. */
export function signOpsToken(ttlSeconds: number): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = b64url(Buffer.from(JSON.stringify({ exp })));
  return `${payload}.${sign(payload, secret)}`;
}

/** True only for an untampered, unexpired token signed with the server secret. */
export function verifyOpsToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;

  const payload = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expectedSig = sign(payload, secret);

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const json = Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    const decoded = JSON.parse(json) as { exp?: number };
    return typeof decoded.exp === "number" && decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

/** True when a signing secret is available (i.e. signed sessions can be issued). */
export function opsSessionSecretConfigured(): boolean {
  return getSecret() !== null;
}
