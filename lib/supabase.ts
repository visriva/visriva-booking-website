import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

let browserClient: SupabaseClient | null = null;

/** Browser-safe Supabase client (anon key). Used by /webprinter realtime queue. */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (typeof window === "undefined") return null;
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return browserClient;
}

export const PHOTOBOOTH_PRINT_BUCKET = "photobooth-prints";

export interface SupabasePrintJobRow {
  id: string;
  image_url: string;
  storage_path?: string | null;
  status: "pending" | "printing" | "printed" | "failed";
  source?: string | null;
  capture_id?: string | null;
  created_at?: string;
  printed_at?: string | null;
  error?: string | null;
}
