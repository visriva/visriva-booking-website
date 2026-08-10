import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CalendarSyncSettings {
  /** Secret iCal URL from Google Calendar → Settings → Integrate calendar */
  googleIcalUrl?: string;
  syncEnabled?: boolean;
  /** Block entire day when any timed event exists (default true) */
  includeTimedEvents?: boolean;
  /** Comma-separated keywords → high demand instead of fully booked */
  highDemandKeywords?: string;
  /** Token for public export feed URL */
  exportFeedToken?: string;
  lastSyncedAt?: string;
  lastSyncEventCount?: number;
  lastSyncError?: string;
}

export const DEFAULT_CALENDAR_SYNC_SETTINGS: CalendarSyncSettings = {
  googleIcalUrl: "",
  syncEnabled: false,
  includeTimedEvents: true,
  highDemandKeywords: "hold,tentative,enquiry,inquiry,waitlist",
};

const DOC_PATH = "config/calendar_settings";

export function subscribeCalendarSettings(callback: (s: CalendarSyncSettings) => void): () => void {
  try {
    const ref = doc(db, "config", "calendar_settings");
    return onSnapshot(
      ref,
      (snap) => {
        callback(
          snap.exists()
            ? { ...DEFAULT_CALENDAR_SYNC_SETTINGS, ...(snap.data() as CalendarSyncSettings) }
            : DEFAULT_CALENDAR_SYNC_SETTINGS
        );
      },
      () => callback(DEFAULT_CALENDAR_SYNC_SETTINGS)
    );
  } catch {
    callback(DEFAULT_CALENDAR_SYNC_SETTINGS);
    return () => {};
  }
}

export async function saveCalendarSettings(
  settings: CalendarSyncSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const next = { ...settings };
    if (!next.exportFeedToken?.trim()) {
      next.exportFeedToken =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, "")
          : `visriva${Date.now()}`;
    }
    await setDoc(doc(db, "config", "calendar_settings"), next, { merge: true });
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Save failed" };
  }
}

export async function getCalendarSettings(): Promise<CalendarSyncSettings> {
  try {
    const snap = await getDoc(doc(db, "config", "calendar_settings"));
    if (snap.exists()) {
      return { ...DEFAULT_CALENDAR_SYNC_SETTINGS, ...(snap.data() as CalendarSyncSettings) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_CALENDAR_SYNC_SETTINGS;
}
