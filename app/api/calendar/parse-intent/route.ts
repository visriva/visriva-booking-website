import { NextResponse } from "next/server";
import { isOperationsApiAuthorized } from "@/lib/operationsApiAuth";
import { generateGeminiContent } from "@/lib/geminiClient";
import { parseCalendarIntent, normalizeGeminiIntent } from "@/lib/parseCalendarIntent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isOperationsApiAuthorized()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let text = "";
  try {
    const body = await req.json();
    text = String(body.text || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "Empty command" }, { status: 400 });
  }

  const ref = new Date();
  const local = parseCalendarIntent(text, ref);
  if (local) {
    return NextResponse.json({ intent: local, source: "rules" });
  }

  try {
    const today = ref.toISOString().split("T")[0];
    const prompt = `You parse Visriva Live Station operations calendar commands (India, IST).
Today is ${today}.

User wrote: """${text}"""

Return ONLY valid JSON (no markdown):
{
  "action": "create" or "delete",
  "status": "blocked" or "high_demand",
  "title": "short event name — infer from context (e.g. Missy Event, Sharma Wedding)",
  "description": "why the date is blocked / full reason",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "allDay": true or false,
  "startTime": "HH:mm" or null,
  "endTime": "HH:mm" or null
}

Rules:
- Default action is create/block unless user says unblock/delete/clear/open.
- Extract event name and reason from free text — never leave title generic if a name is given.
- "17th aug missy event" → title "Missy Event", startDate/endDate that August day, description explains it's an event blocking the date.
- Infer year: use ${ref.getFullYear()} unless date passed, then next year.
- Times only if mentioned.`;

    const { text: raw } = await generateGeminiContent({
      parts: [{ text: prompt }],
      responseMimeType: "application/json",
      temperature: 0.1,
    });

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const intent = normalizeGeminiIntent(parsed, ref);
    if (intent) {
      return NextResponse.json({ intent, source: "gemini" });
    }
  } catch {
    // fall through
  }

  return NextResponse.json(
    {
      error: "Could not understand that command",
      hint: 'Try: "17th aug missy event" or "block 25 dec 2pm-8pm Sharma wedding — corporate booth"',
    },
    { status: 422 }
  );
}
