import { NextResponse } from "next/server";
import { isOperationsApiAuthorized } from "@/lib/operationsApiAuth";
import type { ReceiptAnalysis } from "@/lib/receiptAnalysis";

export const runtime = "nodejs";

const PROMPT = `You are a finance assistant for Visriva Live Station (event company, India).
Analyze this receipt, invoice, bank transfer screenshot, or UPI payment image.

Return ONLY valid JSON (no markdown) with this shape:
{
  "type": "income" or "expense",
  "amount": number (INR, no commas),
  "currency": "INR",
  "category": one of: Event Booking, Deposit, Final Payment, Add-on / Reorder, Planner Referral, Other Income, Crew / Labour, Travel & Fuel, Print Supplies, Equipment, Marketing, Rent / Storage, Software & Subscriptions, Maintenance, Miscellaneous,
  "description": "what was purchased or received",
  "party": "paid to or received from",
  "bank": "bank name if visible (HDFC, ICICI, SBI, etc.) or UPI app",
  "paymentMethod": "UPI, NEFT, Card, Cash, etc.",
  "date": "YYYY-MM-DD or best guess",
  "reason": "business purpose in one sentence",
  "confidence": "high" | "medium" | "low",
  "rawNotes": "any extra details"
}

If unclear, use best estimate and set confidence to low. Amount must be a number.`;

export async function POST(req: Request) {
  if (!isOperationsApiAuthorized()) {
    return NextResponse.json({ error: "Unauthorized — log in to Operations Hub" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("AQ.")) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured on server" }, { status: 503 });
  }

  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    const base64 = buffer.toString("base64");

    const model = process.env.GEMINI_RECEIPT_MODEL || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mime, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[analyze-receipt]", errText.slice(0, 300));
      return NextResponse.json({ error: "Vision analysis failed" }, { status: 502 });
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(text) as ReceiptAnalysis;

    if (!parsed.amount || parsed.amount <= 0) {
      return NextResponse.json({ error: "Could not detect amount — enter manually", analysis: parsed }, { status: 422 });
    }

    return NextResponse.json({ success: true, analysis: parsed });
  } catch (err: unknown) {
    console.error("[analyze-receipt]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
