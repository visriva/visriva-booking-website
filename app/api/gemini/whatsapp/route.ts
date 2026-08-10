import { NextResponse } from "next/server";
import { generateGeminiContent } from "@/lib/geminiClient";
import { DEFAULT_AI_WHATSAPP_CONFIG } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const { leadName, eventType, guestCount, location, eventDate, selectedServices, notes, customSystemPrompt } = await req.json();

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

    const { text: candidateText } = await generateGeminiContent({
      model: "gemini-1.5-flash",
      parts: [{ text: prompt }],
    });

    const cleanJsonText = candidateText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJsonText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate AI WhatsApp messages" }, { status: 500 });
  }
}
