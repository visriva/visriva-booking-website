import { NextResponse } from 'next/server';
import { getAllChatThreads, getChatMessages, saveChatMessage } from '@/lib/chatStore';
import { configureEvolutionTls } from '@/lib/evolutionApi';
import { sendEvolutionText } from '@/lib/evolutionSend';

configureEvolutionTls();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (!cleanPhone) {
        return NextResponse.json({ messages: [] });
      }

      const messages = await getChatMessages(cleanPhone);
      return NextResponse.json({ messages });
    }

    const threads = await getAllChatThreads();
    return NextResponse.json({ threads });

  } catch (error: any) {
    console.error('[chats GET] Error:', error);
    return NextResponse.json({ threads: [], messages: [], error: error.message });
  }
}

export async function POST(req: Request) {
  try {
    const { phone, text } = await req.json();

    if (!phone || !text?.trim()) {
      return NextResponse.json({ error: 'phone and text are required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const sendResult = await sendEvolutionText(cleanPhone, text.trim(), '[Admin]');

    if (!sendResult.ok) {
      return NextResponse.json({ error: sendResult.error || 'Send failed' }, { status: 502 });
    }

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
