#!/usr/bin/env python3
"""
Fix visriva.com DNS + SSL for Vercel + Cloudflare (Jio ISP bypass).

Usage:
  1. Add CLOUDFLARE_API_TOKEN=your_token to .env
  2. python3 fix_cloudflare_dns.py

Requires Cloudflare API token with Zone:DNS:Edit and Zone:Settings:Edit.
Create at: https://dash.cloudflare.com/profile/api-tokens
"""
import json
import os
import sys
import urllib.error
import urllib.request

env_path = os.path.join(os.path.dirname(__file__), ".env")
API_TOKEN = None
for candidate in (os.path.join(os.path.dirname(__file__), ".env.local"), env_path):
    if os.path.isfile(candidate):
        with open(candidate, "r") as f:
            for line in f:
                line = line.strip()
                if line.startswith("CLOUDFLARE_API_TOKEN"):
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        API_TOKEN = parts[1].strip().strip('"').strip("'")
                        break
        if API_TOKEN:
            break

if not API_TOKEN:
    print("❌ Add CLOUDFLARE_API_TOKEN=... to .env.local")
    print("   Create token: Cloudflare Dashboard → Profile → API Tokens")
    sys.exit(1)

DOMAIN = "visriva.com"
VERCEL_A = "76.76.21.21"
VERCEL_CNAME = "cname.vercel-dns.com"

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json",
}


def request(method, url, data=None):
    req = urllib.request.Request(url, method=method, headers=headers)
    if data is not None:
        req.data = json.dumps(data).encode("utf-8")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP {e.code}: {e.read().decode('utf-8')}")
        sys.exit(1)


print(f"🔍 Finding zone for {DOMAIN}...")
zones = request("GET", f"https://api.cloudflare.com/client/v4/zones?name={DOMAIN}")
if not zones.get("result"):
    print("❌ Zone not found")
    sys.exit(1)

zone = zones["result"][0]
zone_id = zone["id"]
print(f"✅ Zone: {zone['name']} | status={zone['status']} | paused={zone.get('paused', False)}")

if zone.get("paused"):
    print("⚠️  Zone is PAUSED — unpause in Cloudflare Overview first!")
    sys.exit(1)

print("\n🔧 Setting SSL mode to Full...")
ssl = request("PATCH", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/ssl", {"value": "full"})
print("   SSL:", ssl.get("result", {}).get("value", "ok"))

print("\n🔧 Setting security level to medium...")
sec = request("PATCH", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/security_level", {"value": "medium"})
print("   Security:", sec.get("result", {}).get("value", "ok"))

print("\n🔍 Syncing DNS records (proxied → Vercel)...")
records = request("GET", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records")

targets = {DOMAIN, f"www.{DOMAIN}"}
for rec in records.get("result", []):
    if rec["name"] in targets and rec["type"] in ("A", "CNAME"):
        print(f"🗑️  Delete {rec['type']} {rec['name']} → {rec['content']}")
        request("DELETE", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{rec['id']}")

print(f"➕ A {DOMAIN} → {VERCEL_A} (proxied)")
request("POST", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records", {
    "type": "A", "name": DOMAIN, "content": VERCEL_A, "proxied": True, "ttl": 1,
})

print(f"➕ CNAME www → {VERCEL_CNAME} (proxied)")
request("POST", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records", {
    "type": "CNAME", "name": "www", "content": VERCEL_CNAME, "proxied": True, "ttl": 1,
})

print("\n🧹 Purging Cloudflare cache...")
purge = request("POST", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache", {"purge_everything": True})
print("   Purge:", "ok" if purge.get("success") else purge)

print("\n✅ Done! Wait 2–3 minutes, then test https://www.visriva.com")
print("   If still down, check Vercel → Settings → Domains (both visriva.com + www must be Valid).")
