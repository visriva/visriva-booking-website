import { getEvolutionConfig, getEvolutionHeaders } from "@/lib/evolutionApi";

export interface EvolutionSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/** Send text via Evolution API — tries both payload formats used across Evolution versions. */
export async function sendEvolutionText(
  phone: string,
  text: string,
  logPrefix = "[Evolution]",
  timeoutMs = 8000
): Promise<EvolutionSendResult> {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  if (!cleanPhone || !text.trim()) {
    return { ok: false, error: "missing phone or text" };
  }

  const { url, key, instance } = await getEvolutionConfig();
  const endpoint = `${url}/message/sendText/${instance}`;
  const headers = getEvolutionHeaders(key);

  const payloads = [
    {
      number: cleanPhone,
      text,
    },
    {
      number: cleanPhone,
      options: { delay: 800, presence: "composing", linkPreview: true },
      textMessage: { text },
    },
  ];

  for (const body of payloads) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`${logPrefix} [Reply Sent] → ${cleanPhone}`);
        return { ok: true, messageId: data?.key?.id || data?.messageId };
      }
      console.warn(`${logPrefix} send attempt failed (${res.status}):`, data);
    } catch (err: any) {
      console.warn(`${logPrefix} send exception:`, err?.message || err);
    }
  }

  return { ok: false, error: "all Evolution send formats failed" };
}
