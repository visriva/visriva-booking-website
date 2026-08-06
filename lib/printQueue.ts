/** Shared types for the local event print buffer (/api/print). */

export type PrintJobStatus = "pending" | "printing" | "printed" | "failed";

export interface LocalPrintQueueJob {
  id: number;
  images: string[];
  size: string;
  timestamp: string;
  status: PrintJobStatus;
  source: string;
  captureId?: string;
  imageUrl?: string;
  error?: string;
  printedAt?: string;
}

export interface PrintJob {
  id: string;
  imageUrl: string;
  images?: string[];
  size?: string;
  status: PrintJobStatus;
  source: string;
  createdAt?: string;
  printedAt?: string;
  error?: string;
}

export function localJobToPrintJob(job: LocalPrintQueueJob): PrintJob {
  return {
    id: String(job.id),
    imageUrl: job.imageUrl || job.images[0] || "",
    images: job.images,
    size: job.size,
    status: job.status,
    source: job.source,
    createdAt: job.timestamp,
    printedAt: job.printedAt,
    error: job.error,
  };
}
