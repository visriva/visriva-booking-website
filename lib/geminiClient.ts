import { GoogleGenAI } from "@google/genai";
import { JWT } from "google-auth-library";

export type GeminiContentPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export interface GeminiGenerateOptions {
  model?: string;
  parts: GeminiContentPart[];
  responseMimeType?: string;
  temperature?: number;
}

interface ServiceAccountCreds {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

const PLACEHOLDER_PATTERNS = /^\[SENSITIVE\]$|^your[_-]?api|^placeholder$/i;

function parsePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

/** Resolve Gemini API key from env — accepts both AIza (standard) and AQ. (auth) keys. */
export function resolveGeminiApiKey(): string | null {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const key = raw.trim();
    if (key.length < 10 || PLACEHOLDER_PATTERNS.test(key)) continue;
    return key;
  }
  return null;
}

/** Same credential sources as firebaseAdmin — used for Vertex AI fallback. */
export function resolveServiceAccount(): ServiceAccountCreds | null {
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonRaw) {
    try {
      const sa = JSON.parse(jsonRaw) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (sa.project_id && sa.client_email && sa.private_key) {
        return {
          projectId: sa.project_id,
          clientEmail: sa.client_email,
          privateKey: sa.private_key,
        };
      }
    } catch {
      /* fall through */
    }
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }
  return null;
}

function toVertexPart(part: GeminiContentPart) {
  if ("text" in part) return { text: part.text };
  return {
    inline_data: {
      mime_type: part.inlineData.mimeType,
      data: part.inlineData.data,
    },
  };
}

async function generateWithApiKey(apiKey: string, opts: GeminiGenerateOptions): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const model = opts.model || process.env.GEMINI_MODEL || "gemini-flash-latest";

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: opts.parts }],
    config: {
      temperature: opts.temperature ?? 0.2,
      ...(opts.responseMimeType ? { responseMimeType: opts.responseMimeType } : {}),
    },
  });

  return response.text?.trim() || "";
}

async function generateWithVertex(
  creds: ServiceAccountCreds,
  opts: GeminiGenerateOptions
): Promise<string> {
  const client = new JWT({
    email: creds.clientEmail,
    key: creds.privateKey,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("Failed to obtain Google access token");

  const model = opts.model || process.env.GEMINI_MODEL || "gemini-flash-latest";
  const locations = (process.env.GEMINI_VERTEX_LOCATION || "us-central1,asia-south1").split(",");
  let lastError = "Vertex AI unavailable";

  for (const loc of locations) {
    const location = loc.trim();
    if (!location) continue;

    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${creds.projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: opts.parts.map(toVertexPart) }],
        generationConfig: {
          temperature: opts.temperature ?? 0.2,
          ...(opts.responseMimeType ? { responseMimeType: opts.responseMimeType } : {}),
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    }

    lastError = (await res.text()).slice(0, 300);
    console.warn(`[gemini] Vertex ${location} failed:`, lastError);
  }

  throw new Error(lastError);
}

export type GeminiAuthMode = "apiKey" | "vertex";

/** Generate content via Gemini API key, falling back to Vertex AI + Firebase service account. */
export async function generateGeminiContent(
  opts: GeminiGenerateOptions
): Promise<{ text: string; via: GeminiAuthMode }> {
  const apiKey = resolveGeminiApiKey();
  if (apiKey) {
    try {
      const text = await generateWithApiKey(apiKey, opts);
      if (text) return { text, via: "apiKey" };
    } catch (err) {
      console.warn("[gemini] API key path failed, trying Vertex:", err);
    }
  }

  const creds = resolveServiceAccount();
  if (creds) {
    const text = await generateWithVertex(creds, opts);
    if (text) return { text, via: "vertex" };
  }

  throw new Error(
    "Gemini not configured — set a valid GEMINI_API_KEY on Vercel (https://aistudio.google.com/apikey) or ensure Firebase admin credentials are set for Vertex fallback."
  );
}
