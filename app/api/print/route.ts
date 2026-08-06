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
}> = [];

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
    const formData = await request.formData();
    const image = formData.get("image");
    const captureId =
      (formData.get("captureId") as string) || `job-${Date.now()}`;
    const source = (formData.get("source") as string) || "webbooth";

    if (!image || !(image instanceof Blob)) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const mime = image.type || "image/jpeg";
    const jobId = `print-${Date.now()}`;
    const createdAt = new Date().toISOString();

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
          return NextResponse.json({
            ok: true,
            jobId,
            captureId,
            backend: "supabase",
          });
        }
        console.warn("Supabase print_jobs insert note:", insertErr.message);
      }
    }

    const base64 = buffer.toString("base64");
    const imageUrl = `data:${mime};base64,${base64}`;

    if (adminDb) {
      await adminDb.collection("print_jobs").doc(jobId).set({
        imageUrl,
        status: "pending",
        source,
        captureId,
        createdAt,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, jobId, captureId, backend: "firebase" });
    }

    inMemoryQueue.unshift({
      id: jobId,
      imageUrl,
      status: "pending",
      source,
      createdAt,
    });

    return NextResponse.json({ ok: true, jobId, captureId, backend: "memory" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Print queue failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
