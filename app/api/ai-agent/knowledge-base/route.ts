import { NextResponse } from "next/server";

// ─── POST: Knowledge Base File Upload & Chunking ─────────────────────────────

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name;
    const mimeType = file.type;
    const fileSize = file.size;
    const docTitle = title || fileName.replace(/\.[^.]+$/, "");

    // ── 1. Extract text from file ────────────────────────────────────────────
    let extractedText = "";

    if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
      // PDF extraction using pdf-parse
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || "";
      } catch (pdfErr: any) {
        console.error("PDF parse error:", pdfErr);
        return NextResponse.json({
          error: "Failed to parse PDF",
          details: pdfErr.message,
        }, { status: 400 });
      }
    } else if (
      mimeType === "text/plain" ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".md") ||
      fileName.endsWith(".csv")
    ) {
      extractedText = await file.text();
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      // Basic DOCX extraction — extract text from XML
      try {
        const JSZip = (await import("jszip") as any).default || (await import("jszip") as any);
        const buffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);
        const docXml = await zip.file("word/document.xml")?.async("text");
        if (docXml) {
          // Strip XML tags to get plain text
          extractedText = docXml
            .replace(/<w:p[^>]*>/g, "\n")
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
        }
      } catch (docxErr: any) {
        console.error("DOCX parse error:", docxErr);
        // Fallback: try reading as text
        try {
          extractedText = await file.text();
        } catch {
          return NextResponse.json({
            error: "Failed to parse DOCX file",
            details: docxErr.message,
          }, { status: 400 });
        }
      }
    } else {
      // Try reading as plain text
      try {
        extractedText = await file.text();
      } catch {
        return NextResponse.json({
          error: `Unsupported file type: ${mimeType}`,
        }, { status: 400 });
      }
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json({
        error: "No meaningful text could be extracted from the file",
      }, { status: 400 });
    }

    // ── 2. Chunk the text ────────────────────────────────────────────────────
    const chunks = chunkText(extractedText, 500, 50);

    if (chunks.length === 0) {
      return NextResponse.json({
        error: "Text extracted but no valid chunks could be created",
      }, { status: 400 });
    }

    // ── 3. Extract keywords per chunk ────────────────────────────────────────
    const chunksWithKeywords = chunks.map((content, index) => ({
      sourceDocId: "", // Will be set after doc creation
      sourceDocTitle: docTitle,
      content,
      keywords: extractKeywords(content, 15),
      chunkIndex: index,
      charCount: content.length,
    }));

    // ── 4. Store in Firestore ────────────────────────────────────────────────
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const {
      getFirestore, collection, doc, addDoc, setDoc, updateDoc,
      writeBatch, serverTimestamp,
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
    const db = getFirestore(app);

    // Create KB document record
    const kbDocRef = await addDoc(collection(db, "wa_kb_documents"), {
      title: docTitle,
      originalFileName: fileName,
      mimeType,
      fileSize,
      chunkCount: chunks.length,
      status: "processing",
      uploadedAt: serverTimestamp(),
    });

    // Store chunks in subcollection
    const batch = writeBatch(db);
    for (const chunk of chunksWithKeywords) {
      const chunkRef = doc(collection(db, "wa_kb_documents", kbDocRef.id, "chunks"));
      batch.set(chunkRef, {
        ...chunk,
        sourceDocId: kbDocRef.id,
      });
    }
    await batch.commit();

    // Mark document as ready
    await updateDoc(doc(db, "wa_kb_documents", kbDocRef.id), {
      status: "ready",
      chunkCount: chunks.length,
    });

    return NextResponse.json({
      success: true,
      documentId: kbDocRef.id,
      title: docTitle,
      fileName,
      chunkCount: chunks.length,
      totalCharacters: extractedText.length,
    });
  } catch (error: any) {
    console.error("Knowledge Base Upload Error:", error);
    return NextResponse.json({
      error: error.message || "Internal Server Error",
    }, { status: 500 });
  }
}

// ─── GET: List KB documents ──────────────────────────────────────────────────

export async function GET() {
  try {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const { getFirestore, collection, getDocs, query, orderBy } = await import("firebase/firestore");

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "visriva-live-station",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);

    const q = query(collection(db, "wa_kb_documents"), orderBy("uploadedAt", "desc"));
    const snap = await getDocs(q);

    const docs = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ documents: docs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE: Remove a KB document ────────────────────────────────────────────

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("id");

    if (!docId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const {
      getFirestore, collection, doc, deleteDoc, getDocs, writeBatch,
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
    const db = getFirestore(app);

    // Delete chunks
    const chunksSnap = await getDocs(collection(db, "wa_kb_documents", docId, "chunks"));
    const batch = writeBatch(db);
    chunksSnap.forEach((chunkDoc) => batch.delete(chunkDoc.ref));
    await batch.commit();

    // Delete document
    await deleteDoc(doc(db, "wa_kb_documents", docId));

    return NextResponse.json({ success: true, deletedId: docId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── Utility Functions (server-side copies) ──────────────────────────────────

function chunkText(text: string, maxSize: number = 500, overlap: number = 50): string[] {
  if (!text || text.trim().length === 0) return [];
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const paragraphs = cleaned.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (current.length + trimmed.length + 1 <= maxSize) {
      current += (current ? "\n\n" : "") + trimmed;
    } else {
      if (current) chunks.push(current.trim());
      if (trimmed.length > maxSize) {
        const sentences = trimmed.split(/(?<=[.!?])\s+/);
        current = "";
        for (const s of sentences) {
          if (current.length + s.length + 1 <= maxSize) {
            current += (current ? " " : "") + s;
          } else {
            if (current) chunks.push(current.trim());
            current = s;
          }
        }
      } else {
        current = trimmed;
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter((c) => c.length > 10);
}

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by","from",
  "is","are","was","were","be","been","have","has","had","do","does","did","will",
  "would","could","should","this","that","it","its","not","no","so","if","then",
  "than","too","very","just","i","me","my","we","you","your","he","she","they",
]);

function extractKeywords(text: string, max: number = 15): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, max).map(([w]) => w);
}
