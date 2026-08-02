/**
 * WhatsApp AI Agent — Shared TypeScript Types
 * Firestore collections: wa_conversations, wa_kb_documents, wa_agent_settings
 */

// ─── Conversation & Messages ─────────────────────────────────────────────────

export type ConversationMode = "ai" | "human";
export type MessageSender = "customer" | "agent" | "ai";
export type MessageType = "text" | "image" | "document" | "audio" | "video" | "sticker" | "location" | "contact";
export type MessageStatus = "sent" | "delivered" | "read" | "failed" | "pending";

export interface WAConversation {
  /** Phone number (with country code, e.g. "918884484828") — also the Firestore doc ID */
  phone: string;
  /** Contact name from WhatsApp profile */
  name: string;
  /** Optional profile picture URL */
  avatarUrl?: string;
  /** Current mode for this conversation */
  mode: ConversationMode;
  /** Preview of the last message */
  lastMessage: string;
  /** Who sent the last message */
  lastMessageSender: MessageSender;
  /** Timestamp of last activity (ISO string or Firestore Timestamp) */
  lastActivityAt: any;
  /** Number of unread messages from customer */
  unreadCount: number;
  /** Whether the 24h window is still open */
  windowOpen: boolean;
  /** Timestamp of the customer's last message (to calculate 24h window) */
  customerLastMessageAt?: any;
  /** Whether this conversation is marked as resolved */
  resolved: boolean;
  /** Tags for organization */
  tags?: string[];
  /** Notes by the human agent */
  notes?: string;
  /** Created timestamp */
  createdAt: any;
}

export interface WAMessage {
  /** Firestore auto-generated ID */
  id?: string;
  /** Who sent this message */
  sender: MessageSender;
  /** Message content type */
  type: MessageType;
  /** Text content (for text messages) or caption (for media) */
  content: string;
  /** Media URL (for images, documents, audio, video) */
  mediaUrl?: string;
  /** Media MIME type */
  mediaMimeType?: string;
  /** Original filename (for documents) */
  mediaFilename?: string;
  /** WhatsApp message ID from Meta API */
  waMessageId?: string;
  /** Delivery status */
  status: MessageStatus;
  /** Timestamp */
  timestamp: any;
  /** If AI-generated, the model used */
  aiModel?: string;
  /** If AI-generated, tokens used */
  aiTokensUsed?: number;
  /** Whether RAG context was used for this response */
  ragContextUsed?: boolean;
}

// ─── Knowledge Base ──────────────────────────────────────────────────────────

export type KBDocumentStatus = "processing" | "ready" | "error";

export interface KBDocument {
  /** Firestore auto-generated ID */
  id?: string;
  /** Document title (user-provided or filename) */
  title: string;
  /** Original uploaded filename */
  originalFileName: string;
  /** File MIME type */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** Number of chunks created */
  chunkCount: number;
  /** Processing status */
  status: KBDocumentStatus;
  /** Error message if status is "error" */
  errorMessage?: string;
  /** Upload timestamp */
  uploadedAt: any;
  /** Who uploaded this */
  uploadedBy?: string;
}

export interface KBChunk {
  /** Firestore auto-generated ID */
  id?: string;
  /** Reference to parent document ID */
  sourceDocId: string;
  /** Source document title */
  sourceDocTitle: string;
  /** The text content of this chunk */
  content: string;
  /** Extracted keywords for search */
  keywords: string[];
  /** Position index within the source document */
  chunkIndex: number;
  /** Character count */
  charCount: number;
}

// ─── Agent Settings ──────────────────────────────────────────────────────────

export interface AgentSettings {
  /** System prompt that guides AI behavior */
  systemPrompt: string;
  /** Default mode for new conversations */
  defaultMode: ConversationMode;
  /** Gemini model identifier */
  geminiModel: string;
  /** Temperature for AI responses (0-1) */
  temperature: number;
  /** Max output tokens */
  maxTokens: number;
  /** Whether AI auto-reply is globally enabled */
  aiEnabled: boolean;
  /** Greeting message for new conversations */
  greetingMessage: string;
  /** Away message when AI is disabled and no human is available */
  awayMessage: string;
  /** Whether to send read receipts automatically */
  autoReadReceipts: boolean;
  /** Last updated timestamp */
  updatedAt?: any;
}

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  systemPrompt: `You are a smart, professional customer support agent for Visriva Live Station — a premium live event printing company based in Bengaluru and Pune, India.

Your responsibilities:
- Answer customer inquiries about services, pricing, availability, and booking
- Be warm, helpful, concise, and professional
- Use WhatsApp formatting (*bold*, _italic_, ~strikethrough~)
- Use relevant emojis sparingly
- If you don't know something, say so honestly and offer to connect with a human agent
- Always maintain a luxury, premium brand voice
- Keep responses under 200 words unless detailed information is requested

Company contact: +91 88844 84828 | visriva.work@gmail.com
Website: www.visriva.com
Instagram: @visriva.live`,
  defaultMode: "ai",
  geminiModel: "gemini-2.5-flash",
  temperature: 0.7,
  maxTokens: 800,
  aiEnabled: true,
  greetingMessage: "Hello! 👋 Welcome to *Visriva Live Station*. How can I help you today?",
  awayMessage: "Thank you for reaching out! Our team is currently unavailable. We'll get back to you shortly. 🙏",
  autoReadReceipts: true,
};

// ─── API Payloads ────────────────────────────────────────────────────────────

export interface SendMessagePayload {
  phone: string;
  message: string;
  type?: "text" | "image" | "document";
  mediaUrl?: string;
  mediaFilename?: string;
}

export interface AIReplyPayload {
  phone: string;
  customerMessage: string;
  messageType: MessageType;
  mediaUrl?: string;
  mediaMimeType?: string;
}

export interface RAGSearchResult {
  chunk: KBChunk;
  score: number;
}
