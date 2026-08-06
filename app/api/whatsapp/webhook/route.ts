import { NextResponse } from 'next/server';
import { saveChatMessage, getBotSettings } from '@/lib/chatStore';
import { configureEvolutionTls, getEvolutionConfig, getEvolutionHeaders } from '@/lib/evolutionApi';

configureEvolutionTls();

// ─── GET: Health Check for Webhook Verification ──────────────────────────────
export async function GET() {
  return NextResponse.json({ status: 'online' });
}

// ─── POST: Webhook Receiver & Processor ───────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ status: 'success', note: 'empty or non-JSON body' });
    }

    console.log('🔥 WEBHOOK PAYLOAD:', JSON.stringify(body, null, 2));

    const data = body?.data || body;

    const remoteJid: string  = data?.key?.remoteJid  || data?.sender      || data?.remoteJid || '';
    const fromMe:    boolean = data?.key?.fromMe      || data?.fromMe      || false;
    const pushName:  string  = data?.pushName         || data?.data?.pushName || '';

    const messageContent: string =
      data?.message?.conversation                   ||
      data?.message?.extendedTextMessage?.text      ||
      data?.message?.imageMessage?.caption          ||
      data?.body                                    ||
      '';

    if (!remoteJid || fromMe || remoteJid.endsWith('@g.us') || !messageContent.trim()) {
      console.log('[webhook] Ignored — sent by self, group chat, or empty message text.');
      return NextResponse.json({ status: 'success', note: 'ignored message' });
    }

    const phoneNumber = remoteJid.replace(/@s\.whatsapp\.net|@g\.us/g, '').replace(/[^0-9]/g, '');
    console.log(`[webhook] ✉️ Incoming message from ${phoneNumber} (${pushName}): "${messageContent}"`);

    await saveChatMessage(phoneNumber, {
      sender: 'user',
      text: messageContent,
      timestamp: new Date()
    }, pushName || phoneNumber);

    const botSettings = await getBotSettings();
    const isBotActive = botSettings.isActive === true;

    if (!isBotActive) {
      console.log('[webhook] Bot is currently disabled — user message saved, auto-reply skipped.');
      return NextResponse.json({ status: 'success', note: 'bot_disabled' });
    }

    let replyText = botSettings.autoReplyText;
    const lower = messageContent.toLowerCase();

    if (/\bhi\b|\bhello\b|\bhey\b|namaste|hii/.test(lower)) {
      replyText =
        'Welcome to *Visriva Live Station!* ✨\n\n' +
        'We bring high-speed photo booths, custom fridge magnets, keychains, and mugs to your events.\n\n' +
        'How can we elevate your celebration? Reply with:\n' +
        '• *PRICE* — for package details\n' +
        '• *BOOK* — to check availability\n' +
        '• *PRODUCTS* — to see what we offer';
    } else if (/price|cost|rate|package|how much|fees?/.test(lower)) {
      replyText =
        'Here are our *Visriva Live Station Packages* 💛\n\n' +
        '🥉 *Essential* (Photo Booth) — ₹15,000\n' +
        '🥈 *Signature* (Magnets + Keychains) — ₹25,000\n' +
        '🥇 *Platinum* (Full Gifting Suite) — ₹45,000\n\n' +
        'Corporate & Wedding bulk pricing available!\n' +
        '📞 +91 88844 84828 | 📧 visriva.work@gmail.com';
    } else if (/book|available|slot|date|reserve/.test(lower)) {
      replyText =
        '📅 *Let\'s book your event!*\n\nPlease share:\n' +
        '1. Event date\n2. City & venue\n3. Expected guest count\n\n' +
        'Call/WhatsApp: *+91 88844 84828*';
    } else if (/wedding|shaadi|marriage|bride|reception/.test(lower)) {
      replyText =
        '💍 *Congratulations!*\n\nVisriva specializes in Wedding Live Gifting — ' +
        'instant photo prints, fridge magnets & keychains as return gifts.\n\n' +
        'DM us your event date for a custom quote!\n📞 +91 88844 84828';
    } else if (/corporate|office|company|bulk|b2b/.test(lower)) {
      replyText =
        '🏢 *Corporate Gifting with Visriva!*\n\n' +
        'Branded photo prints, magnets & more — printed live at your venue.\n' +
        'Minimum 50 units for custom pricing.\n\n' +
        '📧 visriva.work@gmail.com | 📞 +91 88844 84828';
    } else if (/product|what.*offer|what.*make|item/.test(lower)) {
      replyText =
        '*Visriva Live Gifting Products* 🎁\n\n' +
        '📸 Instant Photo Prints\n🧲 Fridge Magnets\n🔑 Keychains\n' +
        '☕ Live Mugs\n🛍️ Tote Bags\n🖼️ Photo Frames\n\n' +
        'All printed on-site at your event within minutes!';
    } else if (/thank|thanks|thx|great|awesome|perfect/.test(lower)) {
      replyText =
        'You\'re very welcome! 😊\n\n' +
        '📞 +91 88844 84828\n📧 visriva.work@gmail.com\n' +
        '📸 instagram.com/visriva.live\n\n' +
        '*Visriva Live Station* — Creating memories, one print at a time! ✨';
    }

    console.log(`[webhook] 🤖 Sending auto-reply to ${phoneNumber}...`);
    try {
      const { url, key, instance } = await getEvolutionConfig();
      const sendRes = await fetch(`${url}/message/sendText/${instance}`, {
        method: 'POST',
        headers: getEvolutionHeaders(key),
        body: JSON.stringify({
          number: phoneNumber,
          text:   replyText,
        }),
      });

      const sendResult = await sendRes.json().catch(() => ({}));
      console.log('🤖 BOT AUTO-REPLY SENT RESULT:', sendResult);
    } catch (sendErr) {
      console.error('[webhook] Error sending text message:', sendErr);
    }

    await saveChatMessage(phoneNumber, {
      sender: 'bot',
      text: replyText,
      timestamp: new Date()
    }, pushName || phoneNumber);

    return NextResponse.json({ status: 'success' });

  } catch (error: any) {
    console.error('❌ WEBHOOK TOP-LEVEL ERROR:', error);
    return NextResponse.json({ status: 'success', error: error.message });
  }
}
