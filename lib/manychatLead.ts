import type { BookingLead } from "@/lib/firebase";

export interface ManyChatCustomField {
  name?: string;
  id?: number;
  value?: string | number | boolean | null;
}

/** Payload shapes from ManyChat External Request or account webhooks. */
export type ManyChatWebhookPayload = Record<string, unknown>;

const KEYWORD_EVENT_TYPES: Record<string, string> = {
  EVENT: "Instagram Inquiry",
  PLANNER: "Planner Partnership",
  PRICE: "Pricing Inquiry",
  DATE: "Date Availability",
  CORPORATE: "Corporate Event",
};

function str(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  return s || undefined;
}

function num(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function pickSubscriberRoot(body: ManyChatWebhookPayload): ManyChatWebhookPayload {
  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    return body.data as ManyChatWebhookPayload;
  }
  if (body.subscriber && typeof body.subscriber === "object") {
    return body.subscriber as ManyChatWebhookPayload;
  }
  return body;
}

function parseCustomFields(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw) return out;

  if (Array.isArray(raw)) {
    for (const field of raw as ManyChatCustomField[]) {
      const name = str(field?.name);
      const value = str(field?.value);
      if (name && value) out[name.toLowerCase()] = value;
    }
    return out;
  }

  if (typeof raw === "object") {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      const v = str(value);
      if (v) out[key.toLowerCase()] = v;
    }
  }

  return out;
}

function inferKeyword(text: string | undefined, explicit?: string): string | undefined {
  const fromExplicit = explicit?.toUpperCase();
  if (fromExplicit && KEYWORD_EVENT_TYPES[fromExplicit]) return fromExplicit;

  if (!text) return undefined;
  const upper = text.toUpperCase();
  for (const key of Object.keys(KEYWORD_EVENT_TYPES)) {
    if (upper.includes(key)) return key;
  }
  return undefined;
}

function buildLeadNotes(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join("\n");
}

export interface ParsedManyChatLead {
  manychatSubscriberId: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  instagramUsername?: string;
  profilePicUrl?: string;
  manychatLiveChatUrl?: string;
  leadKeyword?: string;
  leadNotes?: string;
  eventDate?: string;
  venue?: string;
  eventType?: string;
  pax?: number;
  lastInputText?: string;
  tags?: string[];
}

export function parseManyChatPayload(body: ManyChatWebhookPayload): ParsedManyChatLead | null {
  const root = pickSubscriberRoot(body);
  const custom = parseCustomFields(root.custom_fields ?? body.custom_fields);

  const subscriberId =
    str(root.subscriber_id) ||
    str(root.id) ||
    str(body.subscriber_id) ||
    str(body.id);

  if (!subscriberId) return null;

  const firstName = str(root.first_name) || str(body.first_name);
  const lastName = str(root.last_name) || str(body.last_name);
  const fullName =
    str(root.full_name) ||
    str(root.name) ||
    str(body.full_name) ||
    str(body.name) ||
    [firstName, lastName].filter(Boolean).join(" ");

  const lastInput =
    str(root.last_input_text) ||
    str(body.last_input_text) ||
    str(body.message) ||
    str(body.text);

  const keyword =
    inferKeyword(
      lastInput,
      str(body.keyword) ||
        str(body.trigger) ||
        str(body.tag) ||
        custom.keyword ||
        custom.trigger
    ) || undefined;

  const igUsername =
    str(root.ig_username) ||
    str(body.ig_username) ||
    custom.ig_username;

  const eventDate =
    custom.event_date ||
    custom.date ||
    str(body.event_date) ||
    str(body.eventDate);

  const venue =
    custom.venue ||
    custom.city ||
    str(body.venue) ||
    str(body.city);

  const pax =
    num(custom.pax) ||
    num(custom.guest_count) ||
    num(body.pax) ||
    num(body.guest_count);

  const eventType =
    custom.event_type ||
    str(body.event_type) ||
    (keyword ? KEYWORD_EVENT_TYPES[keyword] : undefined) ||
    "Instagram DM";

  const tagsRaw = body.tags ?? root.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.map((t) => str(t)).filter(Boolean) as string[]
    : undefined;

  const leadNotes = buildLeadNotes([
    lastInput ? `Last message: ${lastInput}` : undefined,
    keyword ? `Keyword: ${keyword}` : undefined,
    tags?.length ? `Tags: ${tags.join(", ")}` : undefined,
    Object.keys(custom).length
      ? `Fields: ${Object.entries(custom)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")}`
      : undefined,
  ]);

  return {
    manychatSubscriberId: subscriberId,
    clientName: fullName || (igUsername ? `@${igUsername.replace(/^@/, "")}` : "Instagram Lead"),
    clientPhone: str(root.phone) || str(root.optin_phone) || str(body.phone) || custom.phone,
    clientEmail: str(root.email) || str(root.optin_email) || str(body.email) || custom.email,
    instagramUsername: igUsername?.replace(/^@/, ""),
    profilePicUrl: str(root.profile_pic) || str(body.profile_pic),
    manychatLiveChatUrl: str(root.live_chat_url) || str(body.live_chat_url),
    leadKeyword: keyword,
    leadNotes: leadNotes || undefined,
    eventDate,
    venue,
    eventType,
    pax,
    lastInputText: lastInput,
    tags,
  };
}

export function toBookingLead(parsed: ParsedManyChatLead): BookingLead {
  return {
    clientName: parsed.clientName,
    clientPhone: parsed.clientPhone,
    clientEmail: parsed.clientEmail,
    eventDate: parsed.eventDate || "TBD",
    venue: parsed.venue || "TBD",
    eventType: parsed.eventType || "Instagram DM",
    pax: parsed.pax && parsed.pax > 0 ? parsed.pax : 0,
    services: [],
    estimatedBudget: "TBD",
    tier: "Instagram",
    status: "NEW_LEAD",
    source: "instagram_manychat",
    instagramUsername: parsed.instagramUsername,
    manychatSubscriberId: parsed.manychatSubscriberId,
    leadKeyword: parsed.leadKeyword,
    leadNotes: parsed.leadNotes,
    manychatLiveChatUrl: parsed.manychatLiveChatUrl,
    profilePicUrl: parsed.profilePicUrl,
  };
}

export function getManyChatWebhookSecret(): string | null {
  return process.env.MANYCHAT_WEBHOOK_SECRET?.trim() || null;
}

export function verifyManyChatWebhookSecret(req: Request): boolean {
  const secret = getManyChatWebhookSecret();
  if (!secret) {
    console.warn("[manychat] MANYCHAT_WEBHOOK_SECRET not set — webhook rejected");
    return false;
  }

  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret && querySecret === secret) return true;

  const headerSecret =
    req.headers.get("x-manychat-secret") ||
    req.headers.get("x-visriva-manychat-secret");
  if (headerSecret && headerSecret === secret) return true;

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  return false;
}
