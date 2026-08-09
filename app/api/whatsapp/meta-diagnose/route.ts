import { NextResponse } from "next/server";
import { runMetaDiagnostics } from "@/lib/metaDiagnostics";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await runMetaDiagnostics();
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
