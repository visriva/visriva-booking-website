export interface ParsedInboundMessage {
  phone: string;
  pushName: string;
  text: string;
  remoteJid: string;
}

function parseOneMessage(data: Record<string, unknown>): ParsedInboundMessage | null {
  const key = (data.key as Record<string, unknown>) || {};
  const remoteJid = String(key.remoteJid || data.remoteJid || data.sender || "").trim();
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

  const phone = remoteJid
    .replace(/@s\.whatsapp\.net|@g\.us|@lid/g, "")
    .replace(/[^0-9]/g, "");
  if (!phone) return null;

  const pushName = String(data.pushName || data.notifyName || phone);

  return { phone, pushName, text, remoteJid };
}

/** Parse Evolution API MESSAGES_UPSERT webhook payload. Returns null if event should be ignored. */
export function parseEvolutionInbound(body: unknown): ParsedInboundMessage | null {
  if (!body || typeof body !== "object") return null;

  const root = body as Record<string, unknown>;
  const event = String(root.event || root.type || "").toUpperCase().replace(/\./g, "_");

  if (event && event.includes("CONNECTION") && !event.includes("MESSAGE")) {
    return null;
  }

  if (event && !event.includes("MESSAGE") && event !== "") {
    return null;
  }

  const data = root.data;

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === "object") {
        const parsed = parseOneMessage(item as Record<string, unknown>);
        if (parsed) return parsed;
      }
    }
    return null;
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.messages)) {
      for (const item of record.messages) {
        if (item && typeof item === "object") {
          const parsed = parseOneMessage(item as Record<string, unknown>);
          if (parsed) return parsed;
        }
      }
      return null;
    }
    return parseOneMessage(record);
  }

  return parseOneMessage(root);
}

/** Parse all messages from a webhook batch (for future multi-message support). */
export function parseEvolutionInboundAll(body: unknown): ParsedInboundMessage[] {
  const single = parseEvolutionInbound(body);
  return single ? [single] : [];
}
