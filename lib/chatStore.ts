/**
 * lib/chatStore.ts
 * WhatsApp CRM storage — Firebase Admin on server, client SDK in browser.
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
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

async function getAdminDb() {
  if (typeof window !== "undefined") return null;
  try {
    const { adminDb } = await import("@/lib/firebaseAdmin");
    return adminDb;
  } catch {
    return null;
  }
}

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

// ─── Global Memory Fallback (per serverless instance) ─────────────────────────
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
    autoReplyText:
      "Hi! I am currently operating a live printing station for an event and will get back to you shortly!",
    connectionStatus: "close",
    instanceName: "visriva-live",
  },
};

if (!(globalThis as any)._whatsappChatStore) {
  (globalThis as any)._whatsappChatStore = memoryStore;
}

const isServer = typeof window === "undefined";

function toIso(ts: unknown): string | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  if (typeof (ts as { toDate?: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date(String(ts)).toISOString();
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
  const tsIso = timestamp.toISOString();

  const newMsg: ChatMessage = {
    id: Math.random().toString(36).substring(2, 9),
    sender: message.sender,
    text: message.text,
    timestamp: tsIso,
  };

  if (!memoryStore.messages[cleanPhone]) memoryStore.messages[cleanPhone] = [];
  memoryStore.messages[cleanPhone].push(newMsg);
  memoryStore.threads[cleanPhone] = {
    phoneNum: cleanPhone,
    displayName: displayName || cleanPhone,
    lastMessage: message.text.slice(0, 120),
    lastTimestamp: tsIso,
  };

  if (isServer) {
    const adminDb = await getAdminDb();
    if (adminDb) {
      try {
        await adminDb.collection(`chats/${cleanPhone}/messages`).add({
        sender: message.sender,
        text: message.text,
        timestamp: new Date(),
      });
      await adminDb.doc(`chats/${cleanPhone}`).set(
        {
          phoneNum: cleanPhone,
          displayName: displayName || cleanPhone,
          lastMessage: message.text.slice(0, 120),
          lastTimestamp: new Date(),
        },
        { merge: true }
      );
        return;
      } catch (err) {
        console.error("[chatStore] Admin write failed:", err);
      }
    }
  }

  if (db) {
    try {
      await addDoc(collection(db, "chats", cleanPhone, "messages"), {
        sender: message.sender,
        text: message.text,
        timestamp: serverTimestamp(),
      });
      await setDoc(
        doc(db, "chats", cleanPhone),
        {
          phoneNum: cleanPhone,
          displayName: displayName || cleanPhone,
          lastMessage: message.text.slice(0, 120),
          lastTimestamp: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("[chatStore] Client Firestore write failed:", err);
    }
  }
}

// ─── Fetch All Threads ────────────────────────────────────────────────────────
export async function getAllChatThreads(): Promise<ChatThread[]> {
  if (isServer) {
    const adminDb = await getAdminDb();
    if (adminDb) {
      try {
        const snap = await adminDb.collection("chats").get();
      const threads: ChatThread[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          phoneNum: d.id,
          displayName: String(data.displayName || d.id),
          lastMessage: String(data.lastMessage || ""),
          lastTimestamp: toIso(data.lastTimestamp),
        };
      });
      threads.forEach((t) => {
        memoryStore.threads[t.phoneNum] = t;
      });
      threads.sort((a, b) => {
        const ta = a.lastTimestamp ? new Date(a.lastTimestamp as string).getTime() : 0;
        const tb = b.lastTimestamp ? new Date(b.lastTimestamp as string).getTime() : 0;
        return tb - ta;
      });
        return threads;
      } catch (err) {
        console.error("[chatStore] Admin fetch threads failed:", err);
      }
    }
  }

  if (db) {
    try {
      const snap = await getDocs(collection(db, "chats"));
      if (!snap.empty) {
        const threads: ChatThread[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            phoneNum: d.id,
            displayName: data.displayName || d.id,
            lastMessage: data.lastMessage || "",
            lastTimestamp: toIso(data.lastTimestamp),
          };
        });
        threads.forEach((t) => {
          memoryStore.threads[t.phoneNum] = t;
        });
        threads.sort((a, b) => {
          const ta = a.lastTimestamp ? new Date(a.lastTimestamp as string).getTime() : 0;
          const tb = b.lastTimestamp ? new Date(b.lastTimestamp as string).getTime() : 0;
          return tb - ta;
        });
        return threads;
      }
    } catch (err) {
      console.warn("[chatStore] Client fetch threads failed:", err);
    }
  }

  return Object.values(memoryStore.threads).sort((a, b) => {
    const ta = a.lastTimestamp ? new Date(a.lastTimestamp as string).getTime() : 0;
    const tb = b.lastTimestamp ? new Date(b.lastTimestamp as string).getTime() : 0;
    return tb - ta;
  });
}

// ─── Fetch Thread Messages ────────────────────────────────────────────────────
export async function getChatMessages(phoneNum: string, maxMessages = 150): Promise<ChatMessage[]> {
  const cleanPhone = phoneNum.replace(/[^0-9]/g, "");
  if (!cleanPhone) return [];

  if (isServer) {
    const adminDb = await getAdminDb();
    if (adminDb) {
      try {
        const snap = await adminDb
          .collection(`chats/${cleanPhone}/messages`)
        .orderBy("timestamp", "asc")
        .limit(maxMessages)
        .get();
      const messages: ChatMessage[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          sender: (data.sender as ChatMessage["sender"]) || "user",
          text: String(data.text || ""),
          timestamp: toIso(data.timestamp),
        };
      });
      memoryStore.messages[cleanPhone] = messages;
        return messages;
      } catch (err) {
        console.error("[chatStore] Admin fetch messages failed:", err);
      }
    }
  }

  if (db) {
    try {
      const messagesRef = collection(db, "chats", cleanPhone, "messages");
      let snap;
      try {
        snap = await getDocs(query(messagesRef, orderBy("timestamp", "asc"), limit(maxMessages)));
      } catch {
        snap = await getDocs(messagesRef);
      }
      if (!snap.empty) {
        const messages: ChatMessage[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            sender: data.sender || "user",
            text: data.text || "",
            timestamp: toIso(data.timestamp),
          };
        });
        memoryStore.messages[cleanPhone] = messages;
        return messages;
      }
    } catch (err) {
      console.warn("[chatStore] Client fetch messages failed:", err);
    }
  }

  return (memoryStore.messages[cleanPhone] || []).slice(-maxMessages);
}

// ─── Bot Settings ─────────────────────────────────────────────────────────────
export async function getBotSettings(): Promise<BotSettings> {
  if (isServer) {
    const adminDb = await getAdminDb();
    if (adminDb) {
      try {
        const snap = await adminDb.doc("config/whatsapp_bot").get();
      if (snap.exists) {
        const data = snap.data()!;
        const settings: BotSettings = {
          isActive: data.isActive ?? data.botActive ?? true,
          autoReplyText: String(data.autoReplyText || memoryStore.botSettings.autoReplyText),
          connectionStatus: String(data.connectionStatus || "close"),
          lastSyncedAt: data.lastSyncedAt ? String(data.lastSyncedAt) : undefined,
          instanceName: String(data.instanceName || "visriva-live"),
        };
        memoryStore.botSettings = settings;
        return settings;
      }
    } catch (err) {
      console.error("[chatStore] Admin getBotSettings failed:", err);
    }
    }
  }

  if (db) {
    try {
      const snap = await getDoc(doc(db, "config", "whatsapp_bot"));
      if (snap.exists()) {
        const data = snap.data();
        const settings: BotSettings = {
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
      console.warn("[chatStore] Client getBotSettings failed:", err);
    }
  }

  return memoryStore.botSettings;
}

export async function saveBotSettings(settings: Partial<BotSettings>): Promise<void> {
  memoryStore.botSettings = { ...memoryStore.botSettings, ...settings };

  const updateData: Record<string, unknown> = {};
  if (settings.isActive !== undefined) {
    updateData.isActive = settings.isActive;
    updateData.botActive = settings.isActive;
  }
  if (settings.autoReplyText !== undefined) updateData.autoReplyText = settings.autoReplyText;
  if (settings.connectionStatus !== undefined) updateData.connectionStatus = settings.connectionStatus;
  if (settings.lastSyncedAt !== undefined) updateData.lastSyncedAt = settings.lastSyncedAt;
  if (settings.instanceName !== undefined) updateData.instanceName = settings.instanceName;

  if (isServer) {
    const adminDb = await getAdminDb();
    if (adminDb) {
      try {
        await adminDb.doc("config/whatsapp_bot").set(updateData, { merge: true });
        return;
      } catch (err) {
        console.error("[chatStore] Admin saveBotSettings failed:", err);
      }
    }
  }

  if (db) {
    try {
      await setDoc(doc(db, "config", "whatsapp_bot"), updateData, { merge: true });
    } catch (err) {
      console.warn("[chatStore] Client saveBotSettings failed:", err);
    }
  }
}
