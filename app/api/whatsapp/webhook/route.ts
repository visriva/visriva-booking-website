import { NextResponse } from 'next/server';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const EVO_URL      = (process.env.EVOLUTION_API_URL      || 'https://evolution-api-production-d446.up.railway.app').replace(/\/$/, '');
const EVO_KEY      = process.env.EVOLUTION_API_KEY       || 'VisrivaSecretKey2026_SecureKey';
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'visriva-live';

// ─── Firebase init (Server-Safe Dynamic Import) ──────────────────────────────
async function getFirebase() {
  const { initializeApp, getApps, getApp } = await import('firebase/app');
  const { getFirestore, doc, getDoc, collection, addDoc, setDoc, serverTimestamp } =
    await import('firebase/firestore');

  const app = getApps().length === 0
    ? initializeApp({
        apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'visriva-live-station',
        storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      })
    : getApp();

  return { db: getFirestore(app), doc, getDoc, collection, addDoc, setDoc, serverTimestamp };
}

// ─── Save message to Firestore chats ──────────────────────────────────────────
async function saveChatMessage(
  phone: string,
  sender: 'user' | 'bot' | 'admin',
  text: string,
  displayName?: string
) {
  try {
    const fb = await getFirebase();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) return;

    await fb.addDoc(fb.collection(fb.db, 'chats', cleanPhone, 'messages'), {
      sender,
      text,
      timestamp: fb.serverTimestamp(),
    });

    await fb.setDoc(
      fb.doc(fb.db, 'chats', cleanPhone),
      {
        phoneNum:      cleanPhone,
        displayName:   displayName || cleanPhone,
        lastMessage:   text.slice(0, 120),
        lastTimestamp: fb.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('[webhook] Failed to save message to Firestore:', err);
  }
}

// ─── GET — Health Check Endpoint for Webhook Setup ────────────────────────────
export async function GET() {
  return NextResponse.json({ status: 'online' });
}

// ─── POST — Incoming Evolution API Webhook Event Receiver ─────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    console.log('🔥 INCOMING WEBHOOK PAYLOAD:', JSON.stringify(body, null, 2));

    // Safely extract event data — Evolution API v2 nests payload under body.data
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

    // Ignore group messages (@g.us), self-sent messages (fromMe === true), or empty text
    if (!remoteJid || fromMe || remoteJid.endsWith('@g.us') || !messageContent.trim()) {
      console.log('[webhook] Ignored — fromMe, group chat, or empty message text.', { remoteJid, fromMe });
      return NextResponse.json({ status: 'ignored', reason: 'Missing JID, sent by self, group, or empty text' });
    }

    // Clean phone number (strip JID suffixes, keep digits only)
    const phoneNumber = remoteJid.replace(/@s\.whatsapp\.net|@g\.us/g, '').replace(/[^0-9]/g, '');
    console.log(`[webhook] ✉️ Incoming message from ${phoneNumber} (${pushName}): "${messageContent}"`);

    // 1. Save incoming user message to database
    await saveChatMessage(phoneNumber, 'user', messageContent, pushName || phoneNumber);

    // 2. Fetch bot active status & custom auto-reply text from Firestore
    const fb = await getFirebase();
    const botSnap = await fb.getDoc(fb.doc(fb.db, 'config', 'whatsapp_bot'));
    const botData = botSnap.exists() ? botSnap.data() : {};
    const isBotActive = botData?.isActive === true || botData?.botActive === true;

    if (!isBotActive) {
      console.log('[webhook] Bot is currently disabled — user message saved, auto-reply skipped.');
      return NextResponse.json({ status: 'saved', replied: false, reason: 'bot_disabled' });
    }

    // 3. Build smart response based on keywords or fallback to custom reply text
    const customFallback: string =
      botData?.autoReplyText ||
      'Hi! I am currently operating a live printing station for an event and will get back to you shortly!';

    let replyText = customFallback;
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

    // 4. Send automated text response back via Evolution API
    console.log(`[webhook] 🤖 Sending auto-reply to ${phoneNumber}...`);
    const sendRes = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVO_KEY,
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: replyText,
      }),
    });

    const sendResult = await sendRes.json().catch(() => ({}));
    console.log('🤖 BOT AUTO-REPLY SENT RESULT:', sendResult);

    // 5. Save outgoing bot reply to database chat thread
    await saveChatMessage(phoneNumber, 'bot', replyText, pushName || phoneNumber);

    return NextResponse.json({ status: 'success', replied: true, phone: phoneNumber });

  } catch (error: any) {
    console.error('❌ WEBHOOK CRASH ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
