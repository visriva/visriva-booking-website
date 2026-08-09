#!/usr/bin/env node
/**
 * Visriva USB print server — runs on the event laptop (port 3847).
 * POST /print with multipart image → sends to system default printer via `lp`.
 * GET /health → printer status.
 */

const http = require("http");
const { exec } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PORT = Number(process.env.PRINT_SERVER_PORT || 3847);
const HOST = process.env.PRINT_SERVER_HOST || "0.0.0.0";

function getDefaultPrinter() {
  return new Promise((resolve) => {
    exec("lpstat -d 2>/dev/null", (err, stdout) => {
      if (err) return resolve(null);
      const m = stdout.match(/system default destination:\s*(.+)/i);
      resolve(m ? m[1].trim() : "default");
    });
  });
}

function printFile(filePath, printer) {
  return new Promise((resolve, reject) => {
    const cmd = printer ? `lp -d "${printer}" "${filePath}"` : `lp "${filePath}"`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

function parseMultipart(buffer, boundary) {
  const parts = buffer.toString("binary").split(`--${boundary}`);
  for (const part of parts) {
    if (!part.includes("Content-Disposition")) continue;
    const nameMatch = part.match(/name="([^"]+)"/);
    const filenameMatch = part.match(/filename="([^"]+)"/);
    if (!filenameMatch && nameMatch?.[1] !== "image") continue;
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;
    const body = part.slice(headerEnd + 4).replace(/\r\n--$/, "").replace(/\r\n$/, "");
    return Buffer.from(body, "binary");
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    const printer = await getDefaultPrinter();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        printer: printer || "default",
        note: "Visriva print server",
        port: PORT,
      })
    );
    return;
  }

  if (req.method === "POST" && req.url === "/print") {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const contentType = req.headers["content-type"] || "";
        let imageBuffer = null;

        if (contentType.includes("multipart/form-data")) {
          const boundary = contentType.split("boundary=")[1];
          imageBuffer = parseMultipart(buffer, boundary);
        } else {
          imageBuffer = buffer;
        }

        if (!imageBuffer?.length) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "No image data" }));
          return;
        }

        const tmpFile = path.join(os.tmpdir(), `visriva-print-${Date.now()}.jpg`);
        fs.writeFileSync(tmpFile, imageBuffer);
        const printer = await getDefaultPrinter();
        await printFile(tmpFile, printer);
        fs.unlink(tmpFile, () => {});

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, printer: printer || "default" }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: err.message || "Print failed" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, HOST, () => {
  console.log(`Visriva print server listening on http://${HOST}:${PORT}`);
  console.log("  GET  /health");
  console.log("  POST /print  (multipart image)");
});
