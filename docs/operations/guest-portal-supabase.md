# Guest Experience Portal — Supabase setup

Powers live announcements, photo wall uploads, and guestbook for `/guest/[eventId]`.

Without these tables the portal still works in **demo fallback** mode (rotating sample announcements + Unsplash photos).

## 1. Env vars (Vercel + `.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# Optional AI (else Gemini, else local keyword fallback)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
```

## 2. SQL (Supabase SQL editor)

```sql
-- Announcements (enable Realtime on this table in Dashboard → Database → Replication)
create table if not exists public.guest_announcements (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists guest_announcements_event_idx on public.guest_announcements (event_id, created_at desc);

create table if not exists public.guest_photos (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  url text not null,
  guest_name text,
  created_at timestamptz not null default now()
);
create index if not exists guest_photos_event_idx on public.guest_photos (event_id, created_at desc);

create table if not exists public.guest_guestbook (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  name text not null,
  message text not null,
  network_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists guest_guestbook_event_idx on public.guest_guestbook (event_id, created_at desc);

alter table public.guest_announcements enable row level security;
alter table public.guest_photos enable row level security;
alter table public.guest_guestbook enable row level security;

-- Public event-day reads/writes (tighten later with event tokens if needed)
create policy "announcements_read" on public.guest_announcements for select using (true);
create policy "announcements_insert" on public.guest_announcements for insert with check (true);

create policy "photos_read" on public.guest_photos for select using (true);
create policy "photos_insert" on public.guest_photos for insert with check (true);

create policy "guestbook_read" on public.guest_guestbook for select using (true);
create policy "guestbook_insert" on public.guest_guestbook for insert with check (true);
```

Enable **Realtime** for `guest_announcements` in the Supabase dashboard.

## 3. Storage bucket

1. Storage → New bucket → name `guest-photos` → **Public**
2. Policies (example — open for event day; tighten in production):

```sql
create policy "guest_photos_public_read"
on storage.objects for select
using (bucket_id = 'guest-photos');

create policy "guest_photos_public_upload"
on storage.objects for insert
with check (bucket_id = 'guest-photos');
```

## 4. Smoke test

1. Open `https://www.visriva.com/guest/demo?name=Priya&table=12&seat=A`
2. Insert an announcement row with `event_id = 'demo'` — banner should update live
3. Upload a photo from a phone — appears on the wall
4. Ask the concierge “What time is cake cutting?”

## 5. Event-day QR

Print QR codes pointing to:

`https://www.visriva.com/guest/YOUR_EVENT_ID?name=`

(or prefill name/table/seat per place card if you generate unique links).

Marketing hub remains at `/qr` with a link into `/guest/demo`.
