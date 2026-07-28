/**
 * Visriva Live Station - Automated WhatsApp Workflow & Notification Helpers
 * Primary Contact / Owner WhatsApp: 918884484828
 */

export const VISRIVA_WHATSAPP_NUMBER = "918884484828";

export function formatWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "") || VISRIVA_WHATSAPP_NUMBER;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildBookingLeadMessage(data: {
  clientName: string;
  clientPhone: string;
  venue: string;
  eventDate: string;
  eventType: string;
  reportingTime: string;
  endingTime: string;
  pax: number;
  services: string[];
  estimatedBudget: string;
  tier: string;
  leadId?: string;
}): string {
  return (
    `🚨 *NEW VISRIVA LIVE STATION BOOKING INQUIRY*\n\n` +
    `👤 *Client Name:* ${data.clientName}\n` +
    `📞 *Phone:* ${data.clientPhone}\n` +
    `📍 *Venue:* ${data.venue}\n` +
    `📅 *Event Date:* ${data.eventDate}\n` +
    `🎉 *Event Type:* ${data.eventType}\n` +
    `⏰ *Timings:* ${data.reportingTime} - ${data.endingTime}\n` +
    `👥 *Guest Count:* ${data.pax} Guests\n` +
    `✨ *Selected Stations:* ${data.services.join(", ")}\n` +
    `💰 *Estimated Total:* ${data.estimatedBudget} (${data.tier})\n` +
    (data.leadId ? `\n*Ref ID:* ${data.leadId}` : "")
  );
}

export function buildTokenPickupAlertMessage(
  guestName: string,
  tokenNum: string | number,
  itemType: string
): string {
  return (
    `✨ *VISRIVA LIVE STATION • PICKUP ALERT*\n\n` +
    `Hi *${guestName}*! 👋\n\n` +
    `Your custom *${itemType}* (Token *#${tokenNum}*) has been freshly pressed and is ready for pickup at the Visriva Live Counter! 🎁\n\n` +
    `Please show this message to our counter team to collect your souvenir. Thank you for celebrating with us!`
  );
}

export function buildGalleryShareMessage(
  clientName: string,
  eventCode: string,
  galleryUrl?: string
): string {
  const targetUrl = galleryUrl || `https://www.visriva.com/gallery?event=${encodeURIComponent(eventCode)}`;
  return (
    `📸 *YOUR VISRIVA EVENT PHOTO GALLERY IS READY!*\n\n` +
    `Dear *${clientName}*,\n\n` +
    `All digital portraits and high-res keepsake captures from your event are now live in your private gallery!\n\n` +
    `🔗 *Access Gallery:* ${targetUrl}\n` +
    `🔑 *Event PIN / Code:* ${eventCode}\n\n` +
    `Share this link with your guests to let them download original photos and order extra prints!`
  );
}

export function buildAssetReminderMessage(clientName: string, eventDate: string): string {
  return (
    `🎨 *VISRIVA LIVE STATION • ASSETS REMINDER*\n\n` +
    `Hi *${clientName}*,\n\n` +
    `Your event on *${eventDate}* is coming up soon! 🎉\n\n` +
    `Please upload your custom wedding monogram, high-res logo PNG, or design preference so our creative team can prepare your 8-sec print overlays.\n\n` +
    `Reply to this chat or upload at: https://www.visriva.com/frame-customizer`
  );
}
