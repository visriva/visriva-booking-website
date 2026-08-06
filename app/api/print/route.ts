import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import {
  getSupabaseAdmin,
  isSupabaseAdminConfigured,
  PHOTOBOOTH_PRINT_BUCKET,
} from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const inMemoryQueue: Array<{
  id: string;
  imageUrl: string;
  status: string;
  source: string;
  createdAt: string;
  size?: string;
}> = [];

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  return {
    mime: match[1] || "image/jpeg",
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function enqueuePrintJob(
  buffer: Buffer,
  mime: string,
  meta: { captureId: string; source: string; size?: string }
): Promise<{ jobId: string; backend: string }> {
  const jobId = `print-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const { captureId, source, size } = meta;

  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const storagePath = `jobs/${jobId}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from(PHOTOBOOTH_PRINT_BUCKET)
        .upload(storagePath, buffer, {
          contentType: mime,
          upsert: false,
        });

      let imageUrl = `data:${mime};base64,${buffer.toString("base64")}`;
      if (!uploadErr) {
        const { data: publicData } = supabase.storage
          .from(PHOTOBOOTH_PRINT_BUCKET)
          .getPublicUrl(storagePath);
        if (publicData?.publicUrl) imageUrl = publicData.publicUrl;
      }

      const { error: insertErr } = await supabase.from("print_jobs").insert({
        id: jobId,
        image_url: imageUrl,
        storage_path: uploadErr ? null : storagePath,
        status: "pending",
        source,
        capture_id: captureId,
        created_at: createdAt,
      });

      if (!insertErr) {
        return { jobId, backend: "supabase" };
      }
      console.warn("Supabase print_jobs insert note:", insertErr.message);
    }
  }

  const imageUrl = `data:${mime};base64,${buffer.toString("base64")}`;

  if (adminDb) {
    await adminDb.collection("print_jobs").doc(jobId).set({
      imageUrl,
      status: "pending",
      source,
      captureId,
      size: size || null,
      createdAt,
      serverCreatedAt: FieldValue.serverTimestamp(),
    });
    return { jobId, backend: "firebase" };
  }

  inMemoryQueue.unshift({
    id: jobId,
    imageUrl,
    status: "pending",
    source,
    createdAt,
    size,
  });

  return { jobId, backend: "memory" };
}

export async function GET() {
  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from("print_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error && data) {
        const jobs = data.map((row) => ({
          id: row.id,
          imageUrl: row.image_url,
          status: row.status,
          source: row.source || "webbooth",
          createdAt: row.created_at,
        }));
        return NextResponse.json({
          ok: true,
          backend: "supabase",
          queueSize: jobs.filter((j) => j.status === "pending").length,
          jobs,
        });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    backend: "memory",
    queueSize: inMemoryQueue.filter((j) => j.status === "pending").length,
    jobs: inMemoryQueue.slice(0, 20),
  });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // JSON body: { images: dataUrl[], size: "2x6" } — first image used if strip pre-composed client-side
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const images = body?.images as string[] | undefined;
      const size = (body?.size as string) || "2x6";
      const captureId = (body?.captureId as string) || `job-${Date.now()}`;
      const source = (body?.source as string) || "webbooth";

      if (!images?.length) {
        return NextResponse.json({ error: "Missing images array" }, { status: 400 });
      }

      const { buffer, mime } = dataUrlToBuffer(images[0]);
      const { jobId, backend } = await enqueuePrintJob(buffer, mime, {
        captureId,
        source,
        size,
      });
      return NextResponse.json({ ok: true, jobId, captureId, size, backend });
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const captureId =
      (formData.get("captureId") as string) || `job-${Date.now()}`;
    const source = (formData.get("source") as string) || "webbooth";
    const size = (formData.get("size") as string) || undefined;

    if (!image || !(image instanceof Blob)) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const mime = image.type || "image/jpeg";
    const { jobId, backend } = await enqueuePrintJob(buffer, mime, {
      captureId,
      source,
      size,
    });

    return NextResponse.json({ ok: true, jobId, captureId, backend });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Print queue failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
