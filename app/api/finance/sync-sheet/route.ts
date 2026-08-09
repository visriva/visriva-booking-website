import { NextResponse } from "next/server";
import { isOperationsApiAuthorized } from "@/lib/operationsApiAuth";
import { SHEET_HEADERS, transactionToSheetRow, type FinanceSettings } from "@/lib/financeConfig";
import type { FinanceTransaction } from "@/lib/finance";

export const runtime = "nodejs";

async function getSettingsAdmin(): Promise<FinanceSettings> {
  const { adminDb } = await import("@/lib/firebaseAdmin");
  if (!adminDb) return {};
  const snap = await adminDb.collection("config").doc("finance_settings").get();
  return snap.exists ? (snap.data() as FinanceSettings) : {};
}

export async function POST(req: Request) {
  if (!isOperationsApiAuthorized()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettingsAdmin();
  const webhook = settings.googleSheetWebhookUrl?.trim();
  if (!webhook) {
    return NextResponse.json(
      {
        error: "Google Sheet webhook not configured",
        hint: "Add Apps Script webhook URL in Finance → Sheet Sync settings",
      },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const transactions = (body.transactions || []) as FinanceTransaction[];
    const single = body.transaction as FinanceTransaction | undefined;
    const rows = transactions.length
      ? transactions.map((t) => transactionToSheetRow(t))
      : single
        ? [transactionToSheetRow(single)]
        : [];

    if (!rows.length) {
      return NextResponse.json({ error: "No transactions to sync" }, { status: 400 });
    }

    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headers: SHEET_HEADERS, rows }),
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: `Sheet sync failed: ${text.slice(0, 200)}` }, { status: 502 });
    }

    return NextResponse.json({ success: true, synced: rows.length, response: text.slice(0, 200) });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
