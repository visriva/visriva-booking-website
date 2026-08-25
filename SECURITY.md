# Security notes — Visriva / Live Station

Status of the security review and hardening. Fixes in the first section are
**live in code**; the second section is **not done** and needs a tested change.

## ✅ Hardened (this change)

1. **Operations Hub session is now signed.** `visriva_ops_session` was accepted
   whenever its value equalled the literal string `"1"`, so anyone could forge a
   session with `Cookie: visriva_ops_session=1`. It is now an HMAC-SHA256 signed,
   expiring token (`lib/opsSession.ts`); `isOperationsApiAuthorized()` verifies
   the signature. Set `OPS_SESSION_SECRET` (a long random value) in production.
   *Effect:* everyone is logged out of the Operations Hub once and must re-enter
   their PIN — expected.

2. **Inbound WhatsApp webhooks verify `X-Hub-Signature-256`.** The Meta POST path
   (`/api/whatsapp/webhook`) now rejects requests whose HMAC doesn't match the
   configured app secret (`WHATSAPP_APP_SECRET` / `META_APP_SECRET`). Enforcement
   is automatic when a secret is present; emergency kill switch:
   `WHATSAPP_WEBHOOK_ENFORCE_SIGNATURE=false`.

3. **Cron endpoint fails closed.** `verifyCronSecret()` used to return `true` when
   `CRON_SECRET` was unset. It now rejects. Vercel Cron injects the bearer header
   automatically, so the nightly job keeps working as long as `CRON_SECRET` is set.

## 🚩 Operational actions (do these outside the code)

- **Rotate the GitHub token.** A Personal Access Token is stored in the git remote
  URL (`.git/config`). Rotate it in GitHub → Developer settings, then reset the
  remote to a token-less HTTPS or SSH URL and use a credential helper.
- **Set a dedicated `OPS_SESSION_SECRET`** in Vercel (don't rely on the fallback).
- **Replace the master PIN `4848`** and set `NEXT_PUBLIC_ADMIN_PASSWORDS` — but note
  those are still client-side only (see below).

## ❌ NOT fixed — requires an auth refactor (do not blind-deploy)

The database is still effectively open, and this **cannot** be closed by editing
`firestore.rules` alone, because the browser reads/writes sensitive collections
directly via the client SDK and there is **no Firebase Auth** in the app:

- `finance_transactions` — read/written client-side (`lib/finance.ts`,
  `components/admin/FinanceDashboard.tsx`).
- `chats/*` — read/written client-side (`lib/chatStore.ts`).
- `config/*`, `galleries`, `contracts`, `bookings` — written client-side (admin CMS).

Flipping these rules to `if request.auth != null` (or `if false`) would instantly
break the live Finance dashboard, WhatsApp inbox, and admin CMS. The correct fix,
in order:

1. **Introduce real admin identity** — Firebase Auth (email/password or custom
   token minted after PIN check) so the browser carries a verifiable token, OR
   move all privileged reads/writes into server API routes using `firebase-admin`
   (which bypasses rules).
2. **Then lock `firestore.rules`**: public read only where needed (published
   galleries, `config` the site renders); everything sensitive gated on
   `request.auth` / custom claims; finance + chats server-only.
3. **Guard the remaining privileged API routes** (`/api/gallery/delete`,
   `/api/send-whatsapp`, `/api/ai-agent/send`, `/api/whatsapp/chats`,
   `/api/whatsapp-webhook` PUT) with the same server-verified session.
4. **Move admin auth server-side** — `MASTER_PIN`/`NEXT_PUBLIC_ADMIN_PASSWORDS`
   are compiled into client JS and readable in DevTools today.
5. Add **rate limiting** to public AI proxies (`/api/gemini/concierge`).
