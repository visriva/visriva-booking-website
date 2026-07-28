import { NextResponse } from "next/server";
import { DEFAULT_AI_WHATSAPP_CONFIG } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const { leadName, eventType, guestCount, location, eventDate, selectedServices, notes, customSystemPrompt } = await req.json();

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "AQ.Ab8RN6L7Ff_7vRzv290Gzm2wjSTyEen4e1uBb-ooo0hQe-L0fg";

    const basePrompt = customSystemPrompt || DEFAULT_AI_WHATSAPP_CONFIG.systemPrompt;

    const prompt = `
${basePrompt}

Lead Details:
- Customer Name: ${leadName || "Valued Client"}
- Event Type: ${eventType || "Special Celebration"}
- Event Date: ${eventDate || "Upcoming Event"}
- Location: ${location || "Bengaluru / Pune"}
- Guest Count: ${guestCount || "TBD"}
- Selected Stations: ${Array.isArray(selectedServices) ? selectedServices.join(", ") : selectedServices || "Live Stations"}
- Special Notes: ${notes || "None"}

Generate 3 distinct WhatsApp message options formatted with WhatsApp bold (*text*) and emojis:
1. "vipQuote": Warm welcome, customized station setup pitch, pricing overview, polite call to action.
2. "confirmation": Instant booking confirmation, venue logistics check, crew arrival timeline, QR gallery setup detail.
3. "followUp": Gentle follow-up message offering complimentary custom frame branding & date lock-in.

Return ONLY raw JSON with this exact schema:
{
  "vipQuote": "Full WhatsApp message text string",
  "confirmation": "Full WhatsApp message text string",
  "followUp": "Full WhatsApp message text string"
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: "Gemini API error", details: errText }, { status: response.status });
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleanJsonText = candidateText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJsonText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate AI WhatsApp messages" }, { status: 500 });
  }
}
