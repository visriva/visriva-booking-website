/**
 * Shared Evolution API configuration for WhatsApp routes.
 * Credentials come from env vars; optional Firestore operator overrides.
 */

export interface EvolutionConfig {
  url: string;
  key: string;
  instance: string;
}

/** Only disable TLS verification when explicitly opted in (self-signed VPS certs). */
export function configureEvolutionTls(): void {
  if (process.env.EVOLUTION_INSECURE_TLS === "true") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
}

function normalizeUrl(url: string): string {
  let normalized = url.trim().replace(/\/$/, "");
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }
  return normalized;
}

function configFromEnv(): EvolutionConfig | null {
  const url = process.env.EVOLUTION_API_URL;
  const key = process.env.EVOLUTION_API_KEY;
  if (!url || !key) return null;

  return {
    url: normalizeUrl(url),
    key,
    instance: process.env.EVOLUTION_INSTANCE_NAME || "visriva-live",
  };
}

async function loadFirestoreOperatorOverrides(): Promise<Partial<EvolutionConfig>> {
  // Backup Evolution fields are used only for explicit failover in send-whatsapp — never override primary config.
  return {};
}

/** Optional backup Evolution VPS — for send failover only. */
export async function getBackupEvolutionConfig(): Promise<EvolutionConfig | null> {
  try {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const { getFirestore, doc, getDoc } = await import("firebase/firestore");

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "visriva-live-station",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const snap = await getDoc(doc(db, "config", "operator"));
    if (!snap.exists()) return null;

    const data = snap.data();
    const url = data.backupEvoApiUrl ? normalizeUrl(String(data.backupEvoApiUrl)) : null;
    const key = data.backupEvoApiKey ? String(data.backupEvoApiKey) : null;
    const instance = data.backupInstanceName ? String(data.backupInstanceName) : "visriva-live";
    if (!url || !key) return null;
    return { url, key, instance };
  } catch {
    return null;
  }
}

export async function getEvolutionConfig(): Promise<EvolutionConfig> {
  const base = configFromEnv();
  const overrides = await loadFirestoreOperatorOverrides();

  const url = overrides.url || base?.url;
  const key = overrides.key || base?.key;
  const instance = overrides.instance || base?.instance || "visriva-live";

  if (!url || !key) {
    throw new Error(
      "Evolution API is not configured. Set EVOLUTION_API_URL and EVOLUTION_API_KEY in your environment."
    );
  }

  return { url, key, instance };
}

export function getEvolutionHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: apiKey,
  };
}

export function getWebhookUrl(requestHost?: string | null): string {
  const explicit = process.env.WEBHOOK_BASE_URL?.replace(/\/$/, "");
  if (explicit) {
    return `${explicit}/api/whatsapp/webhook`;
  }

  // Custom domain (visriva.com) is unreachable from Railway — use stable Vercel alias in production
  if (process.env.VERCEL_ENV === "production") {
    return "https://visriva-booking-website-visriva.vercel.app/api/whatsapp/webhook";
  }

  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (!siteUrl && process.env.VERCEL_URL) {
    siteUrl = `https://${process.env.VERCEL_URL}`;
  }

  if (!siteUrl && requestHost) {
    const protocol =
      requestHost.includes("localhost") || requestHost.includes("127.0.0.1")
        ? "http"
        : "https";
    siteUrl = `${protocol}://${requestHost}`;
  }

  if (!siteUrl) {
    siteUrl = "https://visriva-booking-website-visriva.vercel.app";
  }

  return `${siteUrl.replace(/\/$/, "")}/api/whatsapp/webhook`;
}

export function getWebhookHeaders(): Record<string, string> | undefined {
  const bypass = process.env.VERCEL_PROTECTION_BYPASS;
  if (!bypass) return undefined;
  return { "x-vercel-protection-bypass": bypass };
}

export function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
