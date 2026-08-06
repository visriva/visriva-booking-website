import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const inMemoryQueue: Array<{
  id: string;
  imageUrl: string;
  status: string;
  source: string;
  createdAt: string;
}> = [];

export async function GET() {
  return NextResponse.json({
    ok: true,
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
    const base64 = buffer.toString("base64");
    const mime = image.type || "image/jpeg";
    const imageUrl = `data:${mime};base64,${base64}`;
    const jobId = `print-${Date.now()}`;

    if (adminDb) {
      await adminDb.collection("print_jobs").doc(jobId).set({
        imageUrl,
        status: "pending",
        source,
        captureId,
        createdAt: new Date().toISOString(),
        serverCreatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      inMemoryQueue.unshift({
        id: jobId,
        imageUrl,
        status: "pending",
        source,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, jobId, captureId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Print queue failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
