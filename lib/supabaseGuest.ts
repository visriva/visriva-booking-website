import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export const GUEST_PHOTO_BUCKET = "event_photos";

export function isSupabaseGuestConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

/** Browser Supabase client for guest portal (photos, announcements, agenda, guests). */
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

/** Matches public.guests */
export interface GuestRow {
  id: string;
  full_name: string;
  table_number: string | null;
  seat_number: string | null;
  access_code: string | null;
  created_at: string;
}

/** Matches public.agenda_items */
export interface AgendaItemRow {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location_name: string | null;
  created_at: string;
}

/** Matches public.photos */
export interface PhotoRow {
  id: string;
  guest_id: string | null;
  guest_name: string | null;
  storage_path: string;
  public_url: string;
  is_approved: boolean;
  created_at: string;
}

/** Matches public.announcements */
export interface AnnouncementRow {
  id: string;
  message: string;
  is_active: boolean;
  created_at: string;
}
