/**
 * Supabase Edge Function: moderate-photo
 *
 * Triggered by a Database Webhook on INSERT into public.photos.
 * Checks the image URL with Sightengine; if safe, sets is_approved = true
 * using the service role key.
 *
 * Secrets (Dashboard → Edge Functions → Secrets):
 *   SIGHTENGINE_API_USER
 *   SIGHTENGINE_API_SECRET
 *   SUPABASE_URL          (auto-injected on hosted Supabase)
 *   SUPABASE_SERVICE_ROLE_KEY (auto-injected on hosted Supabase)
 *
 * Deploy:
 *   supabase functions deploy moderate-photo --no-verify-jwt
 *   (webhook calls often omit a user JWT; protect via webhook secret header if needed)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const NSFW_THRESHOLD = Number(Deno.env.get("MODERATION_THRESHOLD") || "0.8");

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: {
    id?: string;
    public_url?: string;
    is_approved?: boolean;
  };
  /** Some webhook formats nest under `payload` */
  payload?: WebhookPayload;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as WebhookPayload;
    const record = body.record || body.payload?.record;
    const photoId = record?.id;
    const publicUrl = record?.public_url;

    if (!photoId || !publicUrl) {
      console.error("Missing photo id or public_url", body);
      return json({ error: "Missing photo id or public_url" }, 400);
    }

    // Already approved (manual) — nothing to do
    if (record?.is_approved === true) {
      return json({ ok: true, skipped: "already_approved" });
    }

    const apiUser = Deno.env.get("SIGHTENGINE_API_USER");
    const apiSecret = Deno.env.get("SIGHTENGINE_API_SECRET");
    if (!apiUser || !apiSecret) {
      console.error("Sightengine credentials missing");
      return json({ error: "Sightengine not configured" }, 500);
    }

    const safe = await checkSightengine(publicUrl, apiUser, apiSecret);
    console.log("moderation", { photoId, safe });

    if (!safe) {
      return json({ ok: true, approved: false, reason: "failed_moderation" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return json({ error: "Supabase service role not configured" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await admin
      .from("photos")
      .update({ is_approved: true })
      .eq("id", photoId);

    if (error) {
      console.error("approve update failed", error);
      return json({ error: error.message }, 500);
    }

    return json({ ok: true, approved: true, id: photoId });
  } catch (err) {
    console.error("moderate-photo error", err);
    return json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      500
    );
  }
});

async function checkSightengine(
  imageUrl: string,
  apiUser: string,
  apiSecret: string
): Promise<boolean> {
  const endpoint = new URL("https://api.sightengine.com/1.0/check.json");
  endpoint.searchParams.set("url", imageUrl);
  endpoint.searchParams.set("models", "nudity-2.1,gore-2.0,weapon");
  endpoint.searchParams.set("api_user", apiUser);
  endpoint.searchParams.set("api_secret", apiSecret);

  const res = await fetch(endpoint.toString(), { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    console.error("Sightengine HTTP error", res.status, text.slice(0, 400));
    // Fail closed — do not auto-approve on API failure
    return false;
  }

  const data = await res.json();
  if (data?.status && data.status !== "success") {
    console.error("Sightengine status", data);
    return false;
  }

  return isImageSafe(data, NSFW_THRESHOLD);
}

/** Return true when all risk scores are below the threshold. */
function isImageSafe(data: Record<string, unknown>, threshold: number): boolean {
  const scores: number[] = [];

  const nudity = data.nudity as Record<string, number> | undefined;
  if (nudity) {
    // Higher = more explicit; "none" / "safe" are inverted — ignore those.
    for (const [key, val] of Object.entries(nudity)) {
      if (typeof val !== "number") continue;
      const k = key.toLowerCase();
      if (k === "none" || k === "safe" || k.includes("context")) continue;
      scores.push(val);
    }
  }

  const gore = data.gore as Record<string, number> | number | undefined;
  if (typeof gore === "number") scores.push(gore);
  else if (gore && typeof gore.prob === "number") scores.push(gore.prob);
  else if (gore) {
    for (const val of Object.values(gore)) {
      if (typeof val === "number") scores.push(val);
    }
  }

  const weapon = data.weapon as Record<string, number> | number | undefined;
  if (typeof weapon === "number") scores.push(weapon);
  else if (weapon) {
    for (const val of Object.values(weapon)) {
      if (typeof val === "number") scores.push(val);
    }
  }

  if (scores.length === 0) {
    // Unexpected empty payload — fail closed
    return false;
  }

  const maxRisk = Math.max(...scores);
  return maxRisk < threshold;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
