# ManyChat → Firestore CRM Setup

Instagram DMs that hit your ManyChat flows are saved to the **`bookings`** collection in Firestore and appear in **Admin → Booking CRM** with an **Instagram** badge. You get a WhatsApp alert on your owner number for each **new** subscriber lead.

---

## Step 1 — Vercel environment variable

In Vercel → Project → Settings → Environment Variables:

| Name | Value | Example |
|------|-------|---------|
| `MANYCHAT_WEBHOOK_SECRET` | Long random string | `visriva_manychat_webhook_2026` |

Redeploy after saving.

**Webhook URL (copy this):**
```
https://www.visriva.com/api/manychat/webhook?secret=visriva_manychat_webhook_2026
```
(Replace with your actual secret.)

**Health check:** open in browser:
```
https://www.visriva.com/api/manychat/webhook
```
Should return `{ "ok": true, "secretConfigured": true }`.

---

## Step 2 — ManyChat External Request (each flow)

At the **end** of every keyword flow (EVENT, PLANNER, PRICE, DATE, CORPORATE) and the **Default Welcome** flow:

1. Add action **External Request**
2. **Request type:** POST
3. **URL:** your webhook URL with `?secret=...`
4. **Body type:** JSON
5. **Body:**

```json
{
  "subscriber_id": "{{subscriber_id}}",
  "first_name": "{{first_name}}",
  "last_name": "{{last_name}}",
  "full_name": "{{full_name}}",
  "ig_username": "{{ig_username}}",
  "phone": "{{phone}}",
  "email": "{{email}}",
  "last_input_text": "{{last_input_text}}",
  "live_chat_url": "{{live_chat_url}}",
  "profile_pic": "{{profile_pic}}",
  "keyword": "EVENT",
  "event_date": "{{event_date}}",
  "venue": "{{city}}",
  "pax": "{{guest_count}}"
}
```

Change `"keyword": "EVENT"` to match the flow (`PLANNER`, `PRICE`, etc.).

6. Optional custom fields — create in ManyChat **Settings → Custom Fields**:
   - `event_date` (text)
   - `city` (text)
   - `guest_count` (number)

   Ask for these in the flow before the External Request, then map in JSON.

---

## Step 3 — Test

1. From a personal Instagram account, DM `@visriva.live` with **EVENT**
2. Complete the flow
3. Check:
   - **Admin → Booking CRM** → new card with pink **Instagram** badge
   - WhatsApp alert on **+91 88844 84828**
   - Firestore `bookings` doc with `source: "instagram_manychat"`

**Test webhook with curl:**
```bash
curl -X POST "https://www.visriva.com/api/manychat/webhook?secret=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriber_id": "test-123",
    "full_name": "Test User",
    "ig_username": "testuser",
    "last_input_text": "EVENT - wedding in March",
    "keyword": "EVENT",
    "live_chat_url": "https://manychat.com/"
  }'
```

Expected: `{ "success": true, "isNew": true, "id": "..." }`

---

## How deduplication works

- First message from a subscriber → **new** `bookings` doc + WhatsApp alert
- Same subscriber messages again → **updates** existing lead (merges notes), no duplicate card
- Index stored in Firestore collection `manychat_subscribers`

---

## What appears in CRM

| Field | Source |
|-------|--------|
| Name | IG name or @username |
| Event type | Keyword (EVENT → Instagram Inquiry, PLANNER → Planner Partnership, etc.) |
| Date / venue | Custom fields when collected |
| Notes | Last DM text + tags |
| Badge | Pink **Instagram** + keyword |
| Link | @username opens Instagram profile |

---

## Optional — notify on every message

By default only **new** leads trigger WhatsApp. To also alert on updates, change `notifyInstagramLead` in `lib/instagramLeadNotify.ts` to always send (not recommended — noisy).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Secret in URL must match `MANYCHAT_WEBHOOK_SECRET` on Vercel |
| 503 Database unavailable | Fix Firebase Admin env on Vercel |
| Lead not in CRM | Check ManyChat External Request ran (Flow → Analytics) |
| No WhatsApp alert | Check Meta WhatsApp token; booking alerts use same path |
| Duplicate leads | Same subscriber should update — check `subscriber_id` is in payload |

---

## Files in codebase

- `app/api/manychat/webhook/route.ts` — webhook endpoint
- `lib/manychatLead.ts` — parse + validate payload
- `lib/instagramLeadNotify.ts` — owner WhatsApp alert
- `app/admin/page.tsx` — CRM Instagram badge
