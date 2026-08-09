import type { BookingLead } from "@/lib/firebase";
import { sendMetaText } from "@/lib/metaWhatsApp";

const OWNER_PHONE = "918884484828";

function cleanPhone(phone: string): string {
  let p = phone.replace(/\D/g, "");
  if (p.length === 10) p = `91${p}`;
  return p;
}

function formatOwnerAlert(lead: BookingLead, leadId: string): string {
  return (
    `🚨 *NEW VISRIVA BOOKING INQUIRY*\n\n` +
    `👤 ${lead.clientName || "—"}\n` +
    `📞 ${lead.clientPhone || "—"}\n` +
    `📍 ${lead.venue}\n` +
    `📅 ${lead.eventDate}\n` +
    `🎉 ${lead.eventType}\n` +
    `⏰ ${lead.reportingTime || "—"} – ${lead.endingTime || "—"}\n` +
    `👥 ${lead.pax} guests\n` +
    `✨ ${(lead.services || []).join(", ")}\n` +
    `💰 ${lead.estimatedBudget} (${lead.tier})\n` +
    `🆔 Ref: ${leadId}`
  );
}

function formatClientConfirmation(lead: BookingLead, leadId: string): string {
  return (
    `✨ *Visriva Live Station* — Inquiry Received!\n\n` +
    `Hi ${lead.clientName || "there"}! Thank you for your booking inquiry.\n\n` +
    `📅 *Date:* ${lead.eventDate}\n` +
    `📍 *Venue:* ${lead.venue}\n` +
    `💰 *Estimate:* ${lead.estimatedBudget}\n` +
    `🆔 *Reference:* ${leadId}\n\n` +
    `Our team will confirm availability shortly. Save this reference ID.\n\n` +
    `📞 +91 88844 84828`
  );
}

export async function notifyBookingLead(
  lead: BookingLead,
  leadId: string
): Promise<{ ownerNotified: boolean; clientNotified: boolean }> {
  const owner = await sendMetaText(OWNER_PHONE, formatOwnerAlert(lead, leadId), "[Booking]");
  let clientNotified = false;
  if (lead.clientPhone) {
    const client = await sendMetaText(
      cleanPhone(lead.clientPhone),
      formatClientConfirmation(lead, leadId),
      "[Booking-Client]"
    );
    clientNotified = client.ok;
  }
  return { ownerNotified: owner.ok, clientNotified };
}
