# Guest Experience Portal — Supabase setup

Schema used by `/guest/[eventId]`: `guests`, `agenda_items`, `photos`, `announcements`, storage bucket `event_photos`.

Without Supabase env + tables, the portal still runs in **demo fallback** mode.

## 1. Env vars

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# Optional AI
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
```

## 2. Database schema (SQL Editor)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. GUESTS (personalized greetings / table numbers)
CREATE TABLE IF NOT EXISTS guests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  table_number VARCHAR(10),
  seat_number VARCHAR(10),
  access_code VARCHAR(20) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AGENDA / ITINERARY
CREATE TABLE IF NOT EXISTS agenda_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PHOTO WALL metadata
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  guest_name TEXT,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LIVE ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. Enable Realtime

```sql
alter publication supabase_realtime add table agenda_items;
alter publication supabase_realtime add table photos;
alter publication supabase_realtime add table announcements;
```

(If a table is already in the publication, Postgres will error — skip that line.)

Also confirm in Dashboard → Database → Replication that these tables are enabled.

## 4. Storage bucket `event_photos`

1. Storage → New bucket → **event_photos** → **Public**
2. Policies:

```sql
create policy "event_photos_public_read"
on storage.objects for select
using (bucket_id = 'event_photos');

create policy "event_photos_public_upload"
on storage.objects for insert
with check (bucket_id = 'event_photos');
```

## 5. Row Level Security (anonymous QR guests)

```sql
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access to agenda"
  ON agenda_items FOR SELECT USING (true);

CREATE POLICY "Allow public read-only access to announcements"
  ON announcements FOR SELECT USING (true);

CREATE POLICY "Allow public read-only access to guests"
  ON guests FOR SELECT USING (true);

CREATE POLICY "Allow public to view approved photos"
  ON photos FOR SELECT USING (is_approved = true);

CREATE POLICY "Allow anonymous photo uploads"
  ON photos FOR INSERT WITH CHECK (true);
```

Writes for agenda / announcements / guests should use the **service role** in Admin (or Supabase dashboard), not the anon key.

## 6. Sample seed (optional)

```sql
INSERT INTO announcements (message, is_active)
VALUES ('Welcome — the Visriva Live Station is open for keepsakes.', true);

INSERT INTO agenda_items (title, description, start_time, end_time, location_name) VALUES
  ('Welcome drinks', 'Soft check-in at the foyer', NOW() + interval '0 minutes', NOW() + interval '45 minutes', 'Foyer'),
  ('Visriva Photo Booth', 'Instant prints all evening', NOW() + interval '45 minutes', NOW() + interval '4 hours', 'Photo Booth bay');

INSERT INTO guests (full_name, table_number, seat_number, access_code)
VALUES ('Priya Sharma', '12', 'A', 'PRIYA12');
```

## 7. How the app uses this

| Feature | Table / bucket | Realtime |
|---------|----------------|----------|
| VIP card | `guests` via `?code=` access_code | — |
| Itinerary | `agenda_items` (fallback: demo config) | `postgres_changes` |
| Announcements | `announcements` where `is_active` | `postgres_changes` |
| Photo wall | `photos` + `event_photos` bucket | `postgres_changes` on INSERT |

Guest opens: `/guest/demo?code=PRIYA12` or `?name=Priya&table=12&seat=A`

## 8. Guestbook

Guestbook still uses local/demo storage until you add a dedicated table; photo wall + agenda + announcements are on this schema.
