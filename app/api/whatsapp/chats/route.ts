import { NextResponse } from 'next/server';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const EVO_URL      = (process.env.EVOLUTION_API_URL      || 'https://evolution-api-production-d446.up.railway.app').replace(/\/$/, '');
const EVO_KEY      = process.env.EVOLUTION_API_KEY       || 'VisrivaSecretKey2026_SecureKey';
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'visriva-live';

// ─── Firebase init ───────────────────────────────────────────────────────────
async function getFirebase() {
  const { initializeApp, getApps, getApp } = await import('firebase/app');
  const {
    getFirestore, doc, getDoc, collection,
    getDocs, addDoc, setDoc, query, orderBy, limit, serverTimestamp,
  } = await import('firebase/firestore');

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

  return {
    db: getFirestore(app),
    doc, getDoc, collection, getDocs, addDoc,
    setDoc, query, orderBy, limit, serverTimestamp,
  };
}

// ─── GET — list threads or fetch messages for one phone ──────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const fb = await getFirebase();

    // ── Fetch messages for a specific thread ─────────────────────────────────
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');

      // Gracefully return empty array if the thread doesn't exist yet
      const messagesRef = fb.collection(fb.db, 'chats', cleanPhone, 'messages');
      let snap;
      try {
        const q = fb.query(messagesRef, fb.orderBy('timestamp', 'asc'), fb.limit(200));
        snap = await fb.getDocs(q);
      } catch {
        // Index not ready yet — fall back to unordered fetch
        snap = await fb.getDocs(messagesRef);
      }

      const messages = snap.docs.map((d) => {
        const data = d.data();
        return {
          id:        d.id,
          sender:    data.sender   ?? 'user',
          text:      data.text     ?? '',
          timestamp: data.timestamp?.toDate?.()?.toISOString?.() ?? null,
        };
      });

      // Sort client-side as fallback
      messages.sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return ta - tb;
      });

      return NextResponse.json({ messages });
    }

    // ── List all chat threads ────────────────────────────────────────────────
    const threadsRef = fb.collection(fb.db, 'chats');
    let snap;
    try {
      snap = await fb.getDocs(threadsRef);
    } catch {
      // Firestore not initialised or empty collection — return empty gracefully
      return NextResponse.json({ threads: [] });
    }

    const threads = snap.docs.map((d) => {
      const data = d.data();
      return {
        phoneNum:      d.id,
        displayName:   data.displayName   || d.id,
        lastMessage:   data.lastMessage   || '',
        lastTimestamp: data.lastTimestamp?.toDate?.()?.toISOString?.() ?? null,
      };
    });

    // Sort by most recent
    threads.sort((a, b) => {
      const ta = a.lastTimestamp ? new Date(a.lastTimestamp).getTime() : 0;
      const tb = b.lastTimestamp ? new Date(b.lastTimestamp).getTime() : 0;
      return tb - ta;
    });

    return NextResponse.json({ threads });

  } catch (error: any) {
    console.error('[chats GET] Error:', error);
    // Never crash the frontend — return empty arrays
    return NextResponse.json({ threads: [], messages: [], error: error.message });
  }
}

// ─── POST — send a manual admin message ──────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { phone, text } = await req.json();

    if (!phone || !text?.trim()) {
      return NextResponse.json({ error: 'phone and text are required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Send via Evolution API
    const sendRes = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number: cleanPhone, text: text.trim() }),
    });

    if (!sendRes.ok) {
      const err = await sendRes.text();
      console.error('[chats POST] sendText failed:', err);
      return NextResponse.json({ error: `Evolution API error: ${err}` }, { status: sendRes.status });
    }

    // Save admin message to Firestore
    const fb = await getFirebase();
    await fb.addDoc(fb.collection(fb.db, 'chats', cleanPhone, 'messages'), {
      sender:    'admin',
      text:      text.trim(),
      timestamp: fb.serverTimestamp(),
    });

    await fb.setDoc(
      fb.doc(fb.db, 'chats', cleanPhone),
      {
        lastMessage:   text.trim().slice(0, 120),
        lastTimestamp: fb.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[chats POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
