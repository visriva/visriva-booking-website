import https from "https";

function checkCert(hostname) {
  return new Promise((resolve) => {
    const req = https.request(`https://${hostname}`, { method: "HEAD" }, (res) => {
      const cert = res.socket.getPeerCertificate();
      console.log(`\n=== CERTIFICATE FOR ${hostname} ===`);
      console.log("Subject:", cert.subject);
      console.log("Issuer:", cert.issuer);
      console.log("Valid From:", cert.valid_from);
      console.log("Valid To:", cert.valid_to);
      console.log("HTTP Status:", res.statusCode);
      resolve({ status: res.statusCode, cert });
    });

    req.on("error", (err) => {
      console.error(`Error for ${hostname}:`, err.message);
      resolve({ error: err.message });
    });

    req.end();
  });
}

async function verify() {
  await checkCert("www.visriva.com");
  await checkCert("visriva.com");
}

verify();
