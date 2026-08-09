import type { BookingLead } from "@/lib/firebase";
import type { ParsedManyChatLead } from "@/lib/manychatLead";
import { sendMetaText } from "@/lib/metaWhatsApp";

const OWNER_PHONE = "918884484828";

function formatInstagramLeadAlert(
  lead: BookingLead,
  leadId: string,
  parsed: ParsedManyChatLead
): string {
  const ig = lead.instagramUsername ? `@${lead.instagramUsername}` : "—";
  return (
    `📸 *NEW INSTAGRAM LEAD (ManyChat)*\n\n` +
    `👤 ${lead.clientName || "—"}\n` +
    `📷 ${ig}\n` +
    `🏷️ ${lead.leadKeyword || "DM"}\n` +
    `📅 ${lead.eventDate || "TBD"}\n` +
    `📍 ${lead.venue || "TBD"}\n` +
    `📱 ${lead.clientPhone || "—"}\n` +
    `💬 ${parsed.lastInputText || "—"}\n` +
    `🆔 Ref: ${leadId}\n\n` +
    (lead.manychatLiveChatUrl ? `Open chat: ${lead.manychatLiveChatUrl}` : "Reply in ManyChat inbox")
  );
}

export async function notifyInstagramLead(
  lead: BookingLead,
  leadId: string,
  parsed: ParsedManyChatLead,
  options?: { isNew?: boolean }
): Promise<{ ownerNotified: boolean }> {
  if (options?.isNew === false) {
    return { ownerNotified: false };
  }

  const owner = await sendMetaText(
    OWNER_PHONE,
    formatInstagramLeadAlert(lead, leadId, parsed),
    "[ManyChat-IG]"
  );
  return { ownerNotified: owner.ok };
}
