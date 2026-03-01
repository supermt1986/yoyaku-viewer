# Google Sheets API v4 Setup

## Required Configuration

To enable HYPERLINK URL extraction, you need a Google Cloud API key.

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create new project (or select existing)
3. Enable "Google Sheets API"

### Step 2: Create API Key
1. Navigate to **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Copy the generated key

### Step 3: Set Environment Variable
In your deployment environment:

```bash
export GOOGLE_SHEETS_API_KEY="YOUR_API_KEY_HERE"
```

For Cloudflare Pages:
1. Open `wrangler.toml` or use CLI:
   ```bash
   npx wrangler secret put GOOGLE_SHEETS_API_KEY
   ```

### Step 4: Authorize Access to Sheet
Since this is a public sheet, no OAuth consent needed if:
- Sheet is shared as "Anyone with link can view"
- API key has `spreadsheets.readonly` scope

The current sheet should already be publicly accessible.

## What This Enables

With API key configured:
- ✅ Full HYPERLINK formula access via `includeValuesInFormula=true`
- ✅ Direct URL extraction from formulas like `=HYPERLINK("https://...", "@")`
- ✅ All three link columns work correctly

## Fallback Behavior

If no API key is set, app falls back to CSV export mode where links show as "🔒 リンクなし".

---

**Current Sheet ID:** `1mgeVYCf9a9zuEla6YfbNqceOsBRXA08YOc3rGuZtDx8`
