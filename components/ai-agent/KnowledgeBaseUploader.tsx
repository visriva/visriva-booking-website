"use client";

import { useState, useRef, useEffect } from "react";
import type { KBDocument } from "@/types/whatsapp-agent";
import { subscribeKBDocuments } from "@/lib/ai-agent";

export default function KnowledgeBaseUploader() {
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeKBDocuments((docs) => setDocuments(docs));
    return () => unsub();
  }, []);

  const handleUpload = async (file: File) => {
    setError("");
    setUploading(true);
    setUploadProgress("Uploading and processing...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^.]+$/, ""));

      const res = await fetch("/api/ai-agent/knowledge-base", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Upload failed");
      } else {
        setUploadProgress(`✅ Processed: ${data.chunkCount} chunks created`);
        setTimeout(() => setUploadProgress(""), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its chunks?`)) return;

    try {
      const res = await fetch(`/api/ai-agent/knowledge-base?id=${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Delete failed");
      }
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleUpload(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleUpload(files[0]);
    e.target.value = "";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📚 Knowledge Base</h3>
      <p style={styles.subtitle}>
        Upload documents to improve AI responses. The system automatically extracts
        text, chunks it, and uses it for RAG-powered answers.
      </p>

      {/* Upload Area */}
      <div
        style={{
          ...styles.dropZone,
          borderColor: dragOver ? "#6366f1" : "rgba(255,255,255,0.1)",
          background: dragOver ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.csv,.docx"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <div style={styles.dropIcon}>
          {uploading ? "⏳" : "📄"}
        </div>
        <p style={styles.dropText}>
          {uploading
            ? uploadProgress
            : "Drop a file here or click to upload"}
        </p>
        <p style={styles.dropHint}>
          Supports: PDF, TXT, MD, CSV, DOCX
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBanner}>
          ⚠️ {error}
          <button onClick={() => setError("")} style={styles.errorClose}>✕</button>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress && !uploading && (
        <div style={styles.successBanner}>{uploadProgress}</div>
      )}

      {/* Document List */}
      <div style={styles.docList}>
        {documents.length === 0 ? (
          <div style={styles.emptyDocs}>
            No documents uploaded yet. Upload files to build your knowledge base.
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} style={styles.docItem}>
              <div style={styles.docIcon}>
                {doc.mimeType?.includes("pdf") ? "📕" :
                 doc.mimeType?.includes("word") ? "📘" : "📄"}
              </div>
              <div style={styles.docInfo}>
                <div style={styles.docTitle}>{doc.title}</div>
                <div style={styles.docMeta}>
                  {doc.originalFileName} • {formatFileSize(doc.fileSize || 0)} •{" "}
                  {doc.chunkCount} chunks
                  {doc.status === "processing" && (
                    <span style={styles.processingBadge}>Processing...</span>
                  )}
                  {doc.status === "error" && (
                    <span style={styles.errorBadge}>Error</span>
                  )}
                  {doc.status === "ready" && (
                    <span style={styles.readyBadge}>Ready</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc.id!, doc.title)}
                style={styles.deleteBtn}
                title="Delete document"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "0",
  },
  title: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#f1f5f9",
    margin: "0 0 4px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 16px",
    lineHeight: "1.5",
  },
  dropZone: {
    padding: "28px",
    border: "2px dashed",
    borderRadius: "12px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginBottom: "16px",
  },
  dropIcon: {
    fontSize: "32px",
    marginBottom: "8px",
  },
  dropText: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: "0 0 4px",
  },
  dropHint: {
    fontSize: "11px",
    color: "#64748b",
    margin: 0,
  },
  errorBanner: {
    padding: "10px 14px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    color: "#f87171",
    fontSize: "12px",
    marginBottom: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorClose: {
    background: "none",
    border: "none",
    color: "#f87171",
    cursor: "pointer",
    fontSize: "14px",
    padding: "2px",
  },
  successBanner: {
    padding: "10px 14px",
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    borderRadius: "8px",
    color: "#34d399",
    fontSize: "12px",
    marginBottom: "12px",
  },
  docList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  emptyDocs: {
    padding: "24px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  docItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px",
    transition: "all 0.15s ease",
  },
  docIcon: {
    fontSize: "22px",
    flexShrink: 0,
  },
  docInfo: {
    flex: 1,
    minWidth: 0,
  },
  docTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#e2e8f0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  docMeta: {
    fontSize: "11px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexWrap: "wrap",
  },
  processingBadge: {
    fontSize: "10px",
    color: "#f59e0b",
    background: "rgba(245, 158, 11, 0.1)",
    padding: "1px 5px",
    borderRadius: "4px",
  },
  errorBadge: {
    fontSize: "10px",
    color: "#f87171",
    background: "rgba(239, 68, 68, 0.1)",
    padding: "1px 5px",
    borderRadius: "4px",
  },
  readyBadge: {
    fontSize: "10px",
    color: "#34d399",
    background: "rgba(16, 185, 129, 0.1)",
    padding: "1px 5px",
    borderRadius: "4px",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px",
    opacity: 0.6,
    transition: "opacity 0.15s ease",
    flexShrink: 0,
  },
};
