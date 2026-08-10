# DM Automation Flows — Instagram (ManyChat)

Set up at [manychat.com](https://manychat.com) → Connect Instagram Business account linked to `@visriva.co`.

**Rules:**
- Only automate replies to people who **DM you first** or comment your trigger keyword.
- Never bulk cold-DM strangers (ban risk).
- Keep messages under 300 characters where possible; break long flows into quick replies.

---

## Flow 0 — Default welcome (any first DM)

**Trigger:** First message to your account (ManyChat Default Reply)

```
Hi! 👋 Welcome to Visriva Live Station — luxury live gifting & photo booths.

What are you planning?
1️⃣ Wedding / Sangeet / Reception
2️⃣ Corporate event
3️⃣ I'm a planner / vendor

Reply with 1, 2, or 3 — or type EVENT for our package overview.
```

**Quick replies:** `1 Wedding` | `2 Corporate` | `3 Planner`

---

## Flow 1 — Keyword: EVENT

**Trigger:** Message contains `EVENT` (case insensitive)

```
Thanks for reaching out to Visriva! ✨

We set up luxury live stations at your venue:
📸 Instant Photo Booth
🧲 Live Magnet Station
🔑 Keychain · ☕ Mug · 👕 Tote stations

📍 Bengaluru + pan-India travel

To send you the right package, reply with:
• Event date (or month)
• City / venue
• Wedding or corporate?
• Approx guest count

Or book directly: https://www.visriva.com/reserve

Our team will reply on WhatsApp within a few hours.
```

**Follow-up tag in ManyChat:** `lead-event`

**Optional:** Send image — your best event hero shot.

---

## Flow 2 — Keyword: PLANNER

**Trigger:** Message contains `PLANNER`

```
Hello! We'd love to partner with you. 🤝

Visriva offers registered planners:
✓ Net vendor rates (not public pricing)
✓ Co-branded prints & overlays
✓ Priority date holds in peak season
✓ Dedicated WhatsApp POC

Partner overview: https://www.visriva.com/planners

Reply with your agency name + city and we'll send the partner deck on WhatsApp.
```

**Tag:** `lead-planner`

**Internal action:** Notify yourself on WhatsApp/email when tagged.

---

## Flow 3 — Keyword: PRICE

**Trigger:** Message contains `PRICE` or `COST` or `RATE`

```
Great question! Our packages depend on:

• Stations selected (booth, magnets, keychains, etc.)
• Event date & duration
• Location (Bengaluru vs outstation)
• Guest count

Starting packages are shared after a quick consult — every event is custom.

Fastest way to get your quote:
👉 https://www.visriva.com/reserve

Or reply with your DATE + CITY + GUEST COUNT and we'll estimate on WhatsApp.
```

**Tag:** `lead-price`

---

## Flow 4 — Keyword: DATE

**Trigger:** Message contains `DATE` or `AVAILABLE`

```
We'd love to check availability for you! 📅

Please send:
1. Event date (or weekend)
2. Venue city
3. Wedding or corporate

We'll confirm within 24 hours.

Peak season (Oct–Feb) books early — if your date is soon, mention "URGENT".
```

**Tag:** `lead-date`

---

## Flow 5 — Keyword: CORPORATE

**Trigger:** `CORPORATE` or `OFFICE` or `BRAND`

```
Visriva for corporate events 🏢

Perfect for:
• Annual days & town halls
• Product launches
• Team offsites
• Brand activations

We offer GST invoices, custom branding on all outputs, and professional crew.

Share: company name, event date, city, headcount.

Reserve: https://www.visriva.com/reserve
```

**Tag:** `lead-corporate`

---

## Flow 6 — Comment trigger (Reels & posts)

**Post caption CTA:** "Comment **EVENT** and we'll DM you the package link"

**ManyChat automation:** When comment contains `EVENT` → auto-DM:

```
Hey! Here's the Visriva package link you asked for ✨
https://www.visriva.com/reserve

Questions? Just reply here — we're on it.
```

**Important:** Turn on "Ask to follow before DM" only if you want followers; can reduce conversions.

---

## Flow 7 — After-hours auto-reply

**Trigger:** Outside 9 AM – 9 PM IST (optional)

```
Thanks for messaging Visriva! 🌙

We're offline right now but saw your message. We'll reply by 10 AM tomorrow.

For urgent date checks, WhatsApp: https://wa.me/918884484828

Or leave your date + city here and we'll prioritize your reply.
```

---

## Flow 8 — 48-hour no-reply nudge (manual or ManyChat sequence)

**Only if they opted in via DM first**

```
Hi! Just checking in — did you get a chance to look at Visriva for your event?

Happy to hold a date tentatively if you're comparing vendors. No pressure.

Reply DATE + city or book: https://www.visriva.com/reserve
```

---

## Branch: Reply "1" (Wedding)

```
Beautiful! 💍 For weddings we typically cover sangeet, reception, or full wedding weekend.

Most couples add:
• Photo booth strip (instant prints)
• Live magnet station (favourite combo)

What's your wedding month and venue city?
```

---

## Branch: Reply "3" (Planner)

→ Redirect to Flow 2 (PLANNER)

---

## ManyChat setup checklist

- [ ] Instagram Business account connected
- [ ] Default Reply = Flow 0
- [ ] Keywords: EVENT, PLANNER, PRICE, DATE, CORPORATE
- [ ] Comment automation on 1 Reel per week (test)
- [ ] Tags: `lead-event`, `lead-planner`, `lead-corporate`, `lead-price`, `lead-date`
- [ ] Email/WhatsApp notification when new tagged lead
- [ ] Test each flow from a personal account
- [ ] Bio says: **DM "EVENT" for packages**

---

## Connect to your website stack

When lead is hot, send on WhatsApp:

```
Hi [Name], Visriva here from Instagram.

Your quote link: https://www.visriva.com/contract?leadId=[ID]
(once CRM ref exists)

Or complete booking: https://www.visriva.com/reserve
```

Your site already alerts owner on `/api/booking/submit` — Instagram feeds the top of that funnel.

---

## What NOT to automate

- Negotiating final price
- Confirming deposit received
- Custom frame design approval
- Event-day logistics

Those stay human on WhatsApp (+91 88844 84828).

---

## Firestore CRM integration (automatic)

When someone DMs a keyword, add an **External Request** at the end of each flow to save the lead to your admin CRM.

**Full setup:** [manychat-firestore-setup.md](./manychat-firestore-setup.md)

**Webhook URL:**
```
https://www.visriva.com/api/manychat/webhook?secret=YOUR_MANYCHAT_WEBHOOK_SECRET
```

Set `MANYCHAT_WEBHOOK_SECRET` on Vercel, then add the External Request JSON body from the setup doc to each flow (EVENT, PLANNER, PRICE, DATE, CORPORATE).
