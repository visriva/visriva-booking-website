import { NextResponse } from 'next/server';
import { configureEvolutionTls } from '@/lib/evolutionApi';
import { registerEvolutionWebhook } from '@/lib/registerEvolutionWebhook';

configureEvolutionTls();

export async function POST() {
  try {
    const result = await registerEvolutionWebhook();
    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          url: result.url,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (error: any) {
    console.error('[sync-webhook] error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
