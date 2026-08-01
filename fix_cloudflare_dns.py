import urllib.request
import urllib.error
import json
import os
import sys

# Load Cloudflare API token from .env (same directory as this script)
env_path = os.path.join(os.path.dirname(__file__), ".env")
API_TOKEN = None
if os.path.isfile(env_path):
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith("CLOUDFLARE_API_TOKEN"):
                # Allow optional quotes
                parts = line.split("=", 1)
                if len(parts) == 2:
                    token = parts[1].strip().strip('"')
                    API_TOKEN = token
                    break
if not API_TOKEN:
    print("❌ CLOUDFLARE_API_TOKEN not found in .env file")
    sys.exit(1)

DOMAIN = "visriva.com"
VERCEL_A_RECORD = "76.76.21.21"
VERCEL_CNAME_RECORD = "cname.vercel-dns.com"

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

def request(method, url, data=None):
    req = urllib.request.Request(url, method=method, headers=headers)
    if data:
        req.data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.read().decode('utf-8')}")
        sys.exit(1)

print(f"🔍 Finding Cloudflare Zone ID for {DOMAIN}...")
zones_data = request("GET", f"https://api.cloudflare.com/client/v4/zones?name={DOMAIN}")
if not zones_data['result']:
    print(f"❌ Could not find domain {DOMAIN} in your Cloudflare account.")
    sys.exit(1)

zone_id = zones_data['result'][0]['id']
print(f"✅ Found Zone ID: {zone_id}")

print("🔍 Fetching existing DNS records...")
records_data = request("GET", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records")
for record in records_data['result']:
    if record['name'] in [DOMAIN, f"www.{DOMAIN}"] and record['type'] in ['A', 'CNAME']:
        print(f"🗑️ Deleting old record: {record['name']} ({record['type']} -> {record['content']})")
        request("DELETE", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{record['id']}")

print(f"➕ Adding new A record for {DOMAIN} -> {VERCEL_A_RECORD} (Proxied)...")
request("POST", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records", {
    "type": "A",
    "name": DOMAIN,
    "content": VERCEL_A_RECORD,
    "proxied": True,
    "ttl": 1
})

print(f"➕ Adding new CNAME record for www.{DOMAIN} -> {VERCEL_CNAME_RECORD} (Proxied)...")
request("POST", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records", {
    "type": "CNAME",
    "name": f"www.{DOMAIN}",
    "content": VERCEL_CNAME_RECORD,
    "proxied": True,
    "ttl": 1
})

print("🎉 Successfully updated Cloudflare DNS to proxy directly to Vercel!")
print("Visriva.com will now load instantly and bypass Jio ISP DNS blocking.")
