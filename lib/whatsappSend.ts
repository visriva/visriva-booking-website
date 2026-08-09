import { sendMetaText } from "@/lib/metaWhatsApp";

/** Send WhatsApp text via Meta Cloud API only. */
export async function sendWhatsAppText(
  phone: string,
  text: string,
  logPrefix = "[WhatsApp]"
) {
  const meta = await sendMetaText(phone, text, logPrefix);
  return {
    ...meta,
    provider: meta.ok ? ("meta" as const) : ("none" as const),
  };
}
