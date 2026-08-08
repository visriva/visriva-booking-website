import { saveChatMessage, getBotSettings } from "@/lib/chatStore";
import { parseEvolutionInbound } from "@/lib/whatsappWebhookParse";
import { sendEvolutionText } from "@/lib/evolutionSend";

function keywordAutoReply(message: string, fallback: string): string {
  const lower = message.toLowerCase();
  if (/\bhi\b|\bhello\b|\bhey\b|namaste|hii/.test(lower)) {
    return (
      "Welcome to *Visriva Live Station!* ✨\n\n" +
      "We bring high-speed photo booths, custom fridge magnets, keychains, and mugs to your events.\n\n" +
      "Reply with:\n• *PRICE* — package details\n• *BOOK* — check availability\n• *PRODUCTS* — what we offer"
    );
  }
  if (/price|cost|rate|package|how much|fees?/.test(lower)) {
    return (
      "Here are our *Visriva Live Station Packages* 💛\n\n" +
      "🥉 *Essential* (Photo Booth) — ₹15,000\n" +
      "🥈 *Signature* (Magnets + Keychains) — ₹25,000\n" +
      "🥇 *Platinum* (Full Gifting Suite) — ₹45,000\n\n" +
      "📞 +91 88844 84828"
    );
  }
  if (/book|available|slot|date|reserve/.test(lower)) {
    return "📅 Share your event date, city & guest count. Call/WhatsApp: *+91 88844 84828*";
  }
  return fallback;
}

export interface InboundProcessResult {
  handled: boolean;
  phone?: string;
  aiReply?: boolean;
  ruleReply?: boolean;
  reason?: string;
}

/** Full inbound pipeline: parse → store → AI or keyword reply. */
export async function processInboundWhatsApp(
  body: unknown,
  options?: { skipAi?: boolean }
): Promise<InboundProcessResult> {
  const parsed = parseEvolutionInbound(body);
  if (!parsed) {
    return { handled: false, reason: "ignored_event" };
  }

  const { phone, pushName, text } = parsed;
  console.log(`[Message Received] ${phone} (${pushName}): "${text.slice(0, 80)}"`);

  await saveChatMessage(phone, { sender: "user", text, timestamp: new Date() }, pushName);

  if (!options?.skipAi) {
    try {
      const { storeCustomerMessage } = await import("@/lib/whatsappAiEngine");
      await storeCustomerMessage(phone, pushName, text);
    } catch (e) {
      console.warn("[Inbound] wa_conversations sync skipped:", e);
    }
  }

  const botSettings = await getBotSettings();
  if (botSettings.isActive === false) {
    console.log("[Inbound] Bot disabled — message saved, no auto-reply");
    return { handled: true, phone, reason: "bot_disabled" };
  }

  const agentSettings = options?.skipAi
    ? { aiEnabled: false }
    : await (async () => {
        const { loadAgentSettings } = await import("@/lib/whatsappAiEngine");
        return loadAgentSettings();
      })();

  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const geminiUsable = !!geminiKey && !geminiKey.startsWith("AQ.");

  if (!options?.skipAi && agentSettings.aiEnabled && geminiUsable) {
    const { runAiAutoReply } = await import("@/lib/whatsappAiEngine");
    const aiResult = await runAiAutoReply(phone, text, pushName);
    if (aiResult.replied && aiResult.replyText) {
      await saveChatMessage(
        phone,
        { sender: "bot", text: aiResult.replyText, timestamp: new Date() },
        pushName
      );
      return { handled: true, phone, aiReply: true };
    }
    if (aiResult.reason === "human_mode") {
      console.log("[Inbound] Human mode — no auto-reply");
      return { handled: true, phone, reason: "human_mode" };
    }
    console.warn(`[Inbound] AI failed (${aiResult.reason}) — falling back to keyword rules`);
  }

  const replyText = keywordAutoReply(text, botSettings.autoReplyText);
  console.log(`[Inbound] Keyword reply → ${phone}`);
  await sendEvolutionText(phone, replyText, "[Rules]");
  await saveChatMessage(phone, { sender: "bot", text: replyText, timestamp: new Date() }, pushName);
  return { handled: true, phone, ruleReply: true };
}
