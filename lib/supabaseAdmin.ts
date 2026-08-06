import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PHOTOBOOTH_PRINT_BUCKET } from "@/lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(supabaseUrl && serviceRoleKey);
}

let adminClient: SupabaseClient | null = null;

/** Server-only Supabase client (service role). Never import in client components. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured()) return null;
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

export { PHOTOBOOTH_PRINT_BUCKET };
