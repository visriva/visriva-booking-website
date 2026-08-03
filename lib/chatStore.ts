/**
 * lib/chatStore.ts
 * Self-healing Firestore storage helper with a robust Global Memory fallback.
 * Prevents system crashes if Firestore configuration is missing or uninitialized.
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
  timestamp: string | Date | Timestamp | null;
}

export interface ChatThread {
  phoneNum: string;
  displayName?: string;
  lastMessage: string;
  lastTimestamp: string | Date | Timestamp | null;
  unread?: number;
}

export interface BotSettings {
  isActive: boolean;
  autoReplyText: string;
  connectionStatus?: string;
  lastSyncedAt?: string;
  instanceName?: string;
}

// ─── Global Memory Fallback Structure ─────────────────────────────────────────
interface GlobalMemoryStore {
  threads: Record<string, ChatThread>;
  messages: Record<string, ChatMessage[]>;
  botSettings: BotSettings;
}

const memoryStore: GlobalMemoryStore = (globalThis as any)._whatsappChatStore || {
  threads: {},
  messages: {},
  botSettings: {
    isActive: true,
    autoReplyText: "Hi! I am currently operating a live printing station for an event and will get back to you shortly!",
    connectionStatus: "close",
    instanceName: "visriva-live",
  }
};

if (!(globalThis as any)._whatsappChatStore) {
  (globalThis as any)._whatsappChatStore = memoryStore;
}

// Helper to determine if Firestore is active and safe
function isFirestoreReady(): boolean {
  try {
    return !!db;
  } catch {
    return false;
  }
}

// ─── Save Message ─────────────────────────────────────────────────────────────
export async function saveChatMessage(
  phoneNum: string,
  message: { sender: "user" | "bot" | "admin"; text: string; timestamp?: Date | null },
  displayName?: string
): Promise<void> {
  const cleanPhone = phoneNum.replace(/[^0-9]/g, "");
  if (!cleanPhone) return;

  const timestamp = message.timestamp || new Date();

  // 1. Always save to Global Memory first
  const newMsg: ChatMessage = {
    id: Math.random().toString(36).substring(2, 9),
    sender: message.sender,
    text: message.text,
    timestamp: timestamp.toISOString(),
  };

  if (!memoryStore.messages[cleanPhone]) {
    memoryStore.messages[cleanPhone] = [];
  }
  memoryStore.messages[cleanPhone].push(newMsg);

  const updatedThread: ChatThread = {
    phoneNum: cleanPhone,
    displayName: displayName || cleanPhone,
    lastMessage: message.text.slice(0, 120),
    lastTimestamp: timestamp.toISOString(),
  };
  memoryStore.threads[cleanPhone] = updatedThread;

  // 2. Try Firestore saving (non-blocking, crash-proof)
  if (isFirestoreReady()) {
    try {
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
      console.warn("[chatStore] Firestore write failed, using memory store fallback:", err);
    }
  }
}

// ─── Fetch All Threads ────────────────────────────────────────────────────────
export async function getAllChatThreads(): Promise<ChatThread[]> {
  // 1. Try Firestore first
  if (isFirestoreReady()) {
    try {
      const threadsRef = collection(db, "chats");
      const snap = await getDocs(threadsRef);
      if (!snap.empty) {
        const threads: ChatThread[] = snap.docs.map((d) => {
          const data = d.data();
          let tsStr: string | null = null;
          if (data.lastTimestamp instanceof Timestamp) {
            tsStr = data.lastTimestamp.toDate().toISOString();
          } else if (data.lastTimestamp) {
            tsStr = new Date(data.lastTimestamp).toISOString();
          }

          return {
            phoneNum: d.id,
            displayName: data.displayName || d.id,
            lastMessage: data.lastMessage || "",
            lastTimestamp: tsStr,
          };
        });

        // Sync local memory store with latest Firestore data
        threads.forEach((t) => {
          memoryStore.threads[t.phoneNum] = t;
        });
      }
    } catch (err) {
      console.warn("[chatStore] Firestore fetch threads failed, returning local memory store:", err);
    }
  }

  // 2. Format & sort from memoryStore
  const allThreads = Object.values(memoryStore.threads);
  allThreads.sort((a, b) => {
    const ta = a.lastTimestamp ? new Date(a.lastTimestamp as string).getTime() : 0;
    const tb = b.lastTimestamp ? new Date(b.lastTimestamp as string).getTime() : 0;
    return tb - ta;
  });

  return allThreads;
}

// ─── Fetch Thread Messages ───────────────────────────────────────────────────
export async function getChatMessages(
  phoneNum: string,
  maxMessages = 150
): Promise<ChatMessage[]> {
  const cleanPhone = phoneNum.replace(/[^0-9]/g, "");
  if (!cleanPhone) return [];

  // 1. Try Firestore first
  if (isFirestoreReady()) {
    try {
      const messagesRef = collection(db, "chats", cleanPhone, "messages");
      let snap;
      try {
        const q = query(messagesRef, orderBy("timestamp", "asc"), limit(maxMessages));
        snap = await getDocs(q);
      } catch {
        snap = await getDocs(messagesRef);
      }

      if (!snap.empty) {
        const messages: ChatMessage[] = snap.docs.map((d) => {
          const data = d.data();
          let tsStr: string | null = null;
          if (data.timestamp instanceof Timestamp) {
            tsStr = data.timestamp.toDate().toISOString();
          } else if (data.timestamp) {
            tsStr = new Date(data.timestamp).toISOString();
          }

          return {
            id: d.id,
            sender: data.sender || "user",
            text: data.text || "",
            timestamp: tsStr,
          };
        });

        messages.sort((a, b) => {
          const ta = a.timestamp ? new Date(a.timestamp as string).getTime() : 0;
          const tb = b.timestamp ? new Date(b.timestamp as string).getTime() : 0;
          return ta - tb;
        });

        // Sync local memory store
        memoryStore.messages[cleanPhone] = messages;
        return messages;
      }
    } catch (err) {
      console.warn("[chatStore] Firestore fetch messages failed, returning local memory store:", err);
    }
  }

  // 2. Return from Memory fallback
  const localMsgs = memoryStore.messages[cleanPhone] || [];
  return localMsgs.slice(-maxMessages);
}

// ─── Bot Settings management ──────────────────────────────────────────────────
export async function getBotSettings(): Promise<BotSettings> {
  // 1. Try Firestore
  if (isFirestoreReady()) {
    try {
      const docRef = doc(db, "config", "whatsapp_bot");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const settings = {
          isActive: data.isActive ?? data.botActive ?? true,
          autoReplyText: data.autoReplyText || memoryStore.botSettings.autoReplyText,
          connectionStatus: data.connectionStatus || "close",
          lastSyncedAt: data.lastSyncedAt,
          instanceName: data.instanceName || "visriva-live",
        };
        memoryStore.botSettings = settings;
        return settings;
      }
    } catch (err) {
      console.warn("[chatStore] Firestore getBotSettings failed, using memory store:", err);
    }
  }
  return memoryStore.botSettings;
}

export async function saveBotSettings(settings: Partial<BotSettings>): Promise<void> {
  // 1. Always update Memory store
  memoryStore.botSettings = {
    ...memoryStore.botSettings,
    ...settings,
  };

  // 2. Try Firestore
  if (isFirestoreReady()) {
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
      console.warn("[chatStore] Firestore saveBotSettings failed:", err);
    }
  }
}
