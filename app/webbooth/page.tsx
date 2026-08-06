"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, Printer, Sparkles } from "lucide-react";
import {
  subscribePrintPreviewerConfig,
  PrintPreviewerConfig,
  DEFAULT_PRINT_PREVIEWER_CONFIG,
} from "@/lib/firebase";
import { sendImageToPrintEndpoint } from "@/lib/printJobs";

type BoothPhase = "live" | "preview";

export default function WebBoothPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<BoothPhase>("live");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [config, setConfig] = useState<PrintPreviewerConfig>(DEFAULT_PRINT_PREVIEWER_CONFIG);
  const [cameraError, setCameraError] = useState("");
  const [printing, setPrinting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const unsub = subscribePrintPreviewerConfig(setConfig);
    return unsub;
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Camera access denied";
      setCameraError(msg);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  const composeKeepsake = useCallback(
    async (source: HTMLVideoElement | HTMLImageElement): Promise<{ url: string; blob: Blob }> => {
      const w = 1200;
      const h = 1800;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, "#041a12");
      gradient.addColorStop(0.5, "#011F15");
      gradient.addColorStop(1, "#082e20");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      const framePad = 48;
      const photoTop = 120;
      const photoW = w - framePad * 2;
      const photoH = h - photoTop - 220;

      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 6;
      ctx.strokeRect(framePad, photoTop, photoW, photoH);

      const sw = "videoWidth" in source ? source.videoWidth : source.naturalWidth;
      const sh = "videoHeight" in source ? source.videoHeight : source.naturalHeight;
      const scale = Math.max(photoW / sw, photoH / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      const dx = framePad + (photoW - dw) / 2;
      const dy = photoTop + (photoH - dh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(framePad + 4, photoTop + 4, photoW - 8, photoH - 8);
      ctx.clip();
      ctx.drawImage(source, dx, dy, dw, dh);
      ctx.restore();

      ctx.fillStyle = "#D4AF37";
      ctx.font = "bold 42px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(config.customWatermarkText || "Visriva Live Station", w / 2, 72);

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "24px sans-serif";
      ctx.fillText(config.customNotes || "8-Sec Dye-Sublimation Keepsake", w / 2, h - 120);

      ctx.strokeStyle = "rgba(212,175,55,0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(24, 24, w - 48, h - 48);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
          "image/jpeg",
          0.92
        );
      });
      const url = URL.createObjectURL(blob);
      return { url, blob };
    },
    [config]
  );

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const { url, blob } = await composeKeepsake(video);
      setPreviewUrl(url);
      setPreviewBlob(blob);
      setPhase("preview");
      setStatusMsg("");
    } catch (err: unknown) {
      setStatusMsg(err instanceof Error ? err.message : "Capture failed");
    }
  };

  const resetCapture = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setPreviewBlob(null);
    setPhase("live");
    setStatusMsg("");
    startCamera();
  };

  const printKeepsake = async () => {
    if (!previewBlob) return;
    setPrinting(true);
    setStatusMsg("");
    try {
      const jobId = await sendImageToPrintEndpoint(previewBlob, `booth-${Date.now()}`);
      setStatusMsg(`Sent to print queue · ${jobId.slice(0, 12)}`);
    } catch (err: unknown) {
      setStatusMsg(err instanceof Error ? err.message : "Print failed");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <main className="fixed inset-0 z-[100] bg-[#011F15] text-white overflow-hidden select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_55%)] pointer-events-none" />

      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 sm:px-6 bg-black/40 backdrop-blur-md border-b border-[#D4AF37]/20">
        <div className="flex items-center gap-2 text-[#D4AF37]">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest">Visriva Web Booth</span>
        </div>
        <span className="text-[10px] sm:text-xs text-emerald-100/60 uppercase tracking-wider">Guest Capture Station</span>
      </header>

      <div className="absolute inset-0 pt-14 pb-28 flex items-center justify-center">
        {phase === "live" && (
          <div className="relative w-full h-full max-w-4xl mx-auto px-3 sm:px-6">
            {cameraError ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <p className="text-red-300 text-sm max-w-md">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 rounded-full bg-gold-gradient text-[#011F15] font-bold text-sm"
                >
                  Retry Camera
                </button>
              </div>
            ) : (
              <div className="relative h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="max-h-[75vh] w-auto max-w-full rounded-2xl border-4 border-[#D4AF37]/70 shadow-[0_0_40px_rgba(212,175,55,0.25)] object-cover mirror"
                  style={{ transform: "scaleX(-1)" }}
                />
                <div className="absolute inset-4 sm:inset-8 border-2 border-[#D4AF37]/30 rounded-2xl pointer-events-none" />
                <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-black/50 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
                  {config.customWatermarkText || "Visriva Live"}
                </div>
              </div>
            )}
          </div>
        )}

        {phase === "preview" && previewUrl && (
          <div className="relative w-full h-full max-w-md mx-auto px-4 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Keepsake preview"
              className="max-h-[75vh] w-auto rounded-2xl border-4 border-[#D4AF37]/80 shadow-2xl"
            />
          </div>
        )}
      </div>

      <footer className="absolute bottom-0 left-0 right-0 z-20 px-4 py-4 sm:py-6 bg-black/50 backdrop-blur-xl border-t border-[#D4AF37]/20">
        {statusMsg && (
          <p className="text-center text-xs text-emerald-200/90 mb-3 font-medium">{statusMsg}</p>
        )}

        <div className="flex items-center justify-center gap-4 sm:gap-6">
          {phase === "live" ? (
            <button
              onClick={capturePhoto}
              disabled={!!cameraError}
              className="group relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 border-4 border-[#D4AF37] hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
              aria-label="Capture photo"
            >
              <span className="absolute inset-2 rounded-full bg-gold-gradient opacity-90 group-hover:opacity-100" />
              <Camera className="relative z-10 w-8 h-8 text-[#011F15]" />
            </button>
          ) : (
            <>
              <button
                onClick={resetCapture}
                className="flex items-center gap-2 px-5 py-3 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-bold uppercase tracking-wider"
              >
                <RotateCcw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={printKeepsake}
                disabled={printing}
                className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-gold-gradient text-[#011F15] font-extrabold text-sm uppercase tracking-wider shadow-gold-md hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                <Printer className="w-5 h-5" />
                {printing ? "Sending…" : "Print Keepsake"}
              </button>
            </>
          )}
        </div>
      </footer>
    </main>
  );
}
