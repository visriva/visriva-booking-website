import {
  getSupabaseAdmin,
  isSupabaseAdminConfigured,
  PHOTOBOOTH_PRINT_BUCKET,
} from "@/lib/supabaseAdmin";

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  return {
    mime: match[1] || "image/jpeg",
    buffer: Buffer.from(match[2], "base64"),
  };
}

/** Server-only cloud mirror for print jobs (lazy-imported from /api/print). */
export async function persistPrintJobToCloud(
  jobId: string,
  imageUrl: string,
  meta: { captureId: string; source: string; size: string; createdAt: string }
): Promise<string | null> {
  const { captureId, source, size, createdAt } = meta;

  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { buffer, mime } = dataUrlToBuffer(imageUrl);
        const storagePath = `jobs/${jobId}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from(PHOTOBOOTH_PRINT_BUCKET)
          .upload(storagePath, buffer, { contentType: mime, upsert: false });

        let url = imageUrl;
        if (!uploadErr) {
          const { data } = supabase.storage.from(PHOTOBOOTH_PRINT_BUCKET).getPublicUrl(storagePath);
          if (data?.publicUrl) url = data.publicUrl;
        }

        const { error } = await supabase.from("print_jobs").insert({
          id: jobId,
          image_url: url,
          storage_path: uploadErr ? null : storagePath,
          status: "pending",
          source,
          capture_id: captureId,
          created_at: createdAt,
        });
        if (!error) return "supabase";
      } catch (e) {
        console.warn("Supabase persist note:", e);
      }
    }
  }

  try {
    const { adminDb } = await import("@/lib/firebaseAdmin");
    if (!adminDb) return null;
    const { FieldValue } = await import("firebase-admin/firestore");
    await adminDb.collection("print_jobs").doc(jobId).set({
      imageUrl,
      status: "pending",
      source,
      captureId,
      size,
      createdAt,
      serverCreatedAt: FieldValue.serverTimestamp(),
    });
    return "firebase";
  } catch (e) {
    console.warn("Firebase persist note:", e);
  }

  return null;
}
