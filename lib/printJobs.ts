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

export type PrintJobStatus = "pending" | "printing" | "printed" | "failed";

export interface PrintJob {
  id: string;
  imageUrl: string;
  status: PrintJobStatus;
  source: string;
  createdAt?: string;
  printedAt?: string;
  error?: string;
}

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
  if (isSupabaseConfigured()) {
    return subscribePrintJobsSupabase(callback, statusFilter);
  }
  return subscribePrintJobsFirebase(callback, statusFilter);
}

function subscribePrintJobsSupabase(
  callback: (jobs: PrintJob[]) => void,
  statusFilter?: PrintJobStatus
): () => void {
  const supabase = getSupabaseBrowser();
  if (!supabase) return () => {};

  let active = true;

  const load = async () => {
    const { data, error } = await supabase
      .from("print_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!active || error) {
      if (error) console.warn("Supabase print_jobs fetch:", error.message);
      return;
    }

    let jobs = (data as SupabasePrintJobRow[]).map(mapSupabaseRow);
    if (statusFilter) jobs = jobs.filter((j) => j.status === statusFilter);
    callback(jobs);
  };

  void load();

  const channel = supabase
    .channel("visriva-print-jobs")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "print_jobs" },
      () => void load()
    )
    .subscribe();

  return () => {
    active = false;
    void supabase.removeChannel(channel);
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
  await updateDoc(doc(db, "print_jobs", jobId), payload);
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
  return data.jobId || captureId;
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
        const blob = await resolvePrintJobBlob(imageUrl);
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

/** Resolve a print job image URL (data URL or remote) to a Blob for USB print server. */
export async function resolvePrintJobBlob(imageUrl: string): Promise<Blob> {
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
