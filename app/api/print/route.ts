import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  isSupabaseAdminConfigured,
  PHOTOBOOTH_PRINT_BUCKET,
} from "@/lib/supabaseAdmin";
import type { LocalPrintQueueJob } from "@/lib/printQueue";

export const runtime = "nodejs";

/** In-memory local event print buffer (iPad booth → laptop print node on same server). */
let printQueue: LocalPrintQueueJob[] = [];

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  return {
    mime: match[1] || "image/jpeg",
    buffer: Buffer.from(match[2], "base64"),
  };
}

/** Cloud mirror — lazy-loaded so /api/print never imports firebase-admin at module scope (Vercel ESM safe). */
async function persistToCloud(
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

export async function GET() {
  return NextResponse.json({
    jobs: printQueue,
    queueSize: printQueue.filter((j) => j.status === "pending").length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const images = body?.images as string[] | undefined;
      const size = (body?.size as string) || "2x6";
      const source = (body?.source as string) || "webbooth";
      const captureId = (body?.captureId as string) || `job-${Date.now()}`;

      if (!images?.length) {
        return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
      }

      const id = Date.now();
      const timestamp = new Date().toISOString();
      const newJob: LocalPrintQueueJob = {
        id,
        images,
        size,
        timestamp,
        status: "pending",
        source,
        captureId,
        imageUrl: images[0],
      };

      printQueue.push(newJob);

      void persistToCloud(String(id), images[0], {
        captureId,
        source,
        size,
        createdAt: timestamp,
      });

      return NextResponse.json({ success: true, jobId: id });
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const captureId = (formData.get("captureId") as string) || `job-${Date.now()}`;
    const source = (formData.get("source") as string) || "webbooth";
    const size = (formData.get("size") as string) || "2x6";

    if (!image || !(image instanceof Blob)) {
      return NextResponse.json({ success: false, error: "Missing image file" }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const mime = image.type || "image/jpeg";
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

    const id = Date.now();
    const timestamp = new Date().toISOString();
    const newJob: LocalPrintQueueJob = {
      id,
      images: [dataUrl],
      size,
      timestamp,
      status: "pending",
      source,
      captureId,
      imageUrl: dataUrl,
    };

    printQueue.push(newJob);

    void persistToCloud(String(id), dataUrl, {
      captureId,
      source,
      size,
      createdAt: timestamp,
    });

    return NextResponse.json({ success: true, jobId: id });
  } catch (err) {
    console.error("Print POST error:", err);
    const message = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const jobId = body?.jobId;
    const status = body?.status as LocalPrintQueueJob["status"] | undefined;
    const error = body?.error as string | undefined;

    if (!jobId || !status) {
      return NextResponse.json({ success: false, error: "Missing jobId or status" }, { status: 400 });
    }

    const job = printQueue.find((j) => j.id === Number(jobId) || String(j.id) === String(jobId));
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    job.status = status;
    if (error) job.error = error;
    if (status === "printed") job.printedAt = new Date().toISOString();

    return NextResponse.json({ success: true, jobId: job.id });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }
}
