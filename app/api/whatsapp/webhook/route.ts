import { NextResponse } from 'next/server';

// Disable TLS verification for Railway self-hosted instances
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ─── Inline Firebase init (server-safe dynamic import) ───────────────────────
async function getFirebase() {
  const { initializeApp, getApps, getApp } = await import('firebase/app');
  const { getFirestore, doc, getDoc, collection, addDoc, setDoc, serverTimestamp } =
    await import('firebase/firestore');

  const app =
    getApps().length === 0
      ? initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'visriva-live-station',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        })
      : getApp();

  return { db: getFirestore(app), doc, getDoc, collection, addDoc, setDoc, serverTimestamp };
}

// ─── Save a message to chats/{phone}/messages ─────────────────────────────────
async function saveChatMessage(
  phoneNumber: string,
  message: { sender: 'user' | 'bot' | 'admin'; text: string; timestamp: Date }
) {
  const fb = await getFirebase();
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

  await fb.addDoc(fb.collection(fb.db, 'chats', cleanPhone, 'messages'), {
    sender: message.sender,
    text: message.text,
    timestamp: fb.serverTimestamp(),
  });

  await fb.setDoc(
    fb.doc(fb.db, 'chats', cleanPhone),
    {
      phoneNum: cleanPhone,
      lastMessage: message.text.slice(0, 120),
      lastTimestamp: fb.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('🔥 WEBHOOK RECEIVED RAW PAYLOAD:', JSON.stringify(body, null, 2));

    // Extract event type and data safely
    const data = body?.data || body;

    // We only care about incoming messages (MESSAGES_UPSERT or messages.upsert)
    const messageContent =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.body ||
      '';
    const remoteJid = data?.key?.remoteJid || data?.sender || data?.remoteJid || '';
    const fromMe = data?.key?.fromMe || data?.fromMe || false;

    // Reject groups, self-sent, empty messages
    if (!remoteJid || fromMe || remoteJid.endsWith('@g.us') || !messageContent) {
      console.log('[Webhook] Ignored — fromMe, group, or no text body.');
      return NextResponse.json(
        { status: 'ignored', reason: 'Missing JID, sent by self, or empty text' },
        { status: 200 }
      );
    }

    // Clean phone number (remove @s.whatsapp.net)
    const phoneNumber = remoteJid.replace(/@s\.whatsapp\.net|@g\.us/g, '').replace(/[^0-9]/g, '');

    console.log(`[Webhook] ✉️  Message from ${phoneNumber}: "${messageContent}"`);

    // 1. Save incoming user message to database
    await saveChatMessage(phoneNumber, {
      sender: 'user',
      text: messageContent,
      timestamp: new Date(),
    });

    // 2. Determine Bot Reply based on keywords or default auto-reply text
    // Also load custom autoReplyText from Firestore if set
    const fb = await getFirebase();
    const botSnap = await fb.getDoc(fb.doc(fb.db, 'config', 'whatsapp_bot'));
    const botData = botSnap.exists() ? botSnap.data() : {};
    const isBotActive = botData?.isActive === true || botData?.botActive === true;

    if (!isBotActive) {
      console.log('[Webhook] Bot is disabled — message saved, no reply sent.');
      return NextResponse.json({ status: 'saved', replied: false, reason: 'bot_disabled' });
    }

    const customFallback =
      botData?.autoReplyText ||
      'Hi! I am currently operating a live printing station for an event and will get back to you shortly!';

    let replyText = customFallback;
    const lowerMsg = messageContent.toLowerCase();

    if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('rate')) {
      replyText =
        'Here are our Visriva Live Station Packages:\n• Essential (Photo Booth): ₹15,000\n• Signature (Magnets/Keychains): ₹25,000\n• Platinum (Full Gifting Suite): ₹45,000';
    } else if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
      replyText =
        'Welcome to Visriva Live Station! ✨ We bring high-speed photo booths, custom fridge magnets, keychains, and mugs to your events. How can we elevate your celebration?';
    } else if (lowerMsg.includes('wedding') || lowerMsg.includes('shaadi')) {
      replyText =
        '💍 Congratulations! Visriva specializes in Wedding Live Gifting — instant photo prints, fridge magnets & keychains as return gifts. DM us your event date for a custom quote!';
    } else if (lowerMsg.includes('corporate') || lowerMsg.includes('office') || lowerMsg.includes('bulk')) {
      replyText =
        '🏢 We love corporate events! Branded photo prints, magnets & more — all printed live at your venue. Email visriva.work@gmail.com for bulk pricing.';
    } else if (lowerMsg.includes('book') || lowerMsg.includes('available') || lowerMsg.includes('date')) {
      replyText =
        '📅 To check availability and book, please share:\n1. Event date\n2. City & venue\n3. Expected guest count\n\nCall/WhatsApp: +91 88844 84828';
    } else if (lowerMsg.includes('location') || lowerMsg.includes('where') || lowerMsg.includes('city')) {
      replyText =
        '📍 Visriva operates across India!\nPrimary cities: Bengaluru & Pune.\nWe travel for events — tell us your city and we\'ll confirm availability!';
    }

    // 3. Send reply via Evolution API back to Railway
    const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'visriva-live';

    if (baseUrl && apiKey) {
      console.log(`[Webhook] 🤖 Sending reply to ${phoneNumber}...`);
      const sendRes = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: phoneNumber,
          text: replyText,
        }),
      });

      const sendResult = await sendRes.json().catch(() => ({}));
      console.log('🤖 BOT AUTO-REPLY SENT RESULT:', sendResult);

      // 4. Save outgoing bot message to database
      await saveChatMessage(phoneNumber, {
        sender: 'bot',
        text: replyText,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({ status: 'success', replied: true }, { status: 200 });
  } catch (error: any) {
    console.error('❌ WEBHOOK CRASH ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Health-check — Evolution API will GET this to confirm the endpoint is reachable
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint is active' });
}

// ─── PUT: Update bot settings ─────────────────────────────────────────────────
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const fb = await getFirebase();
    const update: Record<string, unknown> = {};
    if (body.isActive !== undefined) { update.isActive = body.isActive; update.botActive = body.isActive; }
    if (body.botActive !== undefined) { update.isActive = body.botActive; update.botActive = body.botActive; }
    if (body.autoReplyText !== undefined) update.autoReplyText = body.autoReplyText;
    if (body.connectionStatus !== undefined) update.connectionStatus = body.connectionStatus;
    await fb.setDoc(fb.doc(fb.db, 'config', 'whatsapp_bot'), update, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
