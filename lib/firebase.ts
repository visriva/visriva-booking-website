import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";

const isDummyKey = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "AIzaSyDummyKeyForDevelopment";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevelopment",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "visriva-live-station.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "visriva-live-station",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "visriva-live-station.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

if (typeof window !== "undefined") {
  console.log("Firebase Config Loaded:", !isDummyKey ? "Cloud Firestore Active" : "Local Storage CMS Active");
}

// Initialize Firebase App & Services
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Canvas-based client-side image compressor with HEIC/HEIF iPhone photo format converter
export async function compressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<string> {
  let targetFile: Blob = file;

  const isHeic =
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif") ||
    file.type.toLowerCase().includes("heic") ||
    file.type.toLowerCase().includes("heif");

  if (isHeic && typeof window !== "undefined") {
    try {
      const heic2any = (await import("heic2any")).default;
      const inputBlob = new Blob([file], { type: "image/heic" });
      const converted = await heic2any({
        blob: inputBlob,
        toType: "image/jpeg",
        quality: 0.85,
      });
      targetFile = Array.isArray(converted) ? converted[0] : converted;
    } catch (heicErr: any) {
      console.warn("heic2any conversion note:", heicErr?.message || heicErr);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      // If dataUrl is still raw HEIC (e.g. conversion failed in non-Safari browser), reject explicitly
      if (dataUrl.startsWith("data:image/heic") || dataUrl.startsWith("data:image/heif")) {
        // Attempt one more conversion attempt or reject
        reject(new Error("Unable to decode HEIC format. Please convert photo to JPG/PNG or try again."));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        if (isHeic) {
          reject(new Error("Unable to decode HEIC image. Please try JPG/PNG format."));
        } else {
          resolve(dataUrl);
        }
      };

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };

      img.src = dataUrl;
    };
    reader.readAsDataURL(targetFile);
  });
}

export interface BookingLead {
  eventDate: string;
  venue: string;
  eventType: string;
  reportingTime?: string;
  endingTime?: string;
  pax: number;
  services: string[];
  estimatedBudget: string;
  tier: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  customHashtag?: string;
  clientLogoUrl?: string;
  companyName?: string;
  companyGstin?: string;
  isGstInvoice?: boolean;
  status?: string; // e.g. "NEW_LEAD" | "QUOTE_SENT" | "DEPOSIT_PAID" | "CONFIRMED" | "COMPLETED"
  createdAt?: unknown;
}

export interface PortfolioImage {
  id: string;
  url: string;
  title: string;
  location: string;
  categorySlug: "photo-booth" | "magnets" | "keychains" | "mugs";
  categoryName: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  price: number;
  duration: string;
  subtitle?: string;
  popular?: boolean;
  features: string[];
}

export interface ServicePricingMatrix {
  packages: ServicePackage[];
  idleHourlyRate: number;
}

export interface PhotoBoothServiceMatrix {
  packages: ServicePackage[];
  dslrPackages: ServicePackage[];
  ipadPackages: ServicePackage[];
  idleHourlyRate: number;
}

export interface GalleryItem {
  id: string;
  category: "photo-booth" | "magnet-station" | "keychain-station" | "mug-printing";
  url: string;
  tagline: string;
  createdAt?: unknown;
}

export interface GalleryVisibilityConfig {
  isGlobalGalleryVisible?: boolean;
  isPhotoBoothGalleryVisible: boolean;
  isMagnetGalleryVisible: boolean;
  isKeychainGalleryVisible: boolean;
  isMugGalleryVisible: boolean;
}

export const DEFAULT_VISIBILITY_CONFIG: GalleryVisibilityConfig = {
  isGlobalGalleryVisible: true,
  isPhotoBoothGalleryVisible: true,
  isMagnetGalleryVisible: true,
  isKeychainGalleryVisible: true,
  isMugGalleryVisible: true,
};

export interface PrintPreviewerConfig {
  isVisible: boolean;
  defaultSize: "4x6" | "2x6" | "3x4" | "2x4" | "custom";
  customWidthRatio?: number;
  customHeightRatio?: number;
  previewImageUrl: string;
  customWatermarkText: string;
  customNotes?: string;
}

export const DEFAULT_PRINT_PREVIEWER_CONFIG: PrintPreviewerConfig = {
  isVisible: true,
  defaultSize: "4x6",
  previewImageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  customWatermarkText: "Visriva Live",
  customNotes: "8-Sec Dye-Sublimation Heat Transfer",
};

export interface GlobalSettingsConfig {
  contactEmail: string;
  phoneNumber: string;
  physicalAddress: string;
  linkedinUrl: string;
  instagramUrl?: string;
  whatsappNumber?: string;
  whatsappLogoLink?: string;
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettingsConfig = {
  contactEmail: "jeevanbm48@gmail.com",
  phoneNumber: "+91 88844 84828",
  physicalAddress: "Bengaluru, Karnataka, India",
  linkedinUrl: "https://linkedin.com/company/visriva",
  instagramUrl: "https://instagram.com/visriva.live",
  whatsappNumber: "918884484828",
  whatsappLogoLink: "https://wa.me/918884484828?text=Hello%20Visriva%20Live%20Station%2C%20I%20would%20like%20to%20inquire%20about%20booking",
};

export interface WebsiteTextConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;
  aboutText: string;
  footerDescription: string;
  whatsIncludedBadge?: string;
  whatsIncludedTitle?: string;
  whatsIncludedSubtitle?: string;
  whatsIncludedImageUrl?: string;
}

export const DEFAULT_WEBSITE_TEXT: WebsiteTextConfig = {
  heroTitle: "Visriva Live Station",
  heroSubtitle: "Instant Photo Booths & Live Experiential Stations for Luxury Events",
  heroTagline: "Bengaluru's Premier Live Event Station",
  aboutText: "Visriva Live Station brings luxury event technology to Bengaluru. Transform weddings, corporate galas, and VIP activations with studio-grade photo booths, custom magnets, keychains, and live mug printing.",
  footerDescription: "Elevating luxury celebrations, weddings, and corporate galas across Bengaluru with high-speed dye-sublimation print engines and live interactive stations.",
  whatsIncludedBadge: "Signature Station",
  whatsIncludedTitle: "Vintage Wooden Booth Setup",
  whatsIncludedSubtitle: "Studio Strobe Lighting • 8-Sec Thermal Dye-Sublimation",
  whatsIncludedImageUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
};

export interface GlobalPricingMatrix {
  photoBooth: PhotoBoothServiceMatrix;
  magnets: ServicePricingMatrix;
  mugs: ServicePricingMatrix;
  keychains: ServicePricingMatrix;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  portfolioEnabled: boolean;
  portfolioImages: PortfolioImage[];
  uploadedUrls: string[];
  visibility?: GalleryVisibilityConfig;
}

export const DEFAULT_PRICING_MATRIX: GlobalPricingMatrix = {
  heroTitle: "Elevate Every Moment",
  heroSubtitle: "Instant Photo Booth • Custom Magnets • Keychains • Mugs",
  heroDescription:
    "Transform weddings, corporate galas, and VIP activations across India into unforgettable luxury experiences. Studio-grade photography delivered on-site within 8 seconds.",
  photoBooth: {
    idleHourlyRate: 1500,
    packages: [
      {
        id: "pb_essential",
        name: "Essential",
        price: 10000,
        duration: "3 Hours",
        subtitle: "3 Hours · No Printing",
        popular: false,
        features: [
          "3 Hours Coverage",
          "Custom Digital Frame",
          "Custom Welcome Screen",
          "AirDrop + QR Sharing",
          "Booth Assistant",
        ],
      },
      {
        id: "pb_classic",
        name: "Classic",
        price: 15000,
        duration: "3 Hours",
        subtitle: "3 Hours · 150 Prints",
        popular: false,
        features: [
          "3 Hours Coverage",
          "Custom Digital Frame",
          "Custom Welcome Screen",
          "AirDrop + QR Sharing",
          "Booth Assistant",
          "150 Instant Prints",
        ],
      },
      {
        id: "pb_premium",
        name: "Premium",
        price: 20000,
        duration: "4 Hours",
        subtitle: "4 Hours · 400 Prints",
        popular: true,
        features: [
          "4 Hours Coverage",
          "Custom Digital Frame",
          "Custom Welcome Screen",
          "AirDrop + QR Sharing",
          "Booth Assistant",
          "400 Instant Prints",
        ],
      },
      {
        id: "pb_unlimited",
        name: "Unlimited",
        price: 25000,
        duration: "4 Hours",
        subtitle: "4 Hours · Unlimited Prints",
        popular: false,
        features: [
          "4 Hours Coverage",
          "Custom Digital Frame",
          "Custom Welcome Screen",
          "AirDrop + QR Sharing",
          "Booth Assistant",
          "Unlimited Instant Prints",
        ],
      },
    ],
    dslrPackages: [
      {
        id: "dslr_essential",
        name: "Essential DSLR",
        price: 10000,
        duration: "3 Hours",
        subtitle: "3 Hours · Full-Frame Studio DSLR",
        popular: false,
        features: [
          "3 Hours Coverage",
          "Studio Strobe Lighting",
          "Custom Digital Frame",
          "AirDrop + QR Sharing",
          "Booth Assistant",
        ],
      },
      {
        id: "dslr_classic",
        name: "Classic DSLR",
        price: 15000,
        duration: "3 Hours",
        subtitle: "3 Hours · 150 High-Gloss Prints",
        popular: false,
        features: [
          "3 Hours Coverage",
          "Studio Strobe Lighting",
          "Custom Digital Frame",
          "150 High-Gloss Prints",
          "Booth Assistant",
        ],
      },
      {
        id: "dslr_premium",
        name: "Premium DSLR",
        price: 20000,
        duration: "4 Hours",
        subtitle: "4 Hours · 400 High-Gloss Prints",
        popular: true,
        features: [
          "4 Hours Coverage",
          "Studio Strobe Lighting",
          "Custom Digital Frame",
          "400 High-Gloss Prints",
          "Booth Assistant",
        ],
      },
      {
        id: "dslr_unlimited",
        name: "Unlimited DSLR",
        price: 25000,
        duration: "4 Hours",
        subtitle: "4 Hours · Unlimited Prints",
        popular: false,
        features: [
          "4 Hours Coverage",
          "Studio Strobe Lighting",
          "Custom Digital Frame",
          "Unlimited Instant Prints",
          "Booth Assistant",
        ],
      },
    ],
    ipadPackages: [
      {
        id: "ipad_digital",
        name: "Digital iPad Ring Light",
        price: 8000,
        duration: "3 Hours",
        subtitle: "3 Hours · Digital Only",
        popular: false,
        features: [
          "3 Hours Coverage",
          "Ring Light Illumination",
          "Instant AirDrop & QR Code",
          "Custom Branding Frame",
          "Booth Assistant",
        ],
      },
      {
        id: "ipad_classic",
        name: "Classic iPad Booth",
        price: 12000,
        duration: "3 Hours",
        subtitle: "3 Hours · 100 Instant Prints",
        popular: true,
        features: [
          "3 Hours Coverage",
          "Ring Light Illumination",
          "100 Instant Prints",
          "AirDrop + QR Sharing",
          "Booth Assistant",
        ],
      },
      {
        id: "ipad_unlimited",
        name: "Unlimited iPad Booth",
        price: 18000,
        duration: "4 Hours",
        subtitle: "4 Hours · Unlimited Prints",
        popular: false,
        features: [
          "4 Hours Coverage",
          "Ring Light Illumination",
          "Unlimited Instant Prints",
          "AirDrop + QR Sharing",
          "Booth Assistant",
        ],
      },
    ],
  },
  magnets: {
    idleHourlyRate: 1500,
    packages: [
      {
        id: "mag_100",
        name: "Classic Magnet Package",
        price: 25000,
        duration: "3 Hours",
        subtitle: "3 Hours · 100 Magnets",
        features: [
          "100 Custom Fridge Magnets",
          "High-Gloss Acrylic Finish",
          "On-Site Live Assembly",
          "Digital Copies Included",
        ],
      },
      {
        id: "mag_150",
        name: "Premium Magnet Package",
        price: 33000,
        duration: "4 Hours",
        subtitle: "4 Hours · 150 Magnets",
        features: [
          "150 Custom Fridge Magnets",
          "High-Gloss Acrylic Finish",
          "On-Site Live Assembly",
          "VIP Custom Frame Overlay",
        ],
      },
    ],
  },
  mugs: {
    idleHourlyRate: 1500,
    packages: [
      {
        id: "mug_50",
        name: "Live Mug Package",
        price: 15000,
        duration: "3 Hours",
        subtitle: "3 Hours · 50 Ceramic Mugs",
        features: [
          "50 Sublimation Ceramic Mugs",
          "Live Dye-Sub Heat Press",
          "Custom Branding Overlays",
          "Individual Protective Box",
        ],
      },
      {
        id: "mug_100",
        name: "VIP Mug Package",
        price: 25000,
        duration: "4 Hours",
        subtitle: "4 Hours · 100 Ceramic Mugs",
        features: [
          "100 Sublimation Ceramic Mugs",
          "Live Dye-Sub Heat Press",
          "Custom Branding Overlays",
          "Individual Gift Wrapping",
        ],
      },
    ],
  },
  keychains: {
    idleHourlyRate: 1500,
    packages: [
      {
        id: "kc_50",
        name: "Metal Keychain Package",
        price: 16000,
        duration: "3 Hours",
        subtitle: "3 Hours · 50 Metal Keychains",
        features: [
          "50 Bespoke Metal Keychains",
          "Instant Photo Insertion",
          "Custom Brand Engraving",
          "Dedicated Attendant",
        ],
      },
      {
        id: "kc_100",
        name: "Corporate Keychain Package",
        price: 25000,
        duration: "4 Hours",
        subtitle: "4 Hours · 100 Metal Keychains",
        features: [
          "100 Bespoke Metal Keychains",
          "Instant Photo Insertion",
          "Custom Brand Engraving",
          "VIP Gift Box Packaging",
        ],
      },
    ],
  },
  portfolioEnabled: true,
  portfolioImages: [
    {
      id: "pb-1",
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      title: "The Leela Palace Wedding",
      location: "HAL Old Airport Rd, Bengaluru",
      categoryName: "Photo Booth",
      categorySlug: "photo-booth",
    },
    {
      id: "mag-1",
      url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
      title: "Taj West End Magnet Station",
      location: "Race Course Rd, Bengaluru",
      categoryName: "Custom Magnets",
      categorySlug: "magnets",
    },
    {
      id: "kc-1",
      url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
      title: "Tech Corporate Offsite Keychains",
      location: "JW Marriott Bengaluru",
      categoryName: "Metal Keychains",
      categorySlug: "keychains",
    },
    {
      id: "mug-1",
      url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80",
      title: "Shangri-La Live Sublimation Mugs",
      location: "Palace Rd, Bengaluru",
      categoryName: "Live Mugs",
      categorySlug: "mugs",
    },
  ],
  uploadedUrls: [],
};

// Legacy compatibility aliases
export type GlobalSiteSettings = GlobalPricingMatrix;
export type SiteSettings = GlobalPricingMatrix;
export const DEFAULT_SITE_SETTINGS = DEFAULT_PRICING_MATRIX;

/**
 * Save booking lead payload to Firebase Firestore 'bookings' collection.
 */
export async function saveBookingLead(
  lead: BookingLead
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const isConfigured = Boolean(
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    );

    if (!isConfigured) {
      console.warn("⚠️ Firebase environment variables missing. Simulated mode active.");
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        success: true,
        id: "demo-lead-" + Date.now(),
      };
    }

    const docRef = await addDoc(collection(db, "bookings"), {
      ...lead,
      createdAt: serverTimestamp(),
      status: "NEW_LEAD",
    });

    return {
      success: true,
      id: docRef.id,
    };
  } catch (error: unknown) {
    console.error("Firestore save error:", error);
    const errMessage =
      error instanceof Error ? error.message : "Failed to record booking inquiry.";
    return {
      success: false,
      error: errMessage,
    };
  }
}

export async function updateLeadStatus(
  leadId: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, "bookings", leadId);
    await setDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update lead status" };
  }
}

export function subscribeBookingLeads(
  callback: (leads: Array<BookingLead & { id: string }>) => void
): () => void {
  try {
    const colRef = collection(db, "bookings");
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as BookingLead),
        }));
        callback(list);
      },
      (err) => console.warn("Leads snapshot warning:", err.message)
    );
  } catch (e) {
    return () => {};
  }
}

/**
 * Single Source of Truth Firestore Reader (config/pricing_matrix & config/global_settings)
 * with onSnapshot real-time sync, localStorage sync & event listeners.
 */
export function subscribePricingMatrix(
  callback: (matrix: GlobalPricingMatrix) => void
): () => void {
  let lastKnownTs = "";

  const loadLocal = () => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("visriva_pricing_matrix") || localStorage.getItem("visriva_global_settings");
      if (local) {
        try {
          const parsed = JSON.parse(local);
          callback({
            ...DEFAULT_PRICING_MATRIX,
            ...parsed,
            photoBooth: { ...DEFAULT_PRICING_MATRIX.photoBooth, ...(parsed.photoBooth || {}) },
            magnets: { ...DEFAULT_PRICING_MATRIX.magnets, ...(parsed.magnets || {}) },
            mugs: { ...DEFAULT_PRICING_MATRIX.mugs, ...(parsed.mugs || {}) },
            keychains: { ...DEFAULT_PRICING_MATRIX.keychains, ...(parsed.keychains || {}) },
          });
        } catch (e) {
          // ignore parse error
        }
      }
    }
  };

  loadLocal();
  if (typeof window !== "undefined") {
    lastKnownTs = localStorage.getItem("visriva_pricing_ts") || "";
  }

  // Listen to local window storage events & custom pricing_updated events for instant sync
  const handleUpdate = () => {
    loadLocal();
    if (typeof window !== "undefined") {
      lastKnownTs = localStorage.getItem("visriva_pricing_ts") || "";
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("pricing_updated", handleUpdate);
  }

  // Polling fallback: every 4 seconds check if pricing timestamp changed (cross-tab guarantee)
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  if (typeof window !== "undefined") {
    pollInterval = setInterval(() => {
      const currentTs = localStorage.getItem("visriva_pricing_ts") || "";
      if (currentTs !== lastKnownTs) {
        lastKnownTs = currentTs;
        loadLocal();
      }
    }, 4000);
  }

  if (isDummyKey) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("pricing_updated", handleUpdate);
      }
      if (pollInterval) clearInterval(pollInterval);
    };
  }

  const unsubscribers: Array<() => void> = [];

  try {
    const docRefPrimary = doc(db, "config", "pricing_matrix");
    const unsubPrimary = onSnapshot(
      docRefPrimary,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const merged: GlobalPricingMatrix = {
            ...DEFAULT_PRICING_MATRIX,
            ...data,
            photoBooth: { ...DEFAULT_PRICING_MATRIX.photoBooth, ...(data.photoBooth || {}) },
            magnets: { ...DEFAULT_PRICING_MATRIX.magnets, ...(data.magnets || {}) },
            mugs: { ...DEFAULT_PRICING_MATRIX.mugs, ...(data.mugs || {}) },
            keychains: { ...DEFAULT_PRICING_MATRIX.keychains, ...(data.keychains || {}) },
          };
          callback(merged);
          if (typeof window !== "undefined") {
            localStorage.setItem("visriva_pricing_matrix", JSON.stringify(merged));
            localStorage.setItem("visriva_global_settings", JSON.stringify(merged));
          }
        }
      },
      (err) => console.warn("Firestore primary snapshot warning:", err.message)
    );
    unsubscribers.push(unsubPrimary);
  } catch (err) {
    console.warn("Firestore snapshot subscription error:", err);
  }

  try {
    const docRefSecondary = doc(db, "config", "global_settings");
    const unsubSecondary = onSnapshot(
      docRefSecondary,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const merged: GlobalPricingMatrix = {
            ...DEFAULT_PRICING_MATRIX,
            ...data,
            photoBooth: { ...DEFAULT_PRICING_MATRIX.photoBooth, ...(data.photoBooth || {}) },
            magnets: { ...DEFAULT_PRICING_MATRIX.magnets, ...(data.magnets || {}) },
            mugs: { ...DEFAULT_PRICING_MATRIX.mugs, ...(data.mugs || {}) },
            keychains: { ...DEFAULT_PRICING_MATRIX.keychains, ...(data.keychains || {}) },
          };
          callback(merged);
        }
      },
      (err) => console.warn("Firestore secondary snapshot warning:", err.message)
    );
    unsubscribers.push(unsubSecondary);
  } catch (err) {
    // optional secondary listener
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("pricing_updated", handleUpdate);
    }
    if (pollInterval) clearInterval(pollInterval);
  };
}

// Aliases
export const subscribeGlobalSettings = subscribePricingMatrix;
export const subscribeSiteSettings = subscribePricingMatrix;

/**
 * Single Source of Truth Firestore Writer (config/pricing_matrix & config/global_settings)
 * with robust Promise.allSettled cloud sync and instant local storage backup.
 */
export async function savePricingMatrix(
  matrix: Partial<GlobalPricingMatrix>
): Promise<{ success: boolean; firestoreSynced?: boolean; error?: string }> {
  // CRITICAL SANITIZATION: Deep clone & strip undefined values to prevent Firestore silent rejections
  const sanitizedPayload = JSON.parse(JSON.stringify(matrix));

  // Step 1: Instantly update localStorage & dispatch events for same-tab Booking Engine
  const pricingTs = Date.now().toString();
  if (typeof window !== "undefined") {
    try {
      const existing = localStorage.getItem("visriva_pricing_matrix") || localStorage.getItem("visriva_global_settings");
      const current = existing ? JSON.parse(existing) : DEFAULT_PRICING_MATRIX;
      const merged = { ...current, ...sanitizedPayload };
      localStorage.setItem("visriva_pricing_matrix", JSON.stringify(merged));
      localStorage.setItem("visriva_global_settings", JSON.stringify(merged));
      // Timestamp key — lets the polling fallback in other tabs detect changes
      localStorage.setItem("visriva_pricing_ts", pricingTs);
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("pricing_updated"));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  }

  // Step 2: Write to Firestore — no arbitrary timeout, let it complete fully
  // so the onSnapshot listeners in other browser tabs/pages fire reliably
  try {
    const docRef1 = doc(db, "config", "pricing_matrix");
    const docRef2 = doc(db, "config", "global_settings");
    const docRef3 = doc(db, "site_content", "pricing_matrix");

    const results = await Promise.allSettled([
      setDoc(docRef1, sanitizedPayload, { merge: true }),
      setDoc(docRef2, sanitizedPayload, { merge: true }),
      setDoc(docRef3, sanitizedPayload, { merge: true }),
    ]);

    const anyFulfilled = results.some((r) => r.status === "fulfilled");

    // Step 3: After Firestore write — update timestamp again & re-dispatch for cross-tab polling
    if (anyFulfilled && typeof window !== "undefined") {
      const finalTs = Date.now().toString();
      localStorage.setItem("visriva_pricing_ts", finalTs);
      window.dispatchEvent(new Event("pricing_updated"));
    }

    return { success: true, firestoreSynced: anyFulfilled };
  } catch (e: unknown) {
    console.warn("Firestore setDoc warning (saved locally to storage):", e);
    return { success: true, firestoreSynced: false };
  }
}

// Aliases
export const saveGlobalSettings = savePricingMatrix;
export const saveSiteSettings = savePricingMatrix;

/**
 * ATOMIC & FLAT FIRESTORE WRITER: Writes directly to collection("services").doc(serviceKey)
 */
export async function saveServiceDoc(
  serviceKey: "photoBooth" | "magnets" | "keychains" | "mugs" | "heroText" | "portfolio",
  data: any
): Promise<{ success: boolean; firestoreSynced?: boolean; error?: string }> {
  const cleanData = JSON.parse(JSON.stringify(data));

  // Sync to local storage for instant offline/unconfigured key support
  if (typeof window !== "undefined") {
    try {
      const existingStr = localStorage.getItem("visriva_pricing_matrix") || "{}";
      const existing = JSON.parse(existingStr);
      let updatedMatrix = { ...existing };

      if (serviceKey === "photoBooth") {
        updatedMatrix.photoBooth = { ...(updatedMatrix.photoBooth || {}), ...cleanData };
      } else if (serviceKey === "magnets") {
        updatedMatrix.magnets = { ...(updatedMatrix.magnets || {}), ...cleanData };
      } else if (serviceKey === "keychains") {
        updatedMatrix.keychains = { ...(updatedMatrix.keychains || {}), ...cleanData };
      } else if (serviceKey === "mugs") {
        updatedMatrix.mugs = { ...(updatedMatrix.mugs || {}), ...cleanData };
      } else if (serviceKey === "heroText") {
        updatedMatrix = { ...updatedMatrix, ...cleanData };
      } else if (serviceKey === "portfolio") {
        updatedMatrix = { ...updatedMatrix, ...cleanData };
      }

      localStorage.setItem("visriva_pricing_matrix", JSON.stringify(updatedMatrix));
      localStorage.setItem("visriva_global_settings", JSON.stringify(updatedMatrix));
      localStorage.setItem(`visriva_service_${serviceKey}`, JSON.stringify(cleanData));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("pricing_updated"));
    } catch (e) {
      console.warn("LocalStorage service save warning:", e);
    }
  }

  try {
    const docRefAtomic = doc(db, "services", serviceKey);
    const docRefConfig = doc(db, "config", serviceKey === "photoBooth" ? "pricing_matrix" : "global_settings");

    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve("timeout"), 800));
    const firestorePromise = Promise.allSettled([
      setDoc(docRefAtomic, cleanData, { merge: true }),
      setDoc(docRefConfig, { [serviceKey]: cleanData }, { merge: true }),
    ]);

    const winner = await Promise.race([firestorePromise, timeoutPromise]);
    let anyFulfilled = false;
    if (Array.isArray(winner)) {
      anyFulfilled = winner.some((r) => r.status === "fulfilled");
    }

    return { success: true, firestoreSynced: anyFulfilled };
  } catch (err: any) {
    console.warn("Firestore saveServiceDoc fallback to storage active:", err);
    return { success: true, firestoreSynced: false };
  }
}

/**
 * ATOMIC & FLAT FIRESTORE READER: Reads directly from collection("services").doc(serviceKey)
 */
export function subscribeServiceDoc(
  serviceKey: "photoBooth" | "magnets" | "keychains" | "mugs" | "heroText" | "portfolio",
  callback: (data: any) => void
): () => void {
  const loadLocalService = () => {
    if (typeof window !== "undefined") {
      const localSvc = localStorage.getItem(`visriva_service_${serviceKey}`);
      if (localSvc) {
        try {
          callback(JSON.parse(localSvc));
          return;
        } catch (e) {}
      }
      const localMatrix = localStorage.getItem("visriva_pricing_matrix");
      if (localMatrix) {
        try {
          const parsed = JSON.parse(localMatrix);
          if (serviceKey in parsed) callback(parsed[serviceKey]);
          else if (serviceKey === "photoBooth") callback(parsed.photoBooth);
        } catch (e) {}
      }
    }
  };

  loadLocalService();

  const handleUpdate = () => loadLocalService();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("pricing_updated", handleUpdate);
  }

  if (isDummyKey) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("pricing_updated", handleUpdate);
      }
    };
  }

  try {
    const docRef = doc(db, "services", serviceKey);
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          callback(data);
          if (typeof window !== "undefined") {
            localStorage.setItem(`visriva_service_${serviceKey}`, JSON.stringify(data));
          }
        }
      },
      (err) => console.warn(`Atomic service snapshot warning for ${serviceKey}:`, err.message)
    );

    return () => {
      unsub();
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("pricing_updated", handleUpdate);
      }
    };
  } catch (e) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("pricing_updated", handleUpdate);
      }
    };
  }
}

/**
 * GALLERY VISIBILITY MASTER TOGGLES (config/visibility & localStorage)
 */
export function subscribeGalleryVisibility(
  callback: (config: GalleryVisibilityConfig) => void
): () => void {
  const loadLocal = () => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("visriva_gallery_visibility");
      if (local) {
        try {
          callback({ ...DEFAULT_VISIBILITY_CONFIG, ...JSON.parse(local) });
          return;
        } catch (e) {}
      }
    }
    callback(DEFAULT_VISIBILITY_CONFIG);
  };

  loadLocal();

  const handleUpdate = () => loadLocal();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("gallery_visibility_updated", handleUpdate);
  }

  if (isDummyKey) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("gallery_visibility_updated", handleUpdate);
      }
    };
  }

  try {
    const docRef = doc(db, "config", "visibility");
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as GalleryVisibilityConfig;
          const merged = { ...DEFAULT_VISIBILITY_CONFIG, ...data };
          callback(merged);
          if (typeof window !== "undefined") {
            localStorage.setItem("visriva_gallery_visibility", JSON.stringify(merged));
          }
        }
      },
      (err) => console.warn("Gallery visibility snapshot warning:", err.message)
    );

    return () => {
      unsub();
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("gallery_visibility_updated", handleUpdate);
      }
    };
  } catch (e) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("gallery_visibility_updated", handleUpdate);
      }
    };
  }
}

export async function saveGalleryVisibility(
  config: GalleryVisibilityConfig
): Promise<{ success: boolean; firestoreSynced?: boolean; error?: string }> {
  if (typeof window !== "undefined") {
    localStorage.setItem("visriva_gallery_visibility", JSON.stringify(config));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("gallery_visibility_updated"));
  }

  try {
    const docRef = doc(db, "config", "visibility");
    await setDoc(docRef, config, { merge: true });
    return { success: true, firestoreSynced: true };
  } catch (e) {
    console.warn("Firestore saveGalleryVisibility fallback active:", e);
    return { success: true, firestoreSynced: false };
  }
}

/**
 * PRINT PREVIEWER CMS CONFIG (config/print_previewer & localStorage)
 */
export function subscribePrintPreviewerConfig(
  callback: (config: PrintPreviewerConfig) => void
): () => void {
  const loadLocal = () => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("visriva_print_previewer_config");
      if (local) {
        try {
          callback({ ...DEFAULT_PRINT_PREVIEWER_CONFIG, ...JSON.parse(local) });
          return;
        } catch (e) {}
      }
    }
    callback(DEFAULT_PRINT_PREVIEWER_CONFIG);
  };

  loadLocal();

  const handleUpdate = () => loadLocal();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("print_previewer_updated", handleUpdate);
  }

  if (isDummyKey) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("print_previewer_updated", handleUpdate);
      }
    };
  }

  try {
    const docRef = doc(db, "config", "print_previewer");
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as PrintPreviewerConfig;
          const merged = { ...DEFAULT_PRINT_PREVIEWER_CONFIG, ...data };
          callback(merged);
          if (typeof window !== "undefined") {
            localStorage.setItem("visriva_print_previewer_config", JSON.stringify(merged));
          }
        }
      },
      (err) => console.warn("Print previewer snapshot warning:", err.message)
    );

    return () => {
      unsub();
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("print_previewer_updated", handleUpdate);
      }
    };
  } catch (e) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("print_previewer_updated", handleUpdate);
      }
    };
  }
}

export async function savePrintPreviewerConfig(
  config: PrintPreviewerConfig
): Promise<{ success: boolean; firestoreSynced?: boolean; error?: string }> {
  if (typeof window !== "undefined") {
    localStorage.setItem("visriva_print_previewer_config", JSON.stringify(config));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("print_previewer_updated"));
  }

  if (isDummyKey) {
    return { success: true, firestoreSynced: false };
  }

  try {
    const docRef = doc(db, "config", "print_previewer");
    await setDoc(docRef, config, { merge: true });
    return { success: true, firestoreSynced: true };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to save print previewer config";
    return { success: true, firestoreSynced: false, error: errMessage };
  }
}

/**
 * BLOCKED & HIGH DEMAND DATES MANAGER (config/blocked_dates & localStorage)
 */
export interface BlockedDatesConfig {
  fullyBookedDates: string[]; // YYYY-MM-DD
  highDemandDates: string[]; // YYYY-MM-DD
}

export const DEFAULT_BLOCKED_DATES: BlockedDatesConfig = {
  fullyBookedDates: [],
  highDemandDates: [],
};

export function subscribeBlockedDates(
  callback: (config: BlockedDatesConfig) => void
): () => void {
  const loadLocal = () => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("visriva_blocked_dates");
      if (local) {
        try {
          callback({ ...DEFAULT_BLOCKED_DATES, ...JSON.parse(local) });
          return;
        } catch (e) {}
      }
    }
    callback(DEFAULT_BLOCKED_DATES);
  };

  loadLocal();

  const handleUpdate = () => loadLocal();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("blocked_dates_updated", handleUpdate);
  }

  if (isDummyKey) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("blocked_dates_updated", handleUpdate);
      }
    };
  }

  try {
    const docRef = doc(db, "config", "blocked_dates");
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as BlockedDatesConfig;
          const merged = { ...DEFAULT_BLOCKED_DATES, ...data };
          callback(merged);
          if (typeof window !== "undefined") {
            localStorage.setItem("visriva_blocked_dates", JSON.stringify(merged));
          }
        }
      },
      (err) => console.warn("Blocked dates snapshot warning:", err.message)
    );

    return () => {
      unsub();
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("blocked_dates_updated", handleUpdate);
      }
    };
  } catch (e) {
    return () => {};
  }
}

export async function saveBlockedDates(
  config: BlockedDatesConfig
): Promise<{ success: boolean; firestoreSynced?: boolean; error?: string }> {
  if (typeof window !== "undefined") {
    localStorage.setItem("visriva_blocked_dates", JSON.stringify(config));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("blocked_dates_updated"));
  }

  if (isDummyKey) {
    return { success: true, firestoreSynced: false };
  }

  try {
    const docRef = doc(db, "config", "blocked_dates");
    await setDoc(docRef, config, { merge: true });
    return { success: true, firestoreSynced: true };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to save blocked dates";
    return { success: true, firestoreSynced: false, error: errMessage };
  }
}

/**
 * GOLDEN WHEEL CMS CONFIG (doc: config/golden_wheel & localStorage)
 */
export interface WheelPerk {
  id: string;
  title: string;
  code: string;
  description: string;
  color: string;
}

export interface GoldenWheelConfig {
  enabled: boolean;
  buttonLabel: string;
  modalTitle: string;
  perks: WheelPerk[];
}

export const DEFAULT_GOLDEN_WHEEL_CONFIG: GoldenWheelConfig = {
  enabled: true,
  buttonLabel: "🎰 Spin Golden Wheel",
  modalTitle: "Spin the Golden Wheel of Perks",
  perks: [
    {
      id: "perk_1",
      title: "🎁 Free Acrylic Magnet Upgrade",
      code: "VISRIVA-MAGNET-VIP",
      color: "#D4AF37",
      description: "Get complimentary acrylic crystal frames on all custom magnet orders!",
    },
    {
      id: "perk_2",
      title: "⚡ Extra 30 Mins Live Station",
      code: "VISRIVA-30MINS-BOOST",
      color: "#10B981",
      description: "30 minutes of additional complimentary live printing at your event!",
    },
    {
      id: "perk_3",
      title: "💰 ₹1,500 OFF Combo Station",
      code: "VISRIVA-1500-SAVER",
      color: "#F59E0B",
      description: "Instant ₹1,500 discount when booking 2 or more live stations!",
    },
    {
      id: "perk_4",
      title: "📸 Free Digital GIF & Video Booth",
      code: "VISRIVA-GIF-VIP",
      color: "#8B5CF6",
      description: "Free digital live GIF & video recording overlay for all booth guests!",
    },
    {
      id: "perk_5",
      title: "☕ Free Custom Mug Sample",
      code: "VISRIVA-MUG-FREE",
      color: "#EC4899",
      description: "Receive a personalized preview mug delivered to your address!",
    },
    {
      id: "perk_6",
      title: "🎉 ₹2,000 OFF Premium Setup",
      code: "VISRIVA-2000-VIP",
      color: "#3B82F6",
      description: "Flat ₹2,000 discount on any Unlimited Photo Booth or Magnet setup!",
    },
  ],
};

export function subscribeGoldenWheelConfig(
  callback: (config: GoldenWheelConfig) => void
): () => void {
  const loadLocal = () => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("visriva_golden_wheel_config");
      if (local) {
        try {
          callback({ ...DEFAULT_GOLDEN_WHEEL_CONFIG, ...JSON.parse(local) });
          return;
        } catch (e) {}
      }
    }
    callback(DEFAULT_GOLDEN_WHEEL_CONFIG);
  };

  loadLocal();

  const handleUpdate = () => loadLocal();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("golden_wheel_updated", handleUpdate);
  }

  if (isDummyKey) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("golden_wheel_updated", handleUpdate);
      }
    };
  }

  try {
    const docRef = doc(db, "config", "golden_wheel");
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as GoldenWheelConfig;
          const merged = { ...DEFAULT_GOLDEN_WHEEL_CONFIG, ...data };
          callback(merged);
          if (typeof window !== "undefined") {
            localStorage.setItem("visriva_golden_wheel_config", JSON.stringify(merged));
          }
        }
      },
      (err) => console.warn("Golden Wheel snapshot warning:", err.message)
    );

    return () => {
      unsub();
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("golden_wheel_updated", handleUpdate);
      }
    };
  } catch (e) {
    return () => {};
  }
}

export async function saveGoldenWheelConfig(
  config: GoldenWheelConfig
): Promise<{ success: boolean; firestoreSynced?: boolean; error?: string }> {
  if (typeof window !== "undefined") {
    localStorage.setItem("visriva_golden_wheel_config", JSON.stringify(config));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("golden_wheel_updated"));
  }

  if (isDummyKey) {
    return { success: true, firestoreSynced: false };
  }

  try {
    const docRef = doc(db, "config", "golden_wheel");
    await setDoc(docRef, config, { merge: true });
    return { success: true, firestoreSynced: true };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to save Golden Wheel config";
    return { success: true, firestoreSynced: false, error: errMessage };
  }
}

/**
 * GLOBAL CONTACT SETTINGS (doc: config/global_settings)
 */
export function subscribeGlobalContactSettings(
  callback: (config: GlobalSettingsConfig) => void
): () => void {
  const loadLocal = () => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("visriva_global_contact_settings");
      if (local) {
        try {
          callback(JSON.parse(local));
          return;
        } catch (e) {}
      }
    }
    callback(DEFAULT_GLOBAL_SETTINGS);
  };

  loadLocal();

  const handleUpdate = () => loadLocal();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("global_contact_updated", handleUpdate);
  }

  try {
    const docRef = doc(db, "config", "global_settings");
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as GlobalSettingsConfig;
          const merged = { ...DEFAULT_GLOBAL_SETTINGS, ...data };
          callback(merged);
          if (typeof window !== "undefined") {
            localStorage.setItem("visriva_global_contact_settings", JSON.stringify(merged));
          }
        }
      },
      (err) => console.warn("Global contact settings snapshot warning:", err.message)
    );

    return () => {
      unsub();
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("global_contact_updated", handleUpdate);
      }
    };
  } catch (e) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("global_contact_updated", handleUpdate);
      }
    };
  }
}

export async function saveGlobalContactSettings(
  config: GlobalSettingsConfig
): Promise<{ success: boolean; firestoreSynced?: boolean; error?: string }> {
  if (typeof window !== "undefined") {
    localStorage.setItem("visriva_global_contact_settings", JSON.stringify(config));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("global_contact_updated"));
  }

  try {
    const docRef = doc(db, "config", "global_settings");
    await setDoc(docRef, config, { merge: true });
    return { success: true, firestoreSynced: true };
  } catch (e) {
    console.warn("Firestore saveGlobalContactSettings fallback active:", e);
    return { success: true, firestoreSynced: false };
  }
}

/**
 * WEBSITE TEXT CONFIG (doc: config/website_text)
 */
export function subscribeWebsiteText(
  callback: (textConfig: WebsiteTextConfig) => void
): () => void {
  const loadLocal = () => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("visriva_website_text");
      if (local) {
        try {
          callback(JSON.parse(local));
          return;
        } catch (e) {}
      }
    }
    callback(DEFAULT_WEBSITE_TEXT);
  };

  loadLocal();

  const handleUpdate = () => loadLocal();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("website_text_updated", handleUpdate);
  }

  try {
    const docRef = doc(db, "config", "website_text");
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as WebsiteTextConfig;
          const merged = { ...DEFAULT_WEBSITE_TEXT, ...data };
          callback(merged);
          if (typeof window !== "undefined") {
            localStorage.setItem("visriva_website_text", JSON.stringify(merged));
          }
        }
      },
      (err) => console.warn("Website text snapshot warning:", err.message)
    );

    return () => {
      unsub();
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("website_text_updated", handleUpdate);
      }
    };
  } catch (e) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("website_text_updated", handleUpdate);
      }
    };
  }
}

export async function saveWebsiteText(
  config: WebsiteTextConfig
): Promise<{ success: boolean; firestoreSynced?: boolean; error?: string }> {
  if (typeof window !== "undefined") {
    localStorage.setItem("visriva_website_text", JSON.stringify(config));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("website_text_updated"));
  }

  try {
    const docRef = doc(db, "config", "website_text");
    await setDoc(docRef, config, { merge: true });
    return { success: true, firestoreSynced: true };
  } catch (e) {
    console.warn("Firestore saveWebsiteText fallback active:", e);
    return { success: true, firestoreSynced: false };
  }
}

/**
 * ADVANCED GALLERIES COLLECTION READ & WRITE
 */
const DEFAULT_INITIAL_GALLERY: GalleryItem[] = [
  {
    id: "demo-1",
    category: "photo-booth",
    url: "/media__1784986183202.png",
    tagline: "The Leela Palace Royal Wedding",
  },
  {
    id: "demo-2",
    category: "photo-booth",
    url: "/photo_booth_1_1784887254819.png",
    tagline: "Taj West End Luxury Activation",
  },
  {
    id: "demo-3",
    category: "magnet-station",
    url: "/media__1784987230395.jpg",
    tagline: "Custom Acrylic Magnet Station",
  },
  {
    id: "demo-4",
    category: "keychain-station",
    url: "/media__1784986183202.png",
    tagline: "Bespoke Metallic Keychain Station",
  },
  {
    id: "demo-5",
    category: "mug-printing",
    url: "/media__1784987230395.jpg",
    tagline: "Live Ceramic Sublimation Press",
  },
];

export function subscribeGalleries(
  callback: (items: GalleryItem[]) => void
): () => void {
  const loadLocal = () => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("visriva_galleries_list");
      if (local) {
        try {
          callback(JSON.parse(local));
          return;
        } catch (e) {}
      }
    }
    callback(DEFAULT_INITIAL_GALLERY);
  };

  loadLocal();

  const handleUpdate = () => loadLocal();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("galleries_updated", handleUpdate);
  }

  if (isDummyKey) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("galleries_updated", handleUpdate);
      }
    };
  }

  try {
    const docRef = collection(db, "galleries");
    const unsub = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: GalleryItem[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<GalleryItem, "id">),
          }));
          callback(items);
          if (typeof window !== "undefined") {
            localStorage.setItem("visriva_galleries_list", JSON.stringify(items));
          }
        } else {
          callback(DEFAULT_INITIAL_GALLERY);
        }
      },
      (err) => console.warn("Galleries collection snapshot warning:", err.message)
    );

    return () => {
      unsub();
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("galleries_updated", handleUpdate);
      }
    };
  } catch (e) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("galleries_updated", handleUpdate);
      }
    };
  }
}

export async function addGalleryItem(
  item: Omit<GalleryItem, "id">
): Promise<{ success: boolean; id?: string; error?: string }> {
  const id = "gal-" + Date.now();
  const newItem: GalleryItem = { ...item, id, createdAt: new Date().toISOString() };

  if (typeof window !== "undefined") {
    const existing = localStorage.getItem("visriva_galleries_list");
    const current: GalleryItem[] = existing ? JSON.parse(existing) : DEFAULT_INITIAL_GALLERY;
    const updated = [newItem, ...current];
    localStorage.setItem("visriva_galleries_list", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("galleries_updated"));
  }

  try {
    const docRef = await addDoc(collection(db, "galleries"), {
      ...item,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (e) {
    console.warn("Firestore addGalleryItem fallback to storage active:", e);
    return { success: true, id };
  }
}

/**
 * REWRITTEN deleteGalleryItem: Two-Step Deletion (Storage + Firestore)
 */
export async function deleteGalleryItem(
  id: string,
  storageUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Firebase Storage file deletion (if storageUrl is provided)
    if (storageUrl && storageUrl.startsWith("http")) {
      try {
        const storageRef = ref(storage, storageUrl);
        await deleteObject(storageRef);
      } catch (storageErr: any) {
        console.warn("Storage object deletion note:", storageErr?.message || storageErr);
      }
    }

    // 2. Local Storage cache cleanup
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("visriva_galleries_list");
      if (existing) {
        const current: GalleryItem[] = JSON.parse(existing);
        const updated = current.filter((item) => item.id !== id);
        localStorage.setItem("visriva_galleries_list", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("galleries_updated"));
      }
    }

    // 3. Firestore document deletion
    try {
      const docRef = doc(db, "galleries", id);
      await deleteDoc(docRef);
    } catch (firestoreErr: any) {
      console.warn("Firestore deleteDoc note:", firestoreErr?.message || firestoreErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error("deleteGalleryItem error:", err);
    return { success: false, error: err?.message || "Failed to delete photo" };
  }
}
