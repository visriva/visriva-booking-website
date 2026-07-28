import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, phone, token, galleryUrl } = await req.json();

    if (!phone || !token) {
      return NextResponse.json(
        { error: "Phone number and token number are required." },
        { status: 400 }
      );
    }

    // Clean phone number (must include country code e.g. 918884484828)
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone; // Default to India country code
    }

    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "https://api.visriva.com";
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "VisrivaSecretKey2026_SecureKey";
    const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || "visriva-live";

    // Formulate luxury guest message
    const guestName = name ? name.trim() : "Valued Guest";
    const message = `✨ *Visriva Live Station* ✨\n\nHello ${guestName}! 👋\n\nYour live event souvenir photo is ready!\n\n🎫 *Token Number:* #${token}\n${galleryUrl ? `📸 *Digital Gallery:* ${galleryUrl}\n` : ""}\nThank you for celebrating with us! 📸✨\n_Visriva Live Station — Luxury Memories Instant Printed_`;

    // Dispatch request to self-hosted Evolution API
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
            delay: 1200, // 1.2s delay to appear natural
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
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Send WhatsApp Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
