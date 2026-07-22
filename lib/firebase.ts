import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevelopment",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "visriva-live-station.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "visriva-live-station",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "visriva-live-station.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

export interface BookingLead {
  eventDate: string;
  venue: string;
  eventType: string;
  pax: number;
  services: string[];
  estimatedBudget: string;
  tier: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  createdAt?: unknown;
}

/**
 * Save booking lead payload to Firebase Firestore 'bookings' collection.
 * Includes automatic fallback for preview mode if Firestore credentials are missing.
 */
export async function saveBookingLead(lead: BookingLead): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Check if real credentials exist or fallback
    const isConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    
    if (!isConfigured) {
      console.warn("⚠️ Firebase environment variables not fully configured. Using simulated lead save mode.");
      // Simulate network latency for smooth UI feedback
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
    const errMessage = error instanceof Error ? error.message : "Failed to record booking inquiry.";
    return {
      success: false,
      error: errMessage,
    };
  }
}
