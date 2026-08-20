# Google Search Console — Visriva

Verify https://www.visriva.com so Search Console can index Bengaluru SEO pages and report queries.

## What the site already supports

Root layout (`app/layout.tsx`) emits the Google meta tag when this env var is set on Vercel:

```bash
GOOGLE_SITE_VERIFICATION=your_token_here
```

Token only — not the full HTML tag. Example: if Google shows

```html
<meta name="google-site-verification" content="AbCdEf123..." />
```

set `GOOGLE_SITE_VERIFICATION=AbCdEf123...`

## Steps (5 minutes)

1. Open [Google Search Console](https://search.google.com/search-console)
2. Add property → **URL prefix** → `https://www.visriva.com`
3. Choose **HTML tag** verification
4. Copy the `content="..."` value
5. Add to Vercel (Production + Preview):

```bash
cd "/Users/g1/Desktop/Jeevan Visriva /LIVE STATION /Website"
npx vercel env add GOOGLE_SITE_VERIFICATION production
# paste token when prompted
npx vercel env add GOOGLE_SITE_VERIFICATION preview
```

6. Redeploy production (push or `npx vercel --prod`)
7. In GSC click **Verify**
8. Submit sitemap: `https://www.visriva.com/sitemap.xml`

## After verification

- Request indexing for `/`, `/reserve`, `/photo-booth-bengaluru`, `/wedding-photo-booth-bangalore`
- Check **Performance** weekly for queries like “photo booth bangalore”
- Fix Coverage errors if any SEO landings 404

## Alternate: HTML file

If you prefer file upload instead of meta tag:

1. Download Google’s `googleXXXX.html` from GSC
2. Place it in `public/googleXXXX.html`
3. Deploy, then verify in GSC

Do **not** commit the file to a public gist; keep it in the repo only.
