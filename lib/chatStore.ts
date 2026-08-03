/**
 * lib/chatStore.ts
 * Firestore storage helper for the WhatsApp CRM Live Inbox.
 * Collections:
 *   chats/{phoneNum}               — thread metadata (lastMessage, lastTimestamp, displayName)
 *   chats/{phoneNum}/messages/{id} — individual chat messages
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
  timestamp: Date | Timestamp | string | null;
}

export interface ChatThread {
  phoneNum: string;
  displayName?: string;
  lastMessage: string;
  lastTimestamp: Date | Timestamp | string | null;
  unread?: number;
}

export interface BotSettings {
  isActive: boolean;
  autoReplyText: string;
  connectionStatus?: string;
  lastSyncedAt?: string;
  instanceName?: string;
}

// ─── Save an incoming or outgoing message ─────────────────────────────────────
export async function saveChatMessage(
  phoneNum: string,
  message: { sender: "user" | "bot" | "admin"; text: string; timestamp?: Date | null },
  displayName?: string
): Promise<void> {
  try {
    const cleanPhone = phoneNum.replace(/[^0-9]/g, "");
    if (!cleanPhone) return;

    const threadRef = doc(db, "chats", cleanPhone);
    const messagesRef = collection(db, "chats", cleanPhone, "messages");

    await addDoc(messagesRef, {
      sender: message.sender,
      text: message.text,
      timestamp: serverTimestamp(),
    });

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
  } catch (err) {
    console.error("[chatStore] saveChatMessage error:", err);
  }
}

// ─── Fetch all chat threads ───────────────────────────────────────────────────
export async function getAllChatThreads(): Promise<ChatThread[]> {
  try {
    const threadsRef = collection(db, "chats");
    const snap = await getDocs(threadsRef);
    const threads: ChatThread[] = snap.docs.map((d) => ({
      phoneNum: d.id,
      ...(d.data() as Omit<ChatThread, "phoneNum">),
    }));

    threads.sort((a, b) => {
      const ta = a.lastTimestamp instanceof Timestamp ? a.lastTimestamp.toMillis() : (a.lastTimestamp ? new Date(a.lastTimestamp as string).getTime() : 0);
      const tb = b.lastTimestamp instanceof Timestamp ? b.lastTimestamp.toMillis() : (b.lastTimestamp ? new Date(b.lastTimestamp as string).getTime() : 0);
      return tb - ta;
    });

    return threads;
  } catch (err) {
    console.error("[chatStore] getAllChatThreads error:", err);
    return [];
  }
}

// ─── Fetch messages for a single thread ──────────────────────────────────────
export async function getChatMessages(
  phoneNum: string,
  maxMessages = 100
): Promise<ChatMessage[]> {
  try {
    const cleanPhone = phoneNum.replace(/[^0-9]/g, "");
    if (!cleanPhone) return [];
    const messagesRef = collection(db, "chats", cleanPhone, "messages");
    let snap;
    try {
      const q = query(messagesRef, orderBy("timestamp", "asc"), limit(maxMessages));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(messagesRef);
    }

    const msgs: ChatMessage[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ChatMessage, "id">),
    }));

    msgs.sort((a, b) => {
      const ta = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp as string).getTime() : 0);
      const tb = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : (b.timestamp ? new Date(b.timestamp as string).getTime() : 0);
      return ta - tb;
    });

    return msgs;
  } catch (err) {
    console.error("[chatStore] getChatMessages error:", err);
    return [];
  }
}

// ─── Bot Settings ─────────────────────────────────────────────────────────────
export async function getBotSettings(): Promise<BotSettings> {
  const defaults: BotSettings = {
    isActive: true,
    autoReplyText: "Hi! I am currently operating a live printing station for an event and will get back to you shortly!",
    connectionStatus: "close",
    instanceName: "visriva-live",
  };
  try {
    const docRef = doc(db, "config", "whatsapp_bot");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        isActive: data.isActive ?? data.botActive ?? true,
        autoReplyText: data.autoReplyText || defaults.autoReplyText,
        connectionStatus: data.connectionStatus || defaults.connectionStatus,
        lastSyncedAt: data.lastSyncedAt,
        instanceName: data.instanceName || defaults.instanceName,
      };
    }
  } catch (err) {
    console.error("[chatStore] getBotSettings error:", err);
  }
  return defaults;
}

export async function saveBotSettings(settings: Partial<BotSettings>): Promise<void> {
  try {
    const docRef = doc(db, "config", "whatsapp_bot");
    const updateData: Record<string, unknown> = {};
    if (settings.isActive !== undefined) {
      updateData.isActive = settings.isActive;
      updateData.botActive = settings.isActive;
    }
    if (settings.autoReplyText !== undefined) updateData.autoReplyText = settings.autoReplyText;
    if (settings.connectionStatus !== undefined) updateData.connectionStatus = settings.connectionStatus;
    if (settings.lastSyncedAt !== undefined) updateData.lastSyncedAt = settings.lastSyncedAt;
    if (settings.instanceName !== undefined) updateData.instanceName = settings.instanceName;

    await setDoc(docRef, updateData, { merge: true });
  } catch (err) {
    console.error("[chatStore] saveBotSettings error:", err);
  }
}

// ─── Real-Time Subscriptions ──────────────────────────────────────────────────
export function subscribeToChatMessages(
  phoneNum: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const cleanPhone = phoneNum.replace(/[^0-9]/g, "");
  if (!cleanPhone) return () => {};
  const messagesRef = collection(db, "chats", cleanPhone, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"), limit(100));

  return onSnapshot(
    q,
    (snap) => {
      const msgs: ChatMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessage, "id">),
      }));
      callback(msgs);
    },
    (err) => {
      console.warn("[chatStore] subscribeToChatMessages error:", err);
    }
  );
}

export function subscribeToChatThreads(
  callback: (threads: ChatThread[]) => void
): () => void {
  const threadsRef = collection(db, "chats");
  return onSnapshot(
    threadsRef,
    (snap) => {
      const threads: ChatThread[] = snap.docs.map((d) => ({
        phoneNum: d.id,
        ...(d.data() as Omit<ChatThread, "phoneNum">),
      }));

      threads.sort((a, b) => {
        const ta = a.lastTimestamp instanceof Timestamp ? a.lastTimestamp.toMillis() : (a.lastTimestamp ? new Date(a.lastTimestamp as string).getTime() : 0);
        const tb = b.lastTimestamp instanceof Timestamp ? b.lastTimestamp.toMillis() : (b.lastTimestamp ? new Date(b.lastTimestamp as string).getTime() : 0);
        return tb - ta;
      });

      callback(threads);
    },
    (err) => {
      console.warn("[chatStore] subscribeToChatThreads error:", err);
    }
  );
}
