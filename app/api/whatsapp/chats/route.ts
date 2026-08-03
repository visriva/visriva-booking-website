import { NextResponse } from 'next/server';
import { getAllChatThreads, getChatMessages, saveChatMessage } from '@/lib/chatStore';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const EVO_URL      = (process.env.EVOLUTION_API_URL      || 'https://evolution-api-production-d446.up.railway.app').replace(/\/$/, '');
const EVO_KEY      = process.env.EVOLUTION_API_KEY       || 'VisrivaSecretKey2026_SecureKey';
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'visriva-live';

// ─── GET: Fetch all chat threads OR message history ──────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    // ── 1. Fetch messages for a specific phone number thread ──────────────────
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (!cleanPhone) {
        return NextResponse.json({ messages: [] });
      }

      const messages = await getChatMessages(cleanPhone);
      return NextResponse.json({ messages });
    }

    // ── 2. List all active chat threads ───────────────────────────────────────
    const threads = await getAllChatThreads();
    return NextResponse.json({ threads });

  } catch (error: any) {
    console.error('[chats GET] Error:', error);
    // Never crash the client UI — return empty arrays
    return NextResponse.json({ threads: [], messages: [], error: error.message });
  }
}

// ─── POST: Send a manual admin message ────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { phone, text } = await req.json();

    if (!phone || !text?.trim()) {
      return NextResponse.json({ error: 'phone and text are required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Send text message via Evolution API
    const sendRes = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVO_KEY,
      },
      body: JSON.stringify({
        number: cleanPhone,
        text:   text.trim(),
      }),
    });

    if (!sendRes.ok) {
      const err = await sendRes.text();
      console.error('[chats POST] sendText failed:', err);
      return NextResponse.json({ error: `Evolution API error: ${err}` }, { status: sendRes.status });
    }

    // Save admin reply to resilient chatStore
    await saveChatMessage(cleanPhone, {
      sender: 'admin',
      text: text.trim(),
      timestamp: new Date()
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[chats POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
