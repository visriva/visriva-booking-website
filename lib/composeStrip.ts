/**
 * Compose a vertical 2x6 photo strip (600×1800 @ 300dpi) from up to 3 JPEG data URLs.
 */
export async function compose2x6Strip(
  shotDataUrls: string[],
  options?: { watermark?: string; subtitle?: string }
): Promise<Blob> {
  const w = 600;
  const h = 1800;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, "#041a12");
  gradient.addColorStop(0.5, "#011F15");
  gradient.addColorStop(1, "#082e20");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  const watermark = options?.watermark || "Visriva Live Station";
  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 22px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(watermark, w / 2, 36);

  const pad = 20;
  const topOffset = 52;
  const bottomOffset = 56;
  const slotH = (h - topOffset - bottomOffset) / 3;
  const slotW = w - pad * 2;

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load shot"));
      img.src = src;
    });

  const shots = shotDataUrls.slice(0, 3);
  for (let i = 0; i < shots.length; i++) {
    const img = await loadImage(shots[i]);
    const y = topOffset + i * slotH;
    const scale = Math.max(slotW / img.width, (slotH - 8) / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = pad + (slotW - dw) / 2;
    const dy = y + (slotH - dh) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(pad, y + 4, slotW, slotH - 8);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();

    ctx.strokeStyle = "rgba(212,175,55,0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, y + 4, slotW, slotH - 8);
  }

  const subtitle = options?.subtitle || "2x6 Dye-Sublimation Strip";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "16px sans-serif";
  ctx.fillText(subtitle, w / 2, h - 28);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Strip export failed"))),
      "image/jpeg",
      0.92
    );
  });
}
