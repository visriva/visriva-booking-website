/**
 * Visriva Guest Experience — event config + guest identity helpers.
 */

export interface ItineraryItem {
  id: string;
  title: string;
  description: string;
  /** ISO time or HH:mm today — combined with eventDate for "Live Now" */
  startTime: string;
  endTime: string;
  location?: string;
}

export interface VenueZone {
  id: string;
  label: string;
  /** SVG viewBox coords 0–100 */
  x: number;
  y: number;
  w: number;
  h: number;
  hint: string;
}

export interface GuestEventConfig {
  id: string;
  title: string;
  subtitle: string;
  /** YYYY-MM-DD for itinerary Live Now */
  eventDate: string;
  wifiSsid: string;
  wifiPassword: string;
  parkingNotes: string;
  itinerary: ItineraryItem[];
  venueZones: VenueZone[];
  /** Seed announcements when Supabase is offline */
  demoAnnouncements: string[];
  knowledgeBase: string;
  previewMode?: boolean;
}

export interface GuestIdentity {
  name: string;
  tableNumber: string;
  seatNumber: string;
}

export const DEMO_EVENT: GuestEventConfig = {
  id: "demo",
  title: "Visriva Live Experience",
  subtitle: "A private celebration · Bengaluru",
  eventDate: new Date().toISOString().slice(0, 10),
  wifiSsid: "Visriva-Guest",
  wifiPassword: "LiveStation2026",
  parkingNotes:
    "Valet at the porte-cochère. Self-park in Basement B2 — follow gold Visriva signs. Uber/Ola drop at Gate 2.",
  itinerary: [
    {
      id: "1",
      title: "Welcome drinks",
      description: "Signature welcome pour & soft check-in at the foyer.",
      startTime: "17:00",
      endTime: "17:45",
      location: "Foyer lounge",
    },
    {
      id: "2",
      title: "Ceremony & vows",
      description: "Main stage seating — follow ushers to your table.",
      startTime: "18:00",
      endTime: "18:45",
      location: "Main Stage",
    },
    {
      id: "3",
      title: "Visriva Photo Booth",
      description: "Instant prints & keepsakes — open all evening.",
      startTime: "18:45",
      endTime: "22:30",
      location: "Photo Booth bay",
    },
    {
      id: "4",
      title: "Dinner service",
      description: "Plated dinner begins; bar remains open.",
      startTime: "19:30",
      endTime: "21:00",
      location: "Banquet hall",
    },
    {
      id: "5",
      title: "Cake cutting",
      description: "Gather near Main Stage for the cake moment.",
      startTime: "21:15",
      endTime: "21:35",
      location: "Main Stage",
    },
    {
      id: "6",
      title: "Afterglow & dancing",
      description: "DJ set, late bites, and last photo runs.",
      startTime: "21:35",
      endTime: "23:30",
      location: "Dance floor",
    },
  ],
  venueZones: [
    { id: "stage", label: "Main Stage", x: 35, y: 8, w: 30, h: 14, hint: "Ceremony & cake" },
    { id: "booth", label: "Photo Booth", x: 72, y: 28, w: 22, h: 16, hint: "Visriva Live Station" },
    { id: "bar", label: "Bar", x: 6, y: 30, w: 18, h: 14, hint: "Open bar" },
    { id: "rest", label: "Restrooms", x: 6, y: 72, w: 18, h: 12, hint: "Lobby corridor" },
    { id: "dance", label: "Dance floor", x: 32, y: 48, w: 36, h: 22, hint: "After dinner" },
  ],
  demoAnnouncements: [
    "Welcome — the Visriva Live Station is open for keepsakes.",
    "Dinner is now being served in the banquet hall.",
    "Cake cutting in 10 minutes near the Main Stage.",
  ],
  knowledgeBase: `You are the Visriva event concierge for a luxury live-station celebration in Bengaluru.
Event: Visriva Live Experience.
WiFi: SSID Visriva-Guest / password LiveStation2026.
Parking: Valet at porte-cochère; self-park Basement B2; rideshare Gate 2.
Photo Booth: Visriva Live Station bay — open ~18:45–22:30 — instant prints.
Itinerary (local time):
- 17:00–17:45 Welcome drinks (Foyer)
- 18:00–18:45 Ceremony (Main Stage)
- 18:45–22:30 Photo Booth open
- 19:30–21:00 Dinner
- 21:15–21:35 Cake cutting (Main Stage)
- 21:35–23:30 Afterglow & dancing
Venue: Main Stage (north), Photo Booth (east), Bar (west), Restrooms (southwest lobby), Dance floor (center).
Be warm, concise, and VIP. If unsure, suggest asking a Visriva crew member or WhatsApp +91 88844 84828.`,
};

const GUEST_STORAGE_KEY = "visriva_guest_identity";

export function getEventConfig(eventId: string): GuestEventConfig {
  if (eventId === "demo" || !eventId) {
    return DEMO_EVENT;
  }
  return {
    ...DEMO_EVENT,
    id: eventId,
    title: DEMO_EVENT.title,
    previewMode: true,
    knowledgeBase: DEMO_EVENT.knowledgeBase + `\n(Preview portal for event id: ${eventId}.)`,
  };
}

export function resolveGuestFromSearchParams(
  params: URLSearchParams | { get: (k: string) => string | null }
): Partial<GuestIdentity> {
  return {
    name: params.get("name")?.trim() || undefined,
    tableNumber: params.get("table")?.trim() || undefined,
    seatNumber: params.get("seat")?.trim() || undefined,
  };
}

export function loadGuestIdentity(eventId: string): GuestIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${GUEST_STORAGE_KEY}_${eventId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestIdentity;
    if (!parsed?.name) return null;
    return {
      name: parsed.name,
      tableNumber: parsed.tableNumber || "—",
      seatNumber: parsed.seatNumber || "—",
    };
  } catch {
    return null;
  }
}

export function saveGuestIdentity(eventId: string, identity: GuestIdentity): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${GUEST_STORAGE_KEY}_${eventId}`,
    JSON.stringify({
      name: identity.name.trim(),
      tableNumber: identity.tableNumber.trim() || "—",
      seatNumber: identity.seatNumber.trim() || "—",
    })
  );
}

function parseEventDateTime(eventDate: string, hm: string): Date {
  const [h, m] = hm.split(":").map((n) => parseInt(n, 10));
  const d = new Date(`${eventDate}T00:00:00`);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export type ItineraryStatus = "upcoming" | "live" | "past";

export function getItineraryStatus(
  item: ItineraryItem,
  eventDate: string,
  now = new Date()
): ItineraryStatus {
  const start = parseEventDateTime(eventDate, item.startTime);
  const end = parseEventDateTime(eventDate, item.endTime);
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "live";
}

export function buildConciergeKnowledge(event: GuestEventConfig): string {
  return event.knowledgeBase;
}
