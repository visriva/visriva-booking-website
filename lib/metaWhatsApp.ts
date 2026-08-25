/**
 * Meta WhatsApp Cloud API — send + inbound parse.
 * Primary path (no QR session required).
 */

import crypto from "crypto";

export interface MetaConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  appSecret?: string;
}

export function getMetaConfig(): MetaConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) return null;

  return {
    phoneNumberId,
    accessToken,
    verifyToken:
      process.env.WHATSAPP_VERIFY_TOKEN ||
      process.env.WHATSAPP_VERIFY_TOKEN_SECRET ||
      "visriva_whatsapp_verify_token_2026",
    appSecret: process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET,
  };
}

export interface MetaSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  isWindowExpired?: boolean;
}

export async function sendMetaText(
  phone: string,
  text: string,
  logPrefix = "[Meta]"
): Promise<MetaSendResult> {
  const config = getMetaConfig();
  if (!config) return { ok: false, error: "Meta API not configured" };

  const cleanPhone = phone.replace(/[^0-9]/g, "");
  if (!cleanPhone || !text.trim()) return { ok: false, error: "missing phone or text" };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: { preview_url: true, body: text },
        }),
        signal: AbortSignal.timeout(12000),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      console.log(`${logPrefix} sent → ${cleanPhone}`);
      return { ok: true, messageId: data?.messages?.[0]?.id };
    }

    const errText = JSON.stringify(data);
    const isWindowExpired =
      errText.includes("131047") ||
      errText.toLowerCase().includes("24 hour") ||
      errText.toLowerCase().includes("window");

    console.warn(`${logPrefix} send failed (${res.status}):`, errText.slice(0, 200));
    return { ok: false, error: errText, isWindowExpired };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

export interface ParsedMetaInbound {
  phone: string;
  pushName: string;
  text: string;
  messageId?: string;
}

/** Parse Meta Cloud API webhook POST body. */
export function parseMetaInbound(body: unknown): ParsedMetaInbound | null {
  if (!body || typeof body !== "object") return null;
  const root = body as Record<string, unknown>;
  if (root.object !== "whatsapp_business_account") return null;

  const entries = root.entry;
  if (!Array.isArray(entries)) return null;

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const changes = (entry as Record<string, unknown>).changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      if (!change || typeof change !== "object") continue;
      const value = (change as Record<string, unknown>).value as Record<string, unknown> | undefined;
      if (!value) continue;

      const messages = value.messages;
      if (!Array.isArray(messages) || !messages.length) continue;

      const msg = messages[0] as Record<string, unknown>;
      if (msg.type !== "text") continue;

      const textObj = msg.text as Record<string, unknown> | undefined;
      const text = String(textObj?.body || "").trim();
      if (!text) continue;

      const from = String(msg.from || "").replace(/[^0-9]/g, "");
      if (!from) continue;

      let pushName = from;
      const contacts = value.contacts;
      if (Array.isArray(contacts) && contacts[0] && typeof contacts[0] === "object") {
        const profile = (contacts[0] as Record<string, unknown>).profile as Record<string, unknown> | undefined;
        if (profile?.name) pushName = String(profile.name);
      }

      return {
        phone: from,
        pushName,
        text,
        messageId: msg.id ? String(msg.id) : undefined,
      };
    }
  }

  return null;
}

export function verifyMetaWebhookChallenge(
  searchParams: URLSearchParams,
  verifyToken: string
): string | null {
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === verifyToken && challenge) {
    return challenge;
  }
  return null;
}

/** True when at least one Meta/WhatsApp app secret is configured. */
export function metaSignatureConfigured(): boolean {
  return !!(process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET);
}

/**
 * Verify Meta's `X-Hub-Signature-256` header against the RAW request body.
 * Meta signs each webhook POST with HMAC-SHA256(appSecret, rawBody) as
 * `sha256=<hex>`. We check against every configured app secret so a
 * mislabelled secret doesn't reject legitimate traffic. `rawBody` MUST be the
 * exact bytes received (do not re-stringify a parsed object).
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const header = (signatureHeader || "").trim();
  if (!header.startsWith("sha256=")) return false;
  const provided = header.slice("sha256=".length);

  const secrets = [process.env.WHATSAPP_APP_SECRET, process.env.META_APP_SECRET].filter(
    (s): s is string => !!s
  );
  if (secrets.length === 0) return false;

  for (const secret of secrets) {
    const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
    try {
      const a = Buffer.from(provided, "hex");
      const b = Buffer.from(expected, "hex");
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
    } catch {
      // malformed hex in header — treat as invalid
    }
  }
  return false;
}
