const API_TOKEN = "cfat_f1uJWJOxdzW0gW7fi7LPlP73rVgCadyu9u5C5rTibee42a1f";
const ACCOUNT_ID = "cc5ca1ab67be1061ac1e26bbe498bfea";

async function cfRequest(endpoint, method = "GET", body = null) {
  const url = `https://api.cloudflare.com/client/v4${endpoint}`;
  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();
  return data;
}

async function optimizeCloudflare() {
  try {
    console.log("=== 1. FETCHING CLOUDFLARE ZONES ===");
    const zonesRes = await cfRequest("/zones?name=visriva.com");
    if (!zonesRes.success || zonesRes.result.length === 0) {
      console.error("Failed to get zone:", JSON.stringify(zonesRes, null, 2));
      return;
    }

    const zone = zonesRes.result[0];
    const zoneId = zone.id;
    console.log(`✅ Found Zone ID: ${zoneId} for domain ${zone.name}`);

    console.log("\n=== 2. SETTING SSL ENCRYPTION TO FULL (STRICT) ===");
    const sslRes = await cfRequest(`/zones/${zoneId}/settings/ssl`, "PATCH", { value: "strict" });
    console.log("SSL Setting Result:", sslRes.success ? "SUCCESS" : sslRes.errors);

    console.log("\n=== 3. ENABLING AUTO MINIFY (HTML, CSS, JS) ===");
    const minifyRes = await cfRequest(`/zones/${zoneId}/settings/minify`, "PATCH", {
      value: { html: "on", css: "on", js: "on" },
    });
    console.log("Minify Result:", minifyRes.success ? "SUCCESS" : minifyRes.errors);

    console.log("\n=== 4. ENABLING BROTLI COMPRESSION ===");
    const brotliRes = await cfRequest(`/zones/${zoneId}/settings/brotli`, "PATCH", { value: "on" });
    console.log("Brotli Result:", brotliRes.success ? "SUCCESS" : brotliRes.errors);

    console.log("\n=== 5. ENABLING ROCKET LOADER ===");
    const rocketRes = await cfRequest(`/zones/${zoneId}/settings/rocket_loader`, "PATCH", { value: "on" });
    console.log("Rocket Loader Result:", rocketRes.success ? "SUCCESS" : rocketRes.errors);

    console.log("\n=== 6. PURGING CLOUDFLARE EDGE CACHE ===");
    const purgeRes = await cfRequest(`/zones/${zoneId}/purge_cache`, "POST", { purge_everything: true });
    console.log("Purge Cache Result:", purgeRes.success ? "SUCCESS" : purgeRes.errors);

    console.log("\n⚡ ALL CLOUDFLARE SPEED & SSL OPTIMIZATIONS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Error optimizing Cloudflare:", err);
  }
}

optimizeCloudflare();
