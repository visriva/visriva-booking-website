"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, Upload } from "lucide-react";
import { compressImageFile } from "@/lib/firebase";
import { getSupabaseGuestBrowser, type GuestPhotoRow } from "@/lib/supabaseGuest";

interface Props {
  eventId: string;
  guestName: string;
}

const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=80",
];

export default function PhotoWall({ eventId, guestName }: Props) {
  const [photos, setPhotos] = useState<{ id: string; url: string; guest_name?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    const supabase = getSupabaseGuestBrowser();
    if (!supabase) {
      setPhotos(DEMO_PHOTOS.map((url, i) => ({ id: `demo-${i}`, url })));
      return;
    }
    const { data, error: err } = await supabase
      .from("guest_photos")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(48);
    if (err || !data?.length) {
      setPhotos(DEMO_PHOTOS.map((url, i) => ({ id: `demo-${i}`, url })));
      return;
    }
    setPhotos(
      (data as GuestPhotoRow[]).map((r) => ({
        id: r.id,
        url: r.url,
        guest_name: r.guest_name || undefined,
      }))
    );
  }, [eventId]);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  const handleUpload = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const dataUrl = await compressImageFile(file, 1400, 1400, 0.82);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const supabase = getSupabaseGuestBrowser();

      if (!supabase) {
        setPhotos((prev) => [{ id: `local-${Date.now()}`, url: dataUrl, guest_name: guestName }, ...prev]);
        setUploading(false);
        return;
      }

      const path = `${eventId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error: upErr } = await supabase.storage.from("guest-photos").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("guest-photos").getPublicUrl(path);
      const url = pub.publicUrl;
      await supabase.from("guest_photos").insert({
        event_id: eventId,
        url,
        guest_name: guestName || null,
      });
      setPhotos((prev) => [{ id: `new-${Date.now()}`, url, guest_name: guestName }, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="px-4 py-6 relative">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--guest-gold)]">
          Capture the night
        </p>
        <h2 className="font-serif text-2xl font-bold">Live photo wall</h2>
        <p className="text-xs text-[var(--guest-muted)] mt-1">
          Share moments from your phone — they appear here instantly.
        </p>
      </div>

      <div className="columns-2 gap-2.5 space-y-2.5">
        {photos.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
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
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-3.5 text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-md"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        <span>{uploading ? "Uploading…" : "Tap to Upload"}</span>
        <Upload className="h-3.5 w-3.5 opacity-70" />
      </motion.button>
    </section>
  );
}
