import { NextResponse } from "next/server";
import { generateGeminiContent, resolveGeminiApiKey, resolveServiceAccount } from "@/lib/geminiClient";
import { isOperationsApiAuthorized } from "@/lib/operationsApiAuth";

export const runtime = "nodejs";

export async function GET() {
  if (!isOperationsApiAuthorized()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = resolveGeminiApiKey();
  const serviceAccount = resolveServiceAccount();

  let apiKeyWorks = false;
  let apiKeyError = "";
  if (apiKey) {
    try {
      const { text } = await generateGeminiContent({
        model: "gemini-flash-latest",
        parts: [{ text: "Reply with exactly: OK" }],
        temperature: 0,
      });
      apiKeyWorks = text.includes("OK");
    } catch (err) {
      apiKeyError = err instanceof Error ? err.message.slice(0, 200) : "API key test failed";
    }
  }

  return NextResponse.json({
    apiKeyPresent: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.slice(0, 6) : null,
    apiKeyWorks,
    apiKeyError: apiKeyError || null,
    vertexFallbackAvailable: !!serviceAccount,
    ready: apiKeyWorks,
    setupUrl: "https://aistudio.google.com/apikey",
    vertexEnableUrl:
      "https://console.developers.google.com/apis/api/aiplatform.googleapis.com/overview?project=visriva-live-station",
    hint: apiKeyWorks
      ? "Gemini is ready for AI receipt scan."
      : apiKey
        ? "GEMINI_API_KEY is set but invalid or expired — create a new key at AI Studio and update Vercel."
        : serviceAccount
          ? "No valid API key — enable Vertex AI API on your Firebase project (link above) or add GEMINI_API_KEY from AI Studio."
          : "Add GEMINI_API_KEY on Vercel (https://aistudio.google.com/apikey).",
  });
}
