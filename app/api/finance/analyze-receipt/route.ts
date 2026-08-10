import { NextResponse } from "next/server";
import { generateGeminiContent } from "@/lib/geminiClient";
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

  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    const base64 = buffer.toString("base64");

    const model = process.env.GEMINI_RECEIPT_MODEL || "gemini-flash-latest";
    const { text } = await generateGeminiContent({
      model,
      parts: [
        { text: PROMPT },
        { inlineData: { mimeType: mime, data: base64 } },
      ],
      responseMimeType: "application/json",
      temperature: 0.2,
    });

    const parsed = JSON.parse(text) as ReceiptAnalysis;

    if (!parsed.amount || parsed.amount <= 0) {
      return NextResponse.json(
        { error: "Could not detect amount — enter manually", analysis: parsed },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, analysis: parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    console.error("[analyze-receipt]", err);

    if (message.includes("not configured") || message.includes("UNAUTHENTICATED")) {
      return NextResponse.json(
        {
          error:
            "Gemini AI not configured — add a valid GEMINI_API_KEY in Vercel (https://aistudio.google.com/apikey) and redeploy.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
