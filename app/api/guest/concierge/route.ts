import { NextResponse } from "next/server";
import { getEventConfig, buildConciergeKnowledge } from "@/lib/guestExperience";
import { generateGeminiContent } from "@/lib/geminiClient";

export const runtime = "nodejs";

async function replyViaOpenRouter(system: string, message: string): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) return null;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://www.visriva.com",
      "X-Title": "Visriva Guest Concierge",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
      temperature: 0.4,
      max_tokens: 350,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

function localFallback(eventId: string, message: string): string {
  const event = getEventConfig(eventId);
  const q = message.toLowerCase();
  if (q.includes("wifi") || q.includes("wi-fi") || q.includes("password")) {
    return `WiFi network is **${event.wifiSsid}** — password **${event.wifiPassword}**.`;
  }
  if (q.includes("park")) return event.parkingNotes;
  if (q.includes("cake")) {
    const cake = event.itinerary.find((i) => i.title.toLowerCase().includes("cake"));
    return cake
      ? `Cake cutting is scheduled ${cake.startTime}–${cake.endTime} at ${cake.location || "Main Stage"}.`
      : "Cake timing is on the live itinerary — scroll up in the portal.";
  }
  if (q.includes("photo") || q.includes("booth")) {
    return "The Visriva Photo Booth bay stays open through the evening for instant prints — see the east side of the venue map.";
  }
  if (q.includes("dinner")) {
    const dinner = event.itinerary.find((i) => i.title.toLowerCase().includes("dinner"));
    return dinner
      ? `Dinner service is ${dinner.startTime}–${dinner.endTime} in ${dinner.location || "the banquet hall"}.`
      : "Dinner timing is on your live itinerary.";
  }
  return "I can help with WiFi, parking, photo booth, dinner, and cake timings. Try asking one of those — or check the live itinerary above.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const eventId = String(body?.eventId || "demo");
    const message = String(body?.message || "").trim();
    const guestName = String(body?.guestName || "").trim();
    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const event = getEventConfig(eventId);
    const system =
      buildConciergeKnowledge(event) +
      (guestName ? `\nThe guest you are speaking with is named ${guestName}.` : "") +
      "\nReply in 1–3 short sentences. No markdown headings.";

    const openRouter = await replyViaOpenRouter(system, message);
    if (openRouter) {
      return NextResponse.json({ reply: openRouter, provider: "openrouter" });
    }

    try {
      const { text } = await generateGeminiContent({
        parts: [{ text: `${system}\n\nGuest question: ${message}` }],
        temperature: 0.4,
      });
      if (text?.trim()) {
        return NextResponse.json({ reply: text.trim(), provider: "gemini" });
      }
    } catch {
      /* fall through */
    }

    return NextResponse.json({ reply: localFallback(eventId, message), provider: "local" });
  } catch {
    return NextResponse.json({ error: "Concierge unavailable" }, { status: 500 });
  }
}
