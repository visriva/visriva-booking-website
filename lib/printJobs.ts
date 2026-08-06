import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getSupabaseBrowser,
  isSupabaseConfigured,
  SupabasePrintJobRow,
} from "@/lib/supabase";
import { localJobToPrintJob, PrintJob, PrintJobStatus } from "@/lib/printQueue";
import { compose2x6Strip } from "@/lib/composeStrip";

export type { PrintJob, PrintJobStatus };

function mapSupabaseRow(row: SupabasePrintJobRow): PrintJob {
  return {
    id: row.id,
    imageUrl: row.image_url,
    status: row.status,
    source: row.source || "webbooth",
    createdAt: row.created_at,
    printedAt: row.printed_at || undefined,
    error: row.error || undefined,
  };
}

export function getPrintApiBase(): string {
  if (typeof window === "undefined") return "";
  const envUrl = process.env.NEXT_PUBLIC_PRINT_API_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  return "";
}

export function getPrintServerUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_PRINT_SERVER_URL?.trim();
  return envUrl ? envUrl.replace(/\/$/, "") : "http://localhost:3847";
}

export function subscribePrintJobs(
  callback: (jobs: PrintJob[]) => void,
  statusFilter?: PrintJobStatus
): () => void {
  let active = true;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let cloudUnsub: (() => void) | null = null;

  const applyFilter = (jobs: PrintJob[]) => {
    if (statusFilter) return jobs.filter((j) => j.status === statusFilter);
    return jobs;
  };

  const pollLocalQueue = async () => {
    try {
      const base = getPrintApiBase();
      const url = base ? `${base}/api/print` : "/api/print";
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const raw = data.jobs as Array<{
        id: number;
        images: string[];
        size: string;
        timestamp: string;
        status: PrintJobStatus;
        source: string;
        imageUrl?: string;
        error?: string;
        printedAt?: string;
      }>;
      if (!active || !Array.isArray(raw)) return;
      const jobs = applyFilter(raw.map((j) => localJobToPrintJob(j)));
      callback(jobs);
    } catch {
      // local queue poll is best-effort
    }
  };

  void pollLocalQueue();
  pollTimer = setInterval(() => void pollLocalQueue(), 2500);

  if (isSupabaseConfigured()) {
    cloudUnsub = subscribePrintJobsSupabase((jobs) => {
      if (active) callback(applyFilter(jobs));
    }, statusFilter);
  } else {
    cloudUnsub = subscribePrintJobsFirebase((jobs) => {
      if (active && jobs.length > 0) callback(applyFilter(jobs));
    }, statusFilter);
  }

  return () => {
    active = false;
    if (pollTimer) clearInterval(pollTimer);
    if (cloudUnsub) cloudUnsub();
  };
}

function subscribePrintJobsSupabase(
  callback: (jobs: PrintJob[]) => void,
  statusFilter?: PrintJobStatus
): () => void {
  const supabase = getSupabaseBrowser();
  if (!supabase) return () => {};

  let active = true;

  type SharedRealtime = {
    channel: ReturnType<NonNullable<ReturnType<typeof getSupabaseBrowser>>["channel"]>;
    listeners: Set<(jobs: PrintJob[]) => void>;
    jobs: PrintJob[];
  };

  const sharedKey = "__visrivaSupabasePrintRealtime";
  const win = typeof window !== "undefined" ? window : null;
  let shared = win
    ? ((win as unknown as Record<string, SharedRealtime | undefined>)[sharedKey] ?? null)
    : null;

  const deliver = (allJobs: PrintJob[]) => {
    if (!active) return;
    callback(statusFilter ? allJobs.filter((j) => j.status === statusFilter) : allJobs);
  };

  const refresh = async () => {
    const { data, error } = await supabase
      .from("print_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("Supabase print_jobs fetch:", error.message);
      return;
    }

    const jobs = (data as SupabasePrintJobRow[]).map(mapSupabaseRow);
    if (shared) {
      shared.jobs = jobs;
      shared.listeners.forEach((listener) => listener(jobs));
    }
  };

  if (!shared) {
    const channel = supabase
      .channel(`visriva-print-jobs-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "print_jobs" },
        () => void refresh()
      )
      .subscribe();

    shared = { channel, listeners: new Set(), jobs: [] };
    if (win) (win as unknown as Record<string, SharedRealtime>)[sharedKey] = shared;
    void refresh();
  }

  shared.listeners.add(deliver);
  deliver(shared.jobs);

  return () => {
    active = false;
    if (!shared) return;
    shared.listeners.delete(deliver);
    if (shared.listeners.size === 0) {
      void supabase.removeChannel(shared.channel);
      if (win) delete (win as unknown as Record<string, SharedRealtime | undefined>)[sharedKey];
    }
  };
}

function subscribePrintJobsFirebase(
  callback: (jobs: PrintJob[]) => void,
  statusFilter?: PrintJobStatus
): () => void {
  try {
    const q = query(collection(db, "print_jobs"), limit(50));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        let jobs: PrintJob[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<PrintJob, "id">),
        }));
        if (statusFilter) {
          jobs = jobs.filter((j) => j.status === statusFilter);
        }
        jobs.sort((a, b) => {
          const ta = a.createdAt || "";
          const tb = b.createdAt || "";
          return tb.localeCompare(ta);
        });
        callback(jobs);
      },
      (err) => {
        console.warn("print_jobs snapshot warning:", err.message);
        callback([]);
      }
    );
    return unsub;
  } catch (e) {
    console.warn("subscribePrintJobs fallback:", e);
    return () => {};
  }
}

export async function markPrintJobStatus(
  jobId: string,
  status: PrintJobStatus,
  extra?: { error?: string }
): Promise<void> {
  try {
    const base = getPrintApiBase();
    const url = base ? `${base}/api/print` : "/api/print";
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, status, error: extra?.error }),
    });
    if (res.ok) return;
  } catch {
    // fall through to cloud backends
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      const payload: Record<string, string> = { status };
      if (status === "printed") payload.printed_at = new Date().toISOString();
      if (extra?.error) payload.error = extra.error;

      const { error } = await supabase.from("print_jobs").update(payload).eq("id", jobId);
      if (!error) return;
      console.warn("Supabase markPrintJobStatus note:", error.message);
    }
  }

  const payload = {
    status,
    ...(status === "printed" ? { printedAt: new Date().toISOString() } : {}),
    ...(extra?.error ? { error: extra.error } : {}),
  };

  try {
    await updateDoc(doc(db, "print_jobs", jobId), payload);
  } catch (e) {
    console.warn("Firebase markPrintJobStatus note:", e);
  }
}

export async function sendImageToPrintEndpoint(blob: Blob, captureId: string): Promise<string> {
  const form = new FormData();
  form.append("image", blob, `${captureId}.jpg`);
  form.append("captureId", captureId);
  form.append("source", "webbooth");

  const base = getPrintApiBase();
  const url = base ? `${base}/api/print` : "/api/print";
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Print request failed (${res.status})`);
  }
  const data = await res.json();
  return String(data.jobId || data.captureId || captureId);
}

/** POST raw shot array as JSON to the local print router (iPad → print node). */
export async function sendImagesToPrintEndpoint(
  images: string[],
  size = "2x6"
): Promise<string> {
  const base = getPrintApiBase();
  const url = base ? `${base}/api/print` : "/api/print";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images, size, source: "webbooth" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Print request failed (${res.status})`);
  }
  const data = await res.json();
  return String(data.jobId || Date.now());
}

/** Resolve print blob — composes 2x6 strip when job has multiple shots. */
export async function resolvePrintJobBlob(job: PrintJob): Promise<Blob> {
  if (job.images && job.images.length > 1 && job.size === "2x6") {
    return compose2x6Strip(job.images);
  }
  return resolveImageUrlBlob(job.imageUrl);
}

async function resolveImageUrlBlob(imageUrl: string): Promise<Blob> {
  if (imageUrl.startsWith("data:")) {
    const [header, base64] = imageUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to load print image (${res.status})`);
  return res.blob();
}

export async function sendToLocalPrintServer(blob: Blob, captureId: string): Promise<void> {
  const form = new FormData();
  form.append("image", blob, `${captureId}.png`);
  form.append("captureId", captureId);

  const res = await fetch(`${getPrintServerUrl()}/print`, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Print server error (${res.status})`);
  }
}

export async function checkPrintServerHealth(): Promise<{
  ok: boolean;
  printer?: string | null;
  note?: string;
}> {
  try {
    const res = await fetch(`${getPrintServerUrl()}/health`);
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: Boolean(data.ok), printer: data.printer, note: data.note };
  } catch {
    return { ok: false };
  }
}

export async function printImageViaBrowser(imageUrl: string): Promise<void> {
  const printUrl = imageUrl.startsWith("data:")
    ? imageUrl
    : await (async () => {
        const blob = await resolveImageUrlBlob(imageUrl);
        return URL.createObjectURL(blob);
      })();

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) throw new Error("Print iframe unavailable");

  doc.open();
  doc.write(`
    <html>
      <head>
        <title>Visriva Print</title>
        <style>
          @page { margin: 0; size: auto; }
          body { margin: 0; display: flex; justify-content: center; align-items: center; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <img src="${printUrl}" />
      </body>
    </html>
  `);
  doc.close();

  await new Promise<void>((resolve) => setTimeout(resolve, 500));
  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();

  setTimeout(() => {
    document.body.removeChild(iframe);
    if (printUrl !== imageUrl) URL.revokeObjectURL(printUrl);
  }, 2000);
}

export { resolveImageUrlBlob };
