import { NextResponse } from "next/server";
import { runMetaDiagnostics } from "@/lib/metaDiagnostics";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await runMetaDiagnostics());
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const diag = await runMetaDiagnostics();
    return NextResponse.json({
      success: diag.webhookVerified && diag.tokenValid,
      manualRequired: true,
      ...diag,
      message: diag.webhookVerified
        ? "Webhook endpoint is ready. Complete the steps below in Meta Developer Console."
        : "Webhook endpoint issue — check Vercel deployment.",
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
