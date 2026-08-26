# Photo wall AI moderation (Sightengine)

Uploads land with `is_approved = false`. A Supabase Edge Function + Database Webhook calls Sightengine; safe images flip to `is_approved = true`. The guest portal listens for that UPDATE over Realtime.

## 1. Default: hide until approved

```sql
ALTER TABLE photos ALTER COLUMN is_approved SET DEFAULT FALSE;

-- Optional: flip any existing rows that were auto-shown
-- UPDATE photos SET is_approved = false WHERE is_approved = true;
```

Confirm RLS still has:

```sql
CREATE POLICY "Allow public to view approved photos"
  ON photos FOR SELECT USING (is_approved = true);
```

## 2. Sightengine keys

1. Create an account at [Sightengine](https://sightengine.com)
2. Copy **API User** + **API Secret**
3. In Supabase → Project Settings → Edge Functions → Secrets, add:
   - `SIGHTENGINE_API_USER`
   - `SIGHTENGINE_API_SECRET`
   - Optional: `MODERATION_THRESHOLD` (default `0.8`)

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are usually injected automatically for Edge Functions.

## 3. Deploy the Edge Function

Source in this repo: [`supabase/functions/moderate-photo/index.ts`](../../supabase/functions/moderate-photo/index.ts)

```bash
# from repo root (requires Supabase CLI linked to your project)
supabase functions deploy moderate-photo --no-verify-jwt
```

`--no-verify-jwt` is typical for Database Webhooks (they do not send a user JWT). Optionally verify a custom header secret in the function later.

Function URL pattern:

`https://YOUR_PROJECT_REF.supabase.co/functions/v1/moderate-photo`

## 4. Database Webhook

1. Supabase Dashboard → **Database** → **Webhooks** → Create
2. Name: `photos-insert-moderate`
3. Table: `photos`
4. Events: **Insert**
5. Type: **Supabase Edge Function** (or HTTP) → `moderate-photo`
6. HTTP method: POST  
7. Include record in payload (default)

On each insert the function:

1. Reads `record.public_url` + `record.id`
2. GET Sightengine `check.json` with models `nudity-2.1,gore-2.0,weapon`
3. If max risk score &lt; threshold → `UPDATE photos SET is_approved = true WHERE id = …`
4. On API failure → **fail closed** (stays unapproved for manual review)

## 5. Guest UI behaviour

[`PhotoWall`](../../components/guest/PhotoWall.tsx):

1. Upload → insert with `is_approved: false`
2. Banner: **Scanning for good vibes…**
3. Realtime `UPDATE` on that row when approved → confetti + photo on wall
4. After **15 seconds** without approval → *Your photo is in the queue for manual review!*

## 6. Manual review

In Table Editor, set `is_approved = true` for queued photos. Realtime UPDATE will push them to all open guest portals.
