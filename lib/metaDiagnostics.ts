/**
 * Meta Graph API diagnostics — discover WABA ID, app ID, webhook status.
 */

import { getMetaConfig } from "@/lib/metaWhatsApp";

async function graphGet(path: string, token: string) {
  const res = await fetch(`https://graph.facebook.com/v20.0/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10000),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function runMetaDiagnostics() {
  const meta = getMetaConfig();
  if (!meta) {
    return { configured: false, error: "WHATSAPP_PHONE_NUMBER_ID or access token missing" };
  }

  const webhookUrl =
    (process.env.WEBHOOK_BASE_URL?.replace(/\/$/, "") ||
      "https://visriva-booking-website-visriva.vercel.app") + "/api/whatsapp/webhook";

  const phone = await graphGet(
    `${meta.phoneNumberId}?fields=display_phone_number,verified_name`,
    meta.accessToken
  );

  let wabaId: string | undefined;
  const appId = process.env.WHATSAPP_APP_ID || process.env.META_APP_ID;
  const appSecret = process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET;
  if (appId && appSecret) {
    const appToken = `${appId}|${appSecret}`;
    const debug = await graphGet(
      `debug_token?input_token=${encodeURIComponent(meta.accessToken)}`,
      appToken
    );
    const granular = debug.body?.data?.granular_scopes as Array<{ scope?: string; target_ids?: string[] }> | undefined;
    if (granular) {
      for (const g of granular) {
        if (g.scope?.includes("whatsapp_business") && g.target_ids?.[0]) {
          wabaId = String(g.target_ids[0]);
          break;
        }
      }
    }
  }
  if (!wabaId) {
    const wabaList = await graphGet("me/whatsapp_business_accounts", meta.accessToken);
    const first = wabaList.body?.data?.[0];
    if (first?.id) wabaId = String(first.id);
  }

  const envWabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const envAppId = process.env.WHATSAPP_APP_ID || process.env.META_APP_ID;

  let wabaSubscribe: { ok: boolean; status?: number; body?: unknown } | undefined;
  if (wabaId) {
    const res = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/subscribed_apps`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${meta.accessToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });
    const body = await res.json().catch(() => ({}));
    wabaSubscribe = { ok: res.ok, status: res.status, body };
  }

  let subscribedApps: unknown;
  if (wabaId) {
    const sub = await graphGet(`${wabaId}/subscribed_apps`, meta.accessToken);
    subscribedApps = sub.body;
  }

  // Self-test webhook verify challenge
  let webhookVerified = false;
  try {
    const testUrl = `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(meta.verifyToken)}&hub.challenge=visriva_ok`;
    const res = await fetch(testUrl, { signal: AbortSignal.timeout(8000) });
    webhookVerified = res.ok && (await res.text()).trim() === "visriva_ok";
  } catch {
    webhookVerified = false;
  }

  const envWabaMismatch = envWabaId && wabaId && envWabaId !== wabaId;

  return {
    configured: true,
    tokenValid: phone.ok,
    phoneNumberId: meta.phoneNumberId,
    displayPhone: phone.body?.display_phone_number,
    verifiedName: phone.body?.verified_name,
    wabaIdFromApi: wabaId,
    envWabaId,
    envAppId,
    envWabaMismatch,
    webhookUrl,
    verifyToken: meta.verifyToken,
    webhookVerified,
    wabaSubscribe,
    subscribedApps,
    phoneApiError: phone.ok ? undefined : phone.body,
    manualSteps: [
      "1. Open https://developers.facebook.com → Your App → WhatsApp → Configuration",
      `2. Callback URL: ${webhookUrl}`,
      `3. Verify token: ${meta.verifyToken}`,
      "4. Click Verify and Save",
      "5. Subscribe to field: messages",
      "6. Send 'hi' from another phone to your business number",
    ],
    fixEnvVars: envWabaMismatch
      ? { WHATSAPP_BUSINESS_ACCOUNT_ID: wabaId }
      : wabaId && !envWabaId
        ? { WHATSAPP_BUSINESS_ACCOUNT_ID: wabaId }
        : undefined,
  };
}
