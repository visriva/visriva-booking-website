async function testHTTP() {
  try {
    const res = await fetch("https://visriva.com", { method: "HEAD" });
    console.log("STATUS:", res.status);
    console.log("SERVER HEADER:", res.headers.get("server"));
    console.log("CF-RAY HEADER:", res.headers.get("cf-ray"));
  } catch (err) {
    console.error("HTTP FETCH ERROR:", err.message);
  }
}

testHTTP();
