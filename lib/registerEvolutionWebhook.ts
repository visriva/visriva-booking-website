import { getEvolutionConfig, getEvolutionHeaders, getWebhookUrl } from "@/lib/evolutionApi";

/** Register inbound webhook on Evolution instance (nested payload — v1.8.x). */
export async function registerEvolutionWebhook(requestHost?: string | null): Promise<{
  ok: boolean;
  url: string;
  error?: string;
}> {
  const webhookUrl = getWebhookUrl(requestHost);
  try {
    const { url, key, instance } = await getEvolutionConfig();
    const endpoint = `${url}/webhook/set/${instance}`;
    console.log(`[Webhook Register] ${instance} → ${webhookUrl}`);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: getEvolutionHeaders(key),
      body: JSON.stringify({
        webhook: {
          url: webhookUrl,
          enabled: true,
          events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Webhook Register] failed:", res.status, errText.slice(0, 200));
      return { ok: false, url: webhookUrl, error: `HTTP ${res.status}` };
    }

    console.log("[Webhook Register] success");
    return { ok: true, url: webhookUrl };
  } catch (err: any) {
    console.error("[Webhook Register] error:", err?.message || err);
    return { ok: false, url: webhookUrl, error: err?.message || "register failed" };
  }
}
