import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { requireAdminRequest } from "@/lib/requireAdminRequest";

export const runtime = "nodejs";

/**
 * Deletes a gallery item and its Storage object.
 *
 * Previously unauthenticated. Because it runs on firebase-admin — which bypasses
 * firestore.rules — anyone could POST here to delete any galleries/{id} doc. The
 * storage path was also taken straight from the request body and handed to
 * bucket.file(path).delete(), so an arbitrary path deleted an arbitrary object
 * anywhere in the bucket, gallery-related or not.
 *
 * Now: requires the `admin` claim, and the path is derived from the gallery doc
 * itself and confined to the galleries/ prefix. Body-supplied paths are ignored.
 */

const GALLERY_PREFIX = "galleries/";

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
  const gate = await requireAdminRequest(request);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const body = await request.json();
    const id = body?.id as string;

    if (!id) {
      return NextResponse.json({ error: "Missing gallery id" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin not configured on server" },
        { status: 503 }
      );
    }

    const docRef = adminDb.collection("galleries").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
    }

    // Trust the stored record, never the caller, for what gets deleted.
    const data = snap.data() || {};
    const stored = typeof data.storagePath === "string" ? data.storagePath : null;
    const fromUrl =
      typeof data.url === "string" && data.url.startsWith("http")
        ? storagePathFromDownloadUrl(data.url)
        : null;
    const storagePath = stored || fromUrl;

    const storageDeleted = { ok: false, path: storagePath };

    if (storagePath && !storagePath.startsWith(GALLERY_PREFIX)) {
      // Doc points outside the gallery tree — refuse rather than delete blindly.
      console.warn(
        `[gallery/delete] refusing out-of-scope storage path for ${id}: ${storagePath}`
      );
    } else if (storagePath && getApps().length > 0) {
      try {
        const bucket = getStorage().bucket();
        await bucket.file(storagePath).delete({ ignoreNotFound: true });
        storageDeleted.ok = true;
      } catch (storageErr: unknown) {
        const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
        console.warn("Admin storage delete note:", msg);
      }
    }

    await docRef.delete();

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
