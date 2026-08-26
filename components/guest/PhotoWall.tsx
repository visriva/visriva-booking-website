"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, CheckCircle2, Loader2, Upload } from "lucide-react";
import confetti from "canvas-confetti";
import { compressImageFile } from "@/lib/firebase";
import {
  GUEST_PHOTO_BUCKET,
  getSupabaseGuestBrowser,
  type PhotoRow,
} from "@/lib/supabaseGuest";

interface Props {
  eventId: string;
  guestName: string;
  guestId?: string | null;
}

const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=80",
];

type WallPhoto = { id: string; url: string; guest_name?: string };
type ScanPhase = "idle" | "uploading" | "scanning" | "approved" | "queued";

export default function PhotoWall({ eventId, guestName, guestId }: Props) {
  const [photos, setPhotos] = useState<WallPhoto[]>([]);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [error, setError] = useState("");
  const [usingDemo, setUsingDemo] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapRows = (data: PhotoRow[]): WallPhoto[] =>
    data.map((r) => ({
      id: r.id,
      url: r.public_url,
      guest_name: r.guest_name || undefined,
    }));

  const celebrate = () => {
    confetti({
      particleCount: 70,
      spread: 62,
      origin: { y: 0.75 },
      colors: ["#D4AF37", "#FBEB9B", "#0D7A56", "#F7F4EE"],
    });
  };

  const loadPhotos = useCallback(async () => {
    const supabase = getSupabaseGuestBrowser();
    if (!supabase) {
      setUsingDemo(true);
      setPhotos(DEMO_PHOTOS.map((url, i) => ({ id: `demo-${i}`, url })));
      return;
    }
    const { data, error: err } = await supabase
      .from("photos")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(48);
    if (err || !data?.length) {
      setUsingDemo(true);
      setPhotos(DEMO_PHOTOS.map((url, i) => ({ id: `demo-${i}`, url })));
      return;
    }
    setUsingDemo(false);
    setPhotos(mapRows(data as PhotoRow[]));
  }, []);

  useEffect(() => {
    void loadPhotos();

    const supabase = getSupabaseGuestBrowser();
    if (!supabase) return;

    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "photos" },
        (payload) => {
          const row = payload.new as PhotoRow;
          // Only show already-approved inserts (e.g. admin-seeded)
          if (!row?.public_url || !row.is_approved) return;
          setUsingDemo(false);
          setPhotos((prev) => {
            if (prev.some((p) => p.id === row.id)) return prev;
            return [
              {
                id: row.id,
                url: row.public_url,
                guest_name: row.guest_name || undefined,
              },
              ...prev.filter((p) => !p.id.startsWith("demo-")),
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "photos" },
        (payload) => {
          const row = payload.new as PhotoRow;
          if (!row?.id || !row.is_approved || !row.public_url) return;

          setUsingDemo(false);
          setPhotos((prev) => {
            if (prev.some((p) => p.id === row.id)) return prev;
            return [
              {
                id: row.id,
                url: row.public_url,
                guest_name: row.guest_name || undefined,
              },
              ...prev.filter((p) => !p.id.startsWith("demo-")),
            ];
          });

          // This guest's pending upload was approved
          setPendingId((current) => {
            if (current && current === row.id) {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setPhase("approved");
              celebrate();
              setTimeout(() => setPhase("idle"), 2800);
              return null;
            }
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loadPhotos]);

  const handleUpload = async (file: File) => {
    setError("");
    setPhase("uploading");
    try {
      const dataUrl = await compressImageFile(file, 1400, 1400, 0.82);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const supabase = getSupabaseGuestBrowser();

      if (!supabase) {
        // Offline demo: show immediately
        setPhotos((prev) => [
          { id: `local-${Date.now()}`, url: dataUrl, guest_name: guestName },
          ...prev,
        ]);
        setPhase("approved");
        celebrate();
        setTimeout(() => setPhase("idle"), 2000);
        return;
      }

      const path = `${eventId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error: upErr } = await supabase.storage.from(GUEST_PHOTO_BUCKET).upload(path, blob, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(GUEST_PHOTO_BUCKET).getPublicUrl(path);
      const public_url = pub.publicUrl;

      // Default is_approved = false in DB; do not force true
      const { data: inserted, error: insErr } = await supabase
        .from("photos")
        .insert({
          guest_id: guestId || null,
          guest_name: guestName || null,
          storage_path: path,
          public_url,
          is_approved: false,
        })
        .select("id")
        .single();

      if (insErr) throw insErr;
      const photoId = (inserted as { id: string }).id;
      setPendingId(photoId);
      setPhase("scanning");

      // 15s → manual review queue message if still waiting
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setPendingId((current) => {
          if (current === photoId) {
            setPhase("queued");
            setTimeout(() => setPhase("idle"), 5000);
            return null;
          }
          return current;
        });
      }, 15000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setPhase("idle");
      setPendingId(null);
    }
  };

  const busy = phase === "uploading" || phase === "scanning";

  return (
    <section className="px-4 py-6 relative">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--guest-gold)]">
          Capture the night
        </p>
        <h2 className="font-serif text-2xl font-bold">Live photo wall</h2>
        <p className="text-xs text-[var(--guest-muted)] mt-1">
          Share moments from your phone — AI-scanned, then live on the wall
          {usingDemo ? " (demo images until Supabase is connected)" : ""}.
        </p>
      </div>

      <AnimatePresence>
        {(phase === "scanning" || phase === "uploading" || phase === "approved" || phase === "queued") && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="guest-glass mb-4 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            {phase === "approved" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : phase === "queued" ? (
              <Camera className="h-5 w-5 text-[var(--guest-gold)] shrink-0" />
            ) : (
              <Loader2 className="h-5 w-5 text-[var(--guest-gold)] animate-spin shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold">
                {phase === "uploading" && "Uploading your moment…"}
                {phase === "scanning" && "Scanning for good vibes…"}
                {phase === "approved" && "You're on the wall!"}
                {phase === "queued" && "In the review queue"}
              </p>
              <p className="text-[11px] text-[var(--guest-muted)] mt-0.5">
                {phase === "scanning" && "Our AI is checking the photo for event-safe content."}
                {phase === "approved" && "Thanks for sharing with Visriva."}
                {phase === "queued" && "Your photo is in the queue for manual review!"}
                {phase === "uploading" && "Almost there."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="columns-2 gap-2.5 space-y-2.5">
        {photos.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
            layout
            className="break-inside-avoid overflow-hidden rounded-2xl guest-glass"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="w-full object-cover" loading="lazy" />
          </motion.div>
        ))}
      </div>

      {error && <p className="text-xs text-rose-400 mt-3 text-center">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleUpload(f);
          e.target.value = "";
        }}
      />

      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-3.5 text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-md disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        <span>
          {phase === "scanning"
            ? "Scanning…"
            : phase === "uploading"
              ? "Uploading…"
              : "Tap to Upload"}
        </span>
        <Upload className="h-3.5 w-3.5 opacity-70" />
      </motion.button>
    </section>
  );
}
