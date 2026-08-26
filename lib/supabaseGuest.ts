import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function isSupabaseGuestConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

/** Browser Supabase client for guest portal (photos, announcements, guestbook). */
export function getSupabaseGuestBrowser(): SupabaseClient | null {
  if (!isSupabaseGuestConfigured()) return null;
  if (typeof window === "undefined") return null;
  if (browserClient) return browserClient;
  browserClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
  return browserClient;
}

export function getSupabaseGuestServer(): SupabaseClient | null {
  if (!isSupabaseGuestConfigured()) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

export interface GuestPhotoRow {
  id: string;
  event_id: string;
  url: string;
  guest_name: string | null;
  created_at: string;
}

export interface GuestAnnouncementRow {
  id: string;
  event_id: string;
  message: string;
  created_at: string;
}

export interface GuestGuestbookRow {
  id: string;
  event_id: string;
  name: string;
  message: string;
  network_opt_in: boolean;
  created_at: string;
}
