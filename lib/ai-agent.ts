/**
 * WhatsApp AI Agent — Utility Library
 * Firestore CRUD helpers, RAG search, text chunking, formatting
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  increment,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import type {
  WAConversation,
  WAMessage,
  KBDocument,
  KBChunk,
  AgentSettings,
  ConversationMode,
  MessageSender,
  MessageType,
  RAGSearchResult,
} from "@/types/whatsapp-agent";
import { DEFAULT_AGENT_SETTINGS } from "@/types/whatsapp-agent";

// ─── Firebase Init (reuse existing app) ──────────────────────────────────────

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevelopment",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "visriva-live-station.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "visriva-live-station",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "visriva-live-station.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// ─── Collection References ───────────────────────────────────────────────────

const CONVERSATIONS_COL = "wa_conversations";
const MESSAGES_SUBCOL = "messages";
const KB_DOCUMENTS_COL = "wa_kb_documents";
const KB_CHUNKS_SUBCOL = "chunks";
const SETTINGS_COL = "wa_agent_settings";
const SETTINGS_DOC = "global";

// ─── Conversation Helpers ────────────────────────────────────────────────────

export function subscribeConversations(
  callback: (conversations: WAConversation[]) => void
): () => void {
  const q = query(
    collection(db, CONVERSATIONS_COL),
    orderBy("lastActivityAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const conversations: WAConversation[] = [];
    snapshot.forEach((docSnap) => {
      conversations.push({ ...docSnap.data(), phone: docSnap.id } as WAConversation);
    });
    callback(conversations);
  }, (error) => {
    console.error("Error subscribing to conversations:", error);
    callback([]);
  });
}

export async function getConversation(phone: string): Promise<WAConversation | null> {
  const docRef = doc(db, CONVERSATIONS_COL, phone);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { ...docSnap.data(), phone: docSnap.id } as WAConversation;
  }
  return null;
}

export async function createOrUpdateConversation(
  phone: string,
  data: Partial<WAConversation>
): Promise<void> {
  const docRef = doc(db, CONVERSATIONS_COL, phone);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    await updateDoc(docRef, {
      ...data,
      lastActivityAt: serverTimestamp(),
    });
  } else {
    await setDoc(docRef, {
      phone,
      name: data.name || "Unknown",
      mode: data.mode || "ai",
      lastMessage: data.lastMessage || "",
      lastMessageSender: data.lastMessageSender || "customer",
      lastActivityAt: serverTimestamp(),
      unreadCount: data.unreadCount || 0,
      windowOpen: true,
      customerLastMessageAt: serverTimestamp(),
      resolved: false,
      createdAt: serverTimestamp(),
      ...data,
    });
  }
}

export async function updateConversationMode(
  phone: string,
  mode: ConversationMode
): Promise<void> {
  const docRef = doc(db, CONVERSATIONS_COL, phone);
  await updateDoc(docRef, { mode });
}

export async function markConversationRead(phone: string): Promise<void> {
  const docRef = doc(db, CONVERSATIONS_COL, phone);
  await updateDoc(docRef, { unreadCount: 0 });
}

export async function updateConversationNotes(
  phone: string,
  notes: string
): Promise<void> {
  const docRef = doc(db, CONVERSATIONS_COL, phone);
  await updateDoc(docRef, { notes });
}

export async function resolveConversation(
  phone: string,
  resolved: boolean
): Promise<void> {
  const docRef = doc(db, CONVERSATIONS_COL, phone);
  await updateDoc(docRef, { resolved });
}

// ─── Message Helpers ─────────────────────────────────────────────────────────

export function subscribeMessages(
  phone: string,
  callback: (messages: WAMessage[]) => void,
  messageLimit: number = 100
): () => void {
  const q = query(
    collection(db, CONVERSATIONS_COL, phone, MESSAGES_SUBCOL),
    orderBy("timestamp", "asc"),
    limit(messageLimit)
  );

  return onSnapshot(q, (snapshot) => {
    const messages: WAMessage[] = [];
    snapshot.forEach((docSnap) => {
      messages.push({ ...docSnap.data(), id: docSnap.id } as WAMessage);
    });
    callback(messages);
  }, (error) => {
    console.error("Error subscribing to messages:", error);
    callback([]);
  });
}

export async function addMessage(
  phone: string,
  message: Omit<WAMessage, "id">
): Promise<string> {
  const colRef = collection(db, CONVERSATIONS_COL, phone, MESSAGES_SUBCOL);
  const docRef = await addDoc(colRef, {
    ...message,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

export async function getRecentMessages(
  phone: string,
  count: number = 20
): Promise<WAMessage[]> {
  const q = query(
    collection(db, CONVERSATIONS_COL, phone, MESSAGES_SUBCOL),
    orderBy("timestamp", "desc"),
    limit(count)
  );
  const snapshot = await getDocs(q);
  const messages: WAMessage[] = [];
  snapshot.forEach((docSnap) => {
    messages.push({ ...docSnap.data(), id: docSnap.id } as WAMessage);
  });
  return messages.reverse(); // chronological order
}

// ─── Knowledge Base Helpers ──────────────────────────────────────────────────

export function subscribeKBDocuments(
  callback: (docs: KBDocument[]) => void
): () => void {
  const q = query(
    collection(db, KB_DOCUMENTS_COL),
    orderBy("uploadedAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const docs: KBDocument[] = [];
    snapshot.forEach((docSnap) => {
      docs.push({ ...docSnap.data(), id: docSnap.id } as KBDocument);
    });
    callback(docs);
  }, (error) => {
    console.error("Error subscribing to KB documents:", error);
    callback([]);
  });
}

export async function addKBDocument(
  data: Omit<KBDocument, "id">
): Promise<string> {
  const colRef = collection(db, KB_DOCUMENTS_COL);
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}

export async function updateKBDocument(
  docId: string,
  data: Partial<KBDocument>
): Promise<void> {
  const docRef = doc(db, KB_DOCUMENTS_COL, docId);
  await updateDoc(docRef, data);
}

export async function deleteKBDocument(docId: string): Promise<void> {
  // Delete all chunks first
  const chunksRef = collection(db, KB_DOCUMENTS_COL, docId, KB_CHUNKS_SUBCOL);
  const chunksSnap = await getDocs(chunksRef);
  const batch = writeBatch(db);
  chunksSnap.forEach((chunkDoc) => {
    batch.delete(chunkDoc.ref);
  });
  await batch.commit();

  // Delete the document
  const docRef = doc(db, KB_DOCUMENTS_COL, docId);
  await deleteDoc(docRef);
}

export async function addKBChunks(
  docId: string,
  chunks: Omit<KBChunk, "id">[]
): Promise<void> {
  const batch = writeBatch(db);
  chunks.forEach((chunk) => {
    const chunkRef = doc(collection(db, KB_DOCUMENTS_COL, docId, KB_CHUNKS_SUBCOL));
    batch.set(chunkRef, chunk);
  });
  await batch.commit();
}

export async function getAllKBChunks(): Promise<KBChunk[]> {
  const docsSnap = await getDocs(collection(db, KB_DOCUMENTS_COL));
  const allChunks: KBChunk[] = [];

  for (const docSnap of docsSnap.docs) {
    const docData = docSnap.data() as KBDocument;
    if (docData.status !== "ready") continue;

    const chunksSnap = await getDocs(
      collection(db, KB_DOCUMENTS_COL, docSnap.id, KB_CHUNKS_SUBCOL)
    );
    chunksSnap.forEach((chunkDoc) => {
      allChunks.push({ ...chunkDoc.data(), id: chunkDoc.id } as KBChunk);
    });
  }

  return allChunks;
}

// ─── Settings Helpers ────────────────────────────────────────────────────────

export function subscribeSettings(
  callback: (settings: AgentSettings) => void
): () => void {
  const docRef = doc(db, SETTINGS_COL, SETTINGS_DOC);

  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...DEFAULT_AGENT_SETTINGS, ...snapshot.data() } as AgentSettings);
    } else {
      callback(DEFAULT_AGENT_SETTINGS);
    }
  }, () => {
    callback(DEFAULT_AGENT_SETTINGS);
  });
}

export async function getSettings(): Promise<AgentSettings> {
  const docRef = doc(db, SETTINGS_COL, SETTINGS_DOC);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { ...DEFAULT_AGENT_SETTINGS, ...docSnap.data() } as AgentSettings;
  }
  return DEFAULT_AGENT_SETTINGS;
}

export async function updateSettings(
  settings: Partial<AgentSettings>
): Promise<void> {
  const docRef = doc(db, SETTINGS_COL, SETTINGS_DOC);
  await setDoc(docRef, {
    ...settings,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ─── Text Chunking ───────────────────────────────────────────────────────────

export function chunkText(
  text: string,
  maxChunkSize: number = 500,
  overlap: number = 50
): string[] {
  if (!text || text.trim().length === 0) return [];

  // Clean the text
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Split by paragraphs first
  const paragraphs = cleaned.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim();
    if (!trimmedPara) continue;

    // If paragraph fits in current chunk, add it
    if (currentChunk.length + trimmedPara.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmedPara;
    } else {
      // Save current chunk if it has content
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      // If paragraph itself is too long, split by sentences
      if (trimmedPara.length > maxChunkSize) {
        const sentences = trimmedPara.split(/(?<=[.!?])\s+/);
        currentChunk = "";

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 <= maxChunkSize) {
            currentChunk += (currentChunk ? " " : "") + sentence;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
              // Add overlap from end of previous chunk
              const words = currentChunk.split(/\s+/);
              const overlapWords = words.slice(-Math.ceil(overlap / 5));
              currentChunk = overlapWords.join(" ") + " " + sentence;
            } else {
              // Single sentence too long — force split
              for (let i = 0; i < sentence.length; i += maxChunkSize - overlap) {
                chunks.push(sentence.slice(i, i + maxChunkSize).trim());
              }
              currentChunk = "";
            }
          }
        }
      } else {
        currentChunk = trimmedPara;
      }
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.length > 10); // Skip tiny chunks
}

// ─── Keyword Extraction (Lightweight TF-IDF) ─────────────────────────────────

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "can", "shall", "this", "that", "these", "those", "it", "its",
  "not", "no", "nor", "so", "if", "then", "than", "too", "very", "just", "about",
  "up", "out", "also", "as", "into", "over", "after", "before", "between",
  "through", "during", "each", "all", "both", "more", "most", "other", "some",
  "such", "only", "own", "same", "here", "there", "when", "where", "how",
  "what", "which", "who", "whom", "why", "i", "me", "my", "we", "our", "you",
  "your", "he", "him", "his", "she", "her", "they", "them", "their",
]);

export function extractKeywords(text: string, maxKeywords: number = 15): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Count word frequency
  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  // Sort by frequency, return top N
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

// ─── RAG Search (Keyword-Based Scoring) ──────────────────────────────────────

export function searchChunks(
  queryText: string,
  chunks: KBChunk[],
  topK: number = 5
): RAGSearchResult[] {
  if (!queryText || chunks.length === 0) return [];

  const queryKeywords = extractKeywords(queryText, 10);
  const queryWords = new Set(
    queryText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  const scored: RAGSearchResult[] = chunks.map((chunk) => {
    let score = 0;

    // 1. Keyword overlap score (weighted by chunk keyword position)
    for (let i = 0; i < chunk.keywords.length; i++) {
      if (queryKeywords.includes(chunk.keywords[i])) {
        score += (chunk.keywords.length - i) / chunk.keywords.length; // higher weight for top keywords
      }
    }

    // 2. Direct word match score
    const chunkWords = chunk.content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/);
    
    let matchCount = 0;
    for (const word of chunkWords) {
      if (queryWords.has(word)) matchCount++;
    }
    score += (matchCount / Math.max(chunkWords.length, 1)) * 2; // normalize

    // 3. Exact phrase match bonus
    if (chunk.content.toLowerCase().includes(queryText.toLowerCase().slice(0, 50))) {
      score += 3;
    }

    return { chunk, score };
  });

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ─── Time Formatting ─────────────────────────────────────────────────────────

export function formatRelativeTime(timestamp: any): string {
  if (!timestamp) return "";

  let date: Date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatMessageTime(timestamp: any): string {
  if (!timestamp) return "";

  let date: Date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── WhatsApp 24-hour Window Check ───────────────────────────────────────────

export function isWindowOpen(customerLastMessageAt: any): boolean {
  if (!customerLastMessageAt) return false;

  let date: Date;
  if (customerLastMessageAt?.toDate) {
    date = customerLastMessageAt.toDate();
  } else if (customerLastMessageAt?.seconds) {
    date = new Date(customerLastMessageAt.seconds * 1000);
  } else if (typeof customerLastMessageAt === "string") {
    date = new Date(customerLastMessageAt);
  } else if (customerLastMessageAt instanceof Date) {
    date = customerLastMessageAt;
  } else {
    return false;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  return diffMs < twentyFourHours;
}

// ─── Phone Number Formatting ─────────────────────────────────────────────────

export function formatPhoneDisplay(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return `+${cleaned}`;
}

export function getInitials(name: string): string {
  if (!name || name === "Unknown") return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Avatar Color Generator ──────────────────────────────────────────────────

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
  "from-sky-500 to-blue-600",
];

export function getAvatarColor(phone: string): string {
  let hash = 0;
  for (let i = 0; i < phone.length; i++) {
    hash = phone.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
