"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  subscribePrintPreviewerConfig,
  PrintPreviewerConfig,
  DEFAULT_PRINT_PREVIEWER_CONFIG,
} from "@/lib/firebase";
import { sendImageToPrintEndpoint } from "@/lib/printJobs";
import { compose2x6Strip } from "@/lib/composeStrip";

type BoothStep = "idle" | "shooting" | "preview";

export default function WebBoothPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [shots, setShots] = useState<string[]>([]);
  const [step, setStep] = useState<BoothStep>("idle");
  const [stripPreview, setStripPreview] = useState<string>("");
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
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      try {
        await video.play();
      } catch (playErr: unknown) {
        const name = playErr instanceof Error ? playErr.name : "";
        if (name !== "AbortError") throw playErr;
      }
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Camera access denied";
      setCameraError(msg);
      console.error("Camera access error:", err);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    startCamera();
    return () => {
      mountedRef.current = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [startCamera]);

  const captureFrame = (): string | null => {
    const video = videoRef.current;
    if (!video) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const startSequence = async () => {
    if (cameraError) return;
    setShots([]);
    setStripPreview("");
    setStatusMsg("");
    setStep("shooting");
    const newShots: string[] = [];

    for (let i = 1; i <= 3; i++) {
      for (let c = 3; c > 0; c--) {
        setCountdown(c);
        await new Promise((res) => setTimeout(res, 1000));
      }
      setCountdown(null);

      const frame = captureFrame();
      if (frame) {
        newShots.push(frame);
        setShots([...newShots]);
      }

      if (i < 3) await new Promise((res) => setTimeout(res, 1000));
    }

    if (newShots.length === 0) {
      setStatusMsg("Capture failed — no frames recorded");
      setStep("idle");
      return;
    }

    try {
      const blob = await compose2x6Strip(newShots, {
        watermark: config.customWatermarkText || "Visriva Live Station",
        subtitle: config.customNotes || "2x6 Dye-Sublimation Strip",
      });
      setStripPreview(URL.createObjectURL(blob));
    } catch (err: unknown) {
      console.warn("Strip preview note:", err);
    }

    setStep("preview");
  };

  const resetSession = () => {
    if (stripPreview) URL.revokeObjectURL(stripPreview);
    setStripPreview("");
    setShots([]);
    setStep("idle");
    setStatusMsg("");
    setCountdown(null);
  };

  const sendToPrinter = async () => {
    if (shots.length === 0) return;
    setPrinting(true);
    setStatusMsg("");
    try {
      const blob = await compose2x6Strip(shots, {
        watermark: config.customWatermarkText || "Visriva Live Station",
        subtitle: config.customNotes || "2x6 Dye-Sublimation Strip",
      });
      const captureId = `booth-2x6-${Date.now()}`;
      const jobId = await sendImageToPrintEndpoint(blob, captureId);
      setStatusMsg(`Sent to print queue · ${jobId.slice(0, 12)}`);
      setTimeout(() => resetSession(), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Print queue failed";
      setStatusMsg(msg);
      console.error(err);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <main className="relative w-screen h-screen bg-[#011F15] text-[#D4AF37] overflow-hidden flex flex-col items-center justify-between p-4 sm:p-6 select-none">
      <div className="flex items-center space-x-3 z-10 pt-2">
        <h1 className="text-lg sm:text-xl tracking-widest uppercase font-serif text-[#D4AF37]">
          Visriva Live Station
        </h1>
      </div>

      <div className="relative w-full max-w-2xl aspect-[4/3] rounded-3xl overflow-hidden border-2 border-[#D4AF37]/30 bg-black/40 shadow-2xl flex items-center justify-center">
        {cameraError ? (
          <div className="text-center p-6 space-y-4">
            <p className="text-red-300 text-sm">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-6 py-3 rounded-full bg-gold-gradient text-[#011F15] font-bold text-sm"
            >
              Retry Camera
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
        )}

        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <span className="text-7xl sm:text-9xl font-extrabold text-[#D4AF37] drop-shadow-[0_0_35px_rgba(212,175,55,0.8)]">
                {countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {step === "preview" && (
          <div className="absolute inset-0 bg-[#011F15]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-serif mb-4 text-white">
              Your 2x6 Keepsake Strip
            </h2>
            {stripPreview ? (
              <img
                src={stripPreview}
                alt="2x6 strip preview"
                className="max-h-[45vh] w-auto rounded-lg border-2 border-[#D4AF37] shadow-2xl mb-4"
              />
            ) : (
              <div className="flex gap-3 mb-6">
                {shots.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Shot ${idx + 1}`}
                    className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-lg border border-[#D4AF37]"
                  />
                ))}
              </div>
            )}
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={resetSession}
                className="px-5 sm:px-6 py-3 rounded-full border border-[#D4AF37] text-[#D4AF37] font-semibold hover:bg-[#D4AF37]/10"
              >
                Retake
              </button>
              <button
                onClick={sendToPrinter}
                disabled={printing}
                className="px-6 sm:px-8 py-3 rounded-full bg-[#D4AF37] text-[#011F15] font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-60"
              >
                {printing ? "Sending…" : "Print 2x6 Strip"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-4 z-10 bg-white/5 p-4 rounded-2xl backdrop-blur-md border border-white/10">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-14 h-[4.5rem] rounded-lg bg-black/60 border border-white/20 overflow-hidden flex items-center justify-center text-xs text-white/40"
            >
              {shots[i] ? (
                <img src={shots[i]} alt={`Shot ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                `Shot ${i + 1}`
              )}
            </div>
          ))}
        </div>

        {statusMsg && (
          <p className="text-xs text-emerald-200/90 font-medium text-center">{statusMsg}</p>
        )}

        {step === "idle" && !cameraError && (
          <button
            onClick={startSequence}
            className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#AA8417] text-[#011F15] font-bold text-base sm:text-lg shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-105 transition-transform"
          >
            TAP TO START
          </button>
        )}

        {step === "shooting" && countdown === null && (
          <span className="text-sm text-emerald-100/70 uppercase tracking-widest animate-pulse">
            Capturing…
          </span>
        )}
      </div>
    </main>
  );
}
