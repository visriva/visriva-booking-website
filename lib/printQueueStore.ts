import fs from "fs";
import path from "path";
import type { LocalPrintQueueJob } from "@/lib/printQueue";

const QUEUE_FILE = path.join(process.cwd(), ".print-queue.json");
const MAX_JOBS = 120;

export function loadPrintQueue(): LocalPrintQueueJob[] {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      const raw = fs.readFileSync(QUEUE_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as LocalPrintQueueJob[];
    }
  } catch (err) {
    console.warn("[printQueueStore] load failed:", err);
  }
  return [];
}

export function savePrintQueue(queue: LocalPrintQueueJob[]): void {
  try {
    const trimmed = queue.slice(-MAX_JOBS);
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("[printQueueStore] save failed:", err);
  }
}
