import dns from "dns/promises";

async function checkPublicDNS() {
  const resolver = new dns.Resolver();
  resolver.setServers(["8.8.8.8", "1.1.1.1"]);

  try {
    console.log("=== QUERYING GOOGLE (8.8.8.8) & CLOUDFLARE (1.1.1.1) ===");
    const ns = await resolver.resolveNs("visriva.com");
    console.log("Global Nameservers:", ns);

    const aApex = await resolver.resolve4("visriva.com");
    console.log("Apex A Records:", aApex);

    const aWww = await resolver.resolve4("www.visriva.com");
    console.log("WWW A Records:", aWww);
  } catch (err) {
    console.error("DNS Error:", err.message);
  }
}

checkPublicDNS();
