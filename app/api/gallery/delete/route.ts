import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

export const runtime = "nodejs";

function storagePathFromDownloadUrl(url: string): string | null {
  try {
    const firebaseMatch = url.match(/\/o\/([^?]+)/);
    if (firebaseMatch) return decodeURIComponent(firebaseMatch[1]);
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body?.id as string;
    const storageUrl = body?.storageUrl as string | undefined;
    const storagePath =
      (body?.storagePath as string | undefined) ||
      (storageUrl?.startsWith("http") ? storagePathFromDownloadUrl(storageUrl) : null);

    if (!id) {
      return NextResponse.json({ error: "Missing gallery id" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin not configured on server" },
        { status: 503 }
      );
    }

    const storageDeleted = { ok: false, path: storagePath };
    if (storagePath && getApps().length > 0) {
      try {
        const bucket = getStorage().bucket();
        await bucket.file(storagePath).delete({ ignoreNotFound: true });
        storageDeleted.ok = true;
      } catch (storageErr: unknown) {
        const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
        console.warn("Admin storage delete note:", msg);
      }
    }

    await adminDb.collection("galleries").doc(id).delete();

    return NextResponse.json({
      ok: true,
      id,
      storageDeleted: storageDeleted.ok,
      storagePath: storagePath || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gallery delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
