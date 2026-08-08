import { getEvolutionConfig, getEvolutionHeaders, type EvolutionConfig } from "@/lib/evolutionApi";

export function extractEvolutionQr(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  const qrcode = d.qrcode;
  const raw =
    (typeof d.base64 === "string" ? d.base64 : "") ||
    (qrcode && typeof qrcode === "object" && typeof (qrcode as Record<string, unknown>).base64 === "string"
      ? String((qrcode as Record<string, unknown>).base64)
      : "") ||
    (typeof qrcode === "string" ? qrcode : "");
  return raw.replace(/^data:image\/[a-z]+;base64,/, "");
}

export async function fetchEvolutionState(config: EvolutionConfig): Promise<string> {
  const headers = getEvolutionHeaders(config.key);

  try {
    const res = await fetch(`${config.url}/instance/connectionState/${config.instance}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return data?.instance?.state || data?.state || "unknown";
    }
  } catch {
    /* fall through */
  }

  try {
    const res = await fetch(`${config.url}/instance/fetchInstances`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const list = await res.json().catch(() => []);
      const row = Array.isArray(list)
        ? list.find((i: { name?: string }) => i.name === config.instance)
        : null;
      if (row?.connectionStatus === "open") return "open";
      if (row) return "close";
    }
  } catch {
    /* ignore */
  }

  return "unknown";
}

export async function fetchEvolutionQr(config: EvolutionConfig): Promise<string> {
  const headers = getEvolutionHeaders(config.key);
  const res = await fetch(`${config.url}/instance/connect/${config.instance}`, {
    headers,
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return "";
  const data = await res.json().catch(() => ({}));
  return extractEvolutionQr(data);
}

export async function resetEvolutionInstance(config: EvolutionConfig): Promise<string> {
  const headers = getEvolutionHeaders(config.key);

  try {
    await fetch(`${config.url}/instance/logout/${config.instance}`, {
      method: "DELETE",
      headers,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    /* logout can hang on dead sessions */
  }

  try {
    await fetch(`${config.url}/instance/delete/${config.instance}`, {
      method: "DELETE",
      headers,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    /* may already be deleted */
  }

  const createRes = await fetch(`${config.url}/instance/create`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      instanceName: config.instance,
      token: config.key,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
    signal: AbortSignal.timeout(20000),
  });

  const createData = await createRes.json().catch(() => ({}));
  let qr = extractEvolutionQr(createData);
  if (!qr) qr = await fetchEvolutionQr(config);
  return qr;
}
