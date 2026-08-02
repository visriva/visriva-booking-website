/**
 * lib/chatStore.ts
 * Firestore helpers for the WhatsApp CRM Live Inbox.
 * Collections:
 *   chats/{phoneNum}               — thread metadata (lastMessage, lastTimestamp, name)
 *   chats/{phoneNum}/messages/{id} — individual messages
 *   config/whatsapp_bot            — bot settings
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id?: string;
  sender: "user" | "bot" | "admin";
  text: string;
  timestamp: Date | Timestamp | null;
}

export interface ChatThread {
  phoneNum: string;
  displayName?: string;
  lastMessage: string;
  lastTimestamp: Date | Timestamp | null;
  unread?: number;
}

// ─── Save an incoming or outgoing message ─────────────────────────────────────

export async function saveChatMessage(
  phoneNum: string,
  message: Omit<ChatMessage, "id">,
  displayName?: string
): Promise<void> {
  const cleanPhone = phoneNum.replace(/[^0-9]/g, "");
  const threadRef = doc(db, "chats", cleanPhone);
  const messagesRef = collection(db, "chats", cleanPhone, "messages");

  // Save individual message
  await addDoc(messagesRef, {
    sender: message.sender,
    text: message.text,
    timestamp: serverTimestamp(),
  });

  // Update thread metadata (last message preview)
  await setDoc(
    threadRef,
    {
      phoneNum: cleanPhone,
      displayName: displayName || cleanPhone,
      lastMessage: message.text.slice(0, 120),
      lastTimestamp: serverTimestamp(),
    },
    { merge: true }
  );
}

// ─── Fetch all chat threads (sorted by latest) ───────────────────────────────

export async function getAllChatThreads(): Promise<ChatThread[]> {
  const threadsRef = collection(db, "chats");
  const snap = await getDocs(threadsRef);
  const threads: ChatThread[] = snap.docs.map((d) => ({
    phoneNum: d.id,
    ...(d.data() as Omit<ChatThread, "phoneNum">),
  }));

  // Sort by lastTimestamp descending
  threads.sort((a, b) => {
    const ta = a.lastTimestamp instanceof Timestamp ? a.lastTimestamp.toMillis() : 0;
    const tb = b.lastTimestamp instanceof Timestamp ? b.lastTimestamp.toMillis() : 0;
    return tb - ta;
  });

  return threads;
}

// ─── Fetch messages for a single thread ──────────────────────────────────────

export async function getChatMessages(
  phoneNum: string,
  maxMessages = 100
): Promise<ChatMessage[]> {
  const cleanPhone = phoneNum.replace(/[^0-9]/g, "");
  const messagesRef = collection(db, "chats", cleanPhone, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"), limit(maxMessages));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<ChatMessage, "id">),
  }));
}

// ─── Subscribe to messages for a thread in real-time ─────────────────────────

export function subscribeToChatMessages(
  phoneNum: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const cleanPhone = phoneNum.replace(/[^0-9]/g, "");
  const messagesRef = collection(db, "chats", cleanPhone, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"), limit(100));

  const unsubscribe = onSnapshot(q, (snap) => {
    const msgs: ChatMessage[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ChatMessage, "id">),
    }));
    callback(msgs);
  });

  return unsubscribe;
}

// ─── Subscribe to all chat threads in real-time ───────────────────────────────

export function subscribeToChatThreads(
  callback: (threads: ChatThread[]) => void
): () => void {
  const threadsRef = collection(db, "chats");

  const unsubscribe = onSnapshot(threadsRef, (snap) => {
    const threads: ChatThread[] = snap.docs.map((d) => ({
      phoneNum: d.id,
      ...(d.data() as Omit<ChatThread, "phoneNum">),
    }));

    threads.sort((a, b) => {
      const ta = a.lastTimestamp instanceof Timestamp ? a.lastTimestamp.toMillis() : 0;
      const tb = b.lastTimestamp instanceof Timestamp ? b.lastTimestamp.toMillis() : 0;
      return tb - ta;
    });

    callback(threads);
  });

  return unsubscribe;
}
