# Google Calendar Sync — Operations Hub

Sync Visriva availability with your Google Calendar in two directions.

## Where to set it up

1. Open **https://www.visriva.com/admin/operations**
2. PIN: **G1**
3. **Availability** tab → **Google Calendar Sync** panel (top)

---

## Import: Google Calendar → Website (blocks `/reserve`)

When you add events on Google Calendar, those dates block on the booking form.

### Steps

1. Open [Google Calendar Settings](https://calendar.google.com/calendar/u/0/r/settings)
2. Select your calendar (left sidebar) → **Integrate calendar**
3. Copy **Secret address in iCal format** (ends with `.ics`)
4. Paste into **Google Calendar secret iCal URL** in Operations Hub
5. Click **Save & Sync now**

### How events map

| Google event | Website status |
|--------------|----------------|
| Normal event / all-day booking | **Fully booked** (red) |
| Title contains `hold`, `tentative`, `enquiry`, `waitlist` | **High demand** (amber) |
| Timed event (e.g. 6pm wedding) | Full day blocked if checkbox enabled |

### Sync schedule

- Click **Sync now** anytime
- Auto-sync runs when you open Operations Hub if last sync was **4+ hours** ago

---

## Export: Website → Google Calendar (view on phone)

Subscribe to Visriva blocked dates inside Google Calendar.

1. In Operations Hub → **Save** (generates export token)
2. Click **Copy export URL**
3. Google Calendar → **+** next to *Other calendars* → **From URL**
4. Paste the URL → **Add calendar**

Google refreshes subscribed calendars every few hours.

---

## Manual blocks still work

Dates you click-block in Operations Hub are **kept** on sync. Google-imported dates are updated each sync; manual blocks are not removed unless you unblock them in the calendar UI.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Sync fails 401/403 | Re-copy the **secret** iCal URL (not the public one) |
| Events not blocking | Click **Sync now**; check event is within next 18 months |
| Export URL unauthorized | Save settings first to generate token |
| Date re-blocks after you unblocked | Event still exists on Google Calendar — delete or move it there |

---

## Security

- Keep the **secret iCal URL** private (anyone with it can read your calendar)
- Export feed URL includes a secret token — do not share publicly
