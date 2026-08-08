export interface ParsedInboundMessage {
  phone: string;
  pushName: string;
  text: string;
  remoteJid: string;
}

/** Parse Evolution API MESSAGES_UPSERT webhook payload. Returns null if event should be ignored. */
export function parseEvolutionInbound(body: unknown): ParsedInboundMessage | null {
  if (!body || typeof body !== "object") return null;

  const root = body as Record<string, unknown>;
  const event = String(root.event || root.type || "").toUpperCase();

  // Ignore connection-only events
  if (event && event.includes("CONNECTION") && !event.includes("MESSAGE")) {
    return null;
  }

  const data = (root.data as Record<string, unknown>) || root;

  const key = (data.key as Record<string, unknown>) || {};
  const remoteJid =
    String(key.remoteJid || data.remoteJid || data.sender || "").trim();
  const fromMe = Boolean(key.fromMe ?? data.fromMe);

  if (!remoteJid || fromMe) return null;
  if (remoteJid.endsWith("@g.us")) return null;
  if (remoteJid.includes("broadcast") || remoteJid.includes("status@")) return null;

  const message = (data.message as Record<string, unknown>) || {};
  const text = String(
    message.conversation ||
      (message.extendedTextMessage as Record<string, unknown>)?.text ||
      (message.imageMessage as Record<string, unknown>)?.caption ||
      data.body ||
      ""
  ).trim();

  if (!text) return null;

  const phone = remoteJid.replace(/@s\.whatsapp\.net|@g\.us/g, "").replace(/[^0-9]/g, "");
  if (!phone) return null;

  const pushName = String(data.pushName || (data as any)?.data?.pushName || phone);

  return { phone, pushName, text, remoteJid };
}
