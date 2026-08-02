import { NextResponse } from "next/server";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// ─── Firebase Init (server-side dynamic import) ───────────────────────────────
async function getFirebase() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    serverTimestamp,
  } = await import("firebase/firestore");

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "visriva-live-station",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return {
    db: getFirestore(app),
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    serverTimestamp,
  };
}

// ─── Evolution API Config ─────────────────────────────────────────────────────
async function getEvolutionConfig() {
  const defaults = {
    url: "https://evolution-api-production-d446.up.railway.app",
    key: "VisrivaSecretKey2026_SecureKey",
    instance: "visriva-live",
  };

  try {
    const fb = await getFirebase();
    const snap = await fb.getDoc(fb.doc(fb.db, "config", "operator"));
    if (snap.exists()) {
      const d = snap.data();
      let url = d.backupEvoApiUrl || process.env.EVOLUTION_API_URL || defaults.url;
      url = url.replace(/\/$/, "");
      if (!url.startsWith("http")) url = "https://" + url;
      return {
        url,
        key: d.backupEvoApiKey || process.env.EVOLUTION_API_KEY || defaults.key,
        instance: d.backupInstanceName || process.env.EVOLUTION_INSTANCE_NAME || defaults.instance,
      };
    }
  } catch {}

  return {
    url: (process.env.EVOLUTION_API_URL || defaults.url).replace(/\/$/, ""),
    key: process.env.EVOLUTION_API_KEY || defaults.key,
    instance: process.env.EVOLUTION_INSTANCE_NAME || defaults.instance,
  };
}

// ─── Smart keyword-based reply builder ───────────────────────────────────────
function buildSmartReply(incomingText: string, customReply: string): string {
  const t = incomingText.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|hii|helo|namaste|good\s*(morning|afternoon|evening|night))/.test(t)) {
    return `Hi there! 👋 Welcome to *Visriva Live Gifting Station* 🎁\n\nWe create instant custom gifts at your event — Photo Prints, Fridge Magnets, Keychains, Live Mugs, Tote Bags & more!\n\nHow can we help you today? You can ask about:\n• 📦 Products & Pricing\n• 🎪 Event Packages\n• 📍 Booking availability`;
  }

  // Pricing / cost
  if (/price|cost|rate|charge|how much|fees?|package/.test(t)) {
    return `Here's a quick overview of our *Visriva Gifting Packages* 💛\n\n🖼️ Photo Print — ₹50/unit\n🧲 Fridge Magnet — ₹80/unit\n🔑 Keychain — ₹70/unit\n☕ Live Mug — ₹120/unit\n👜 Tote Bag — ₹150/unit\n\nCorporate & Wedding bulk packages available! Reply *CORPORATE* or *WEDDING* for details.`;
  }

  // Corporate
  if (/corporate|office|company|b2b|bulk|business/.test(t)) {
    return `We'd love to work with your corporate team! 🏢✨\n\n*Corporate Gifting with Visriva includes:*\n• Branded photo prints & magnets\n• Same-day delivery at venue\n• Minimum 50 units for custom pricing\n• Dedicated on-site operator\n\n📞 To book, call/WhatsApp: +91 88844 84828\n📧 Email: visriva.work@gmail.com`;
  }

  // Wedding
  if (/wedding|shaadi|marriage|bride|groom|reception/.test(t)) {
    return `Congratulations on your big day! 💍🎊\n\n*Visriva Wedding Package:*\n• Live photo booth with instant prints\n• Custom fridge magnets as return gifts\n• Personalized keychains & mugs\n• Beautiful packaging for guests\n\nPerfect for Mehendi, Sangeet, Reception!\nCall us: *+91 88844 84828* or email *visriva.work@gmail.com*`;
  }

  // Products
  if (/product|item|what do you|what can|offer|sell|make|create/.test(t)) {
    return `*Visriva Live Gifting Station* 🎁 creates:\n\n📸 Photo Prints (instant!)\n🧲 Fridge Magnets\n🔑 Keychains\n☕ Live Mugs\n🛍️ Tote Bags\n🖼️ Photo Frames\n\nAll items are printed on-site at your event within minutes! Perfect for corporate events, weddings & exhibitions.\n\nInterested? Reply with your event date & city!`;
  }

  // Location / where
  if (/where|location|city|bangalore|bengaluru|pune|delhi|mumbai|available|come to/.test(t)) {
    return `📍 *Visriva Live Gifting Station* operates across India!\n\nPrimary cities:\n• Bengaluru, Karnataka\n• Pune, Maharashtra\n\nWe also travel to other cities for events. Let us know your city & event date and we'll check availability!\n\n📞 +91 88844 84828\n📧 visriva.work@gmail.com`;
  }

  // Booking
  if (/book|hire|reserve|available|slot|date/.test(t)) {
    return `Great! Let's get your event booked 📅\n\nPlease share:\n1️⃣ Your event date\n2️⃣ City / Venue\n3️⃣ Expected guest count\n4️⃣ Products you'd like (prints, magnets, etc.)\n\nOur team will confirm availability and send a quote!\n\n📞 Also reachable at: *+91 88844 84828*`;
  }

  // Thank you
  if (/thank|thanks|thx|great|awesome|perfect|wonderful/.test(t)) {
    return `You're very welcome! 😊 We're glad to help.\n\nFeel free to reach out anytime:\n📞 *+91 88844 84828*\n📧 visriva.work@gmail.com\n📸 instagram.com/visriva.live\n\n*Visriva Live Gifting Station* — Creating memories, one print at a time! ✨`;
  }

  // Fallback to custom reply
  return customReply;
}

// ─── Save message to Firestore ────────────────────────────────────────────────
async function saveMessage(
  fb: Awaited<ReturnType<typeof getFirebase>>,
  phone: string,
  sender: "user" | "bot" | "admin",
  text: string,
  displayName?: string
) {
  try {
    const messagesRef = fb.collection(fb.db, "chats", phone, "messages");
    await fb.addDoc(messagesRef, {
      sender,
      text,
      timestamp: fb.serverTimestamp(),
    });

    await fb.setDoc(
      fb.doc(fb.db, "chats", phone),
      {
        phoneNum: phone,
        displayName: displayName || phone,
        lastMessage: text.slice(0, 120),
        lastTimestamp: fb.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("[chatStore] Failed to save message:", err);
  }
}

// ─── POST: Receive Evolution API Webhook ─────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[Webhook] Received event:", body.event);

    // Accept both events.upsert and messages.upsert naming variants
    if (body.event !== "messages.upsert" && body.event !== "MESSAGES_UPSERT") {
      return NextResponse.json({ status: "IGNORED_EVENT", event: body.event });
    }

    const messageData = body.data;
    const fromMe: boolean = messageData?.key?.fromMe === true;
    const remoteJid: string = messageData?.key?.remoteJid || "";
    const pushName: string = messageData?.pushName || messageData?.data?.pushName || "";

    // Extract text from various message types
    const incomingText: string =
      messageData?.message?.conversation ||
      messageData?.message?.extendedTextMessage?.text ||
      messageData?.message?.imageMessage?.caption ||
      messageData?.message?.documentMessage?.caption ||
      "";

    // Reject own messages and group chats
    if (fromMe || !remoteJid || remoteJid.endsWith("@g.us")) {
      console.log("[Webhook] Ignoring — fromMe or group:", remoteJid);
      return NextResponse.json({ status: "IGNORED_SENDER" });
    }

    // Clean phone number (strip @s.whatsapp.net, keep only digits)
    const phone = remoteJid.replace(/@.*$/, "").replace(/[^0-9]/g, "");

    console.log(`[Webhook] Message from ${phone} (${pushName}): "${incomingText}"`);

    const fb = await getFirebase();

    // Save incoming user message to Firestore (always, regardless of bot state)
    if (incomingText) {
      await saveMessage(fb, phone, "user", incomingText, pushName || phone);
    }

    // Load bot config
    const botSnap = await fb.getDoc(fb.doc(fb.db, "config", "whatsapp_bot"));
    const botData = botSnap.exists() ? botSnap.data() : {};
    const isBotActive = botData?.isActive === true || botData?.botActive === true;
    const customReply =
      botData?.autoReplyText ||
      "Hi! I am currently operating a live printing station for an event and will get back to you shortly!";

    if (!isBotActive) {
      console.log("[Webhook] Bot is disabled — message saved but no auto-reply sent.");
      return NextResponse.json({ status: "BOT_DISABLED", saved: true });
    }

    if (!incomingText) {
      console.log("[Webhook] No text body (media/sticker?) — skipping reply.");
      return NextResponse.json({ status: "NO_TEXT_BODY" });
    }

    // Build smart reply
    const replyText = buildSmartReply(incomingText, customReply);
    console.log(`[Webhook] Sending reply to ${phone}: "${replyText.slice(0, 60)}..."`);

    // Send reply via Evolution API
    const config = await getEvolutionConfig();
    const sendRes = await fetch(`${config.url}/message/sendText/${config.instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.key,
      },
      body: JSON.stringify({
        number: phone,
        options: { delay: 1200, presence: "composing" },
        textMessage: { text: replyText },
      }),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      console.error("[Webhook] sendText failed:", errText);
      return NextResponse.json(
        { error: "Failed to send auto-reply", details: errText },
        { status: 500 }
      );
    }

    // Save bot reply to Firestore
    await saveMessage(fb, phone, "bot", replyText, pushName || phone);

    console.log(`[Webhook] ✅ Auto-reply sent and saved for ${phone}`);
    return NextResponse.json({ success: true, phone, reply: replyText.slice(0, 80) });
  } catch (error: any) {
    console.error("[Webhook] Fatal error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}

// ─── PUT: Update bot settings ─────────────────────────────────────────────────
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const fb = await getFirebase();
    const botRef = fb.doc(fb.db, "config", "whatsapp_bot");

    const update: Record<string, unknown> = {};
    if (body.isActive !== undefined) { update.isActive = body.isActive; update.botActive = body.isActive; }
    if (body.botActive !== undefined) { update.isActive = body.botActive; update.botActive = body.botActive; }
    if (body.autoReplyText !== undefined) update.autoReplyText = body.autoReplyText;
    if (body.connectionStatus !== undefined) update.connectionStatus = body.connectionStatus;
    if (body.lastSyncedAt !== undefined) update.lastSyncedAt = body.lastSyncedAt;

    await fb.setDoc(botRef, update, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
