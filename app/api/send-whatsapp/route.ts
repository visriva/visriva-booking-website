import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, phone, token, galleryUrl, templateName, templateLanguage, isMarketing, ttlSeconds } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    // Clean phone number (must include country code e.g. 918884484828)
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone; // Default to India country code
    }

    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "2176925779756822";
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

    // ─── 1. META OFFICIAL CLOUD & MARKETING MESSAGES API DISPATCH (v20.0 / v25.0) ──
    if (ACCESS_TOKEN) {
      // Use Meta Marketing Messages API endpoint (/marketing_messages) for marketing traffic
      const endpoint = isMarketing ? "marketing_messages" : "messages";
      const metaUrl = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/${endpoint}`;

      const payload = templateName
        ? {
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "template",
            template: {
              name: templateName,
              language: { code: templateLanguage || "en_US" },
            },
            ...(ttlSeconds ? { ttl: { duration: ttlSeconds } } : {}),
          }
        : {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "text",
            text: {
              preview_url: true,
              body: `✨ *Visriva Live Station* ✨\n\nHello ${name ? name.trim() : "Valued Guest"}! 👋\n\nYour live event souvenir photo is ready!\n\n🎫 *Token Number:* #${token || "001"}\n${galleryUrl ? `📸 *Digital Gallery:* ${galleryUrl}\n` : ""}\nThank you for celebrating with us! 📸✨\n_Visriva Live Station — Luxury Memories Instant Printed_`,
            },
          };

      const metaRes = await fetch(metaUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!metaRes.ok) {
        const errText = await metaRes.text();
        console.error(`Meta ${endpoint} Error:`, errText);
        return NextResponse.json(
          { error: `Meta ${endpoint} dispatch failed`, details: errText },
          { status: metaRes.status }
        );
      }

      const metaData = await metaRes.json();
      return NextResponse.json({
        success: true,
        provider: isMarketing ? "meta_marketing_messages_api" : "meta_cloud_api",
        endpoint: `/v20.0/${PHONE_NUMBER_ID}/${endpoint}`,
        data: metaData,
      });
    }

    // ─── 2. EVOLUTION API / FALLBACK DISPATCH ───────────────────────────────
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "https://api.visriva.com";
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "VisrivaSecretKey2026_SecureKey";
    const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || "visriva-live";

    const guestName = name ? name.trim() : "Valued Guest";
    const message = `✨ *Visriva Live Station* ✨\n\nHello ${guestName}! 👋\n\nYour live event souvenir photo is ready!\n\n🎫 *Token Number:* #${token || "001"}\n${galleryUrl ? `📸 *Digital Gallery:* ${galleryUrl}\n` : ""}\nThank you for celebrating with us! 📸✨\n_Visriva Live Station — Luxury Memories Instant Printed_`;

    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: cleanPhone,
          options: {
            delay: 1200,
            presence: "composing",
          },
          textMessage: {
            text: message,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Evolution API Error:", errText);
      return NextResponse.json(
        { error: "Failed to dispatch WhatsApp message via Evolution API." },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, provider: "evolution_api", data });
  } catch (error: any) {
    console.error("Send WhatsApp Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
