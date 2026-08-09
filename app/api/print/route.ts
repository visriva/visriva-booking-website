import { NextRequest, NextResponse } from "next/server";
import type { LocalPrintQueueJob } from "@/lib/printQueue";
import { loadPrintQueue, savePrintQueue } from "@/lib/printQueueStore";

export const runtime = "nodejs";

/** Local event print buffer — persisted to .print-queue.json on the laptop. */
let printQueue: LocalPrintQueueJob[] = loadPrintQueue();

function persistQueue() {
  savePrintQueue(printQueue);
}

function mirrorToCloud(
  jobId: string,
  imageUrl: string,
  meta: { captureId: string; source: string; size: string; createdAt: string }
) {
  void import("@/lib/printCloudPersist")
    .then((mod) => mod.persistPrintJobToCloud(jobId, imageUrl, meta))
    .catch((err) => console.warn("Cloud print mirror note:", err));
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
      persistQueue();
      mirrorToCloud(String(id), images[0], { captureId, source, size, createdAt: timestamp });

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
    persistQueue();
    mirrorToCloud(String(id), dataUrl, { captureId, source, size, createdAt: timestamp });

    return NextResponse.json({ success: true, jobId: id });
  } catch (err) {
    console.error("Print POST error:", err);
    const message = err instanceof Error ? err.message : "Print queue failed";
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
    persistQueue();

    return NextResponse.json({ success: true, jobId: job.id });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }
}
