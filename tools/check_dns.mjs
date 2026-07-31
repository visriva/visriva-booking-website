import dns from "dns/promises";

async function checkDNS() {
  try {
    console.log("=== CHECKING NAMESERVERS ===");
    const ns = await dns.resolveNs("visriva.com");
    console.log("NS Records:", ns);

    console.log("\n=== CHECKING A RECORDS ===");
    const a = await dns.resolve4("visriva.com");
    console.log("A Records (visriva.com):", a);

    const aWww = await dns.resolve4("www.visriva.com");
    console.log("A Records (www.visriva.com):", aWww);
  } catch (err) {
    console.error("DNS Resolution Error:", err.message);
  }
}

checkDNS();
