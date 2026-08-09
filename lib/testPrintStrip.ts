/** Generate a test 2x6 strip JPEG for preflight print checks. */
export async function createTestPrintStripBlob(): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 1800;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.fillStyle = "#011F15";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 42px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("VISRIVA", canvas.width / 2, 200);
  ctx.fillText("TEST PRINT", canvas.width / 2, 260);

  ctx.fillStyle = "#ffffff";
  ctx.font = "24px sans-serif";
  ctx.fillText(new Date().toLocaleString("en-IN"), canvas.width / 2, 340);
  ctx.fillText("If you see this strip,", canvas.width / 2, 900);
  ctx.fillText("the print pipeline works.", canvas.width / 2, 940);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create test image"))),
      "image/jpeg",
      0.92
    );
  });
}
