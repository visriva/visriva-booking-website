# Google Sheets — Finance Sync Setup

Sync every income/expense from Operations Hub → your Google Sheet automatically.

---

## Step 1 — Create the sheet

1. Go to [Google Sheets](https://sheets.google.com) → **Blank spreadsheet**
2. Name it: `Visriva Finance`
3. Row 1 headers (copy-paste):

```
Date	Type	Amount (INR)	Category	Description	Party	Bank	Payment Method	Reason	Event Ref	Firestore ID	Synced At
```

---

## Step 2 — Apps Script webhook

1. In the sheet: **Extensions → Apps Script**
2. Delete default code and paste:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const body = JSON.parse(e.postData.contents);
    const rows = body.rows || [];
    if (rows.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "no rows" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, added: rows.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the **Web app URL** (ends in `/exec`)

---

## Step 3 — Connect in Operations Hub

1. Open **https://www.visriva.com/admin/operations**
2. Sign in with your Operations PIN (check "Remember this device")
3. **Finance & P&L** → tab **sheets**
4. Paste:
   - **Google Sheet URL** — your sheet link
   - **Apps Script Webhook URL** — the `/exec` URL from step 2
5. Enable **Auto-sync on save**
6. Click **Save settings**

---

## Step 4 — Test

1. Finance → **AI Scan** or **expense** → add a test ₹100 expense
2. Check your Google Sheet — new row should appear
3. Or click **Sync all to Sheet** to push existing Firestore transactions

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Sync failed 401 | Log in to Operations Hub again with your Operations PIN |
| Sheet empty after sync | Redeploy Apps Script; ensure "Anyone" access |
| Duplicate rows | Normal if you sync all multiple times — dedupe in sheet |
| GEMINI scan fails | Create a new key at [Google AI Studio](https://aistudio.google.com/apikey) → set `GEMINI_API_KEY` on Vercel → redeploy. Old `AQ.` keys may be revoked if leaked. Alternative: [enable Vertex AI API](https://console.developers.google.com/apis/api/aiplatform.googleapis.com/overview?project=visriva-live-station) on project `visriva-live-station` (uses Firebase service account fallback). Check status: `/api/operations/gemini-status` |

---

## Optional — Share sheet with team

Share the Google Sheet with `visriva.work@gmail.com` or your crew emails as **Editor**.

The webhook runs as **you** (the Google account that deployed the script).
