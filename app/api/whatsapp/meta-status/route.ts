import { NextResponse } from "next/server";
import { getMetaConfig } from "@/lib/metaWhatsApp";

export const runtime = "nodejs";

export async function GET() {
  const meta = getMetaConfig();
  if (!meta) {
    return NextResponse.json({
      configured: false,
      error: "Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN on Vercel",
    });
  }

  const webhookUrl =
    process.env.WEBHOOK_BASE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_ENV === "production"
      ? "https://visriva-booking-website-visriva.vercel.app"
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://www.visriva.com");

  let tokenValid = false;
  let tokenError: string | undefined;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${meta.phoneNumberId}?fields=display_phone_number,verified_name`,
      {
        headers: { Authorization: `Bearer ${meta.accessToken}` },
        signal: AbortSignal.timeout(8000),
      }
    );
    const data = await res.json();
    tokenValid = res.ok;
    if (!res.ok) tokenError = JSON.stringify(data).slice(0, 200);
  } catch (err: unknown) {
    tokenError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    configured: true,
    tokenValid,
    tokenError,
    phoneNumberId: meta.phoneNumberId,
    webhookUrl: `${webhookUrl}/api/whatsapp/webhook`,
    verifyToken: meta.verifyToken,
    instructions:
      "In Meta Developer Console → WhatsApp → Configuration, set Callback URL and Verify Token, then subscribe to 'messages'.",
  });
}
