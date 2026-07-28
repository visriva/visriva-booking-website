"use client";

import React, { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Sparkles,
  Camera,
  Magnet,
  Key,
  Coffee,
  ShoppingBag,
  Download,
  Share2,
  Search,
  X,
  Lock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  subscribeGalleries,
  GalleryItem,
  subscribeFeatureToggles,
  DEFAULT_FEATURE_TOGGLES,
  FeatureTogglesConfig,
} from "@/lib/firebase";

const SAMPLE_GALLERY_PHOTOS: (GalleryItem & { eventCode: string })[] = [
  {
    id: "g1",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    tagline: "Rahul & Ananya Sangeet • Taj West End",
    category: "photo-booth" as any,
    eventCode: "rahul-ananya",
    createdAt: Date.now(),
  },
  {
    id: "g2",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
    tagline: "Custom Acrylic Fridge Magnet Keepsake",
    category: "magnet-station" as any,
    eventCode: "rahul-ananya",
    createdAt: Date.now(),
  },
  {
    id: "g3",
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    tagline: "Google Tech Gala • Leela Palace",
    category: "photo-booth" as any,
    eventCode: "google-gala",
    createdAt: Date.now(),
  },
  {
    id: "g4",
    url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
    tagline: "Live Canvas Tote Bag Pressing",
    category: "tote-tshirt-station" as any,
    eventCode: "google-gala",
    createdAt: Date.now(),
  },
];

function GalleryContent() {
  const [eventCodeInput, setEventCodeInput] = useState("rahul-ananya");
  const [activeEventCode, setActiveEventCode] = useState("rahul-ananya");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [firestoreItems, setFirestoreItems] = useState<GalleryItem[]>([]);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [featureToggles, setFeatureToggles] = useState<FeatureTogglesConfig>(DEFAULT_FEATURE_TOGGLES);

  useEffect(() => {
    const unsub = subscribeGalleries((items) => {
      setFirestoreItems(items);
    });
    const unsubToggles = subscribeFeatureToggles((data) => {
      if (data) setFeatureToggles(data);
    });
    return () => {
      unsub();
      unsubToggles();
    };
  }, []);

  if (featureToggles.enableGuestGallery === false) {
    return (
      <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
        <Navbar />
        <div className="pt-44 pb-28 px-4 text-center max-w-md mx-auto space-y-4">
          <Lock className="w-12 h-12 text-[#D4AF37] mx-auto opacity-70" />
          <h2 className="font-serif text-2xl font-bold text-white">Guest Photo Portal Offline</h2>
          <p className="text-xs text-emerald-100/70">
            The Guest Photo Portal is currently under maintenance or disabled by the Administrator.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  const allItems = [...firestoreItems, ...SAMPLE_GALLERY_PHOTOS];

  const filteredPhotos = allItems.filter((item) => {
    const codeMatch =
      !activeEventCode ||
      (item as any).eventCode?.toLowerCase() === activeEventCode.toLowerCase() ||
      item.tagline?.toLowerCase().includes(activeEventCode.toLowerCase());

    const catMatch = activeCategory === "all" || item.category === activeCategory;
    return codeMatch && catMatch;
  });

  const handleSearchEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveEventCode(eventCodeInput.trim());
  };

  const handleDownload = (photoUrl: string) => {
    const link = document.createElement("a");
    link.href = photoUrl;
    link.download = `Visriva-Live-Photo-${Date.now()}.jpg`;
    link.target = "_blank";
    link.click();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleOrderExtraPrint = (photo: GalleryItem) => {
    const waMsg = encodeURIComponent(
      `Hello Visriva! I would like to order extra physical magnet/tote prints for this photo from event (${activeEventCode}):\n${photo.url}`
    );
    window.open(`https://wa.me/918884484828?text=${waMsg}`, "_blank");
  };

  return (
    <main className="min-h-screen bg-[#011F15] text-white selection:bg-[#D4AF37] selection:text-[#011F15]">
      <Navbar />

      <section className="pt-36 sm:pt-40 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-black/50 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest backdrop-blur-md font-cinzel">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Client &amp; Guest Live Event Gallery</span>
          </div>
          <h1 className="font-playfair text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Download Your <span className="text-gold-gradient">High-Res Event Captures</span>
          </h1>
          <p className="font-sans text-emerald-100/80 text-xs sm:text-sm font-light">
            Enter your Event PIN or Couple Hashtag below to view and download your digital photo booth portraits &amp; magnet keepsakes.
          </p>

          {/* SEARCH BAR */}
          <form onSubmit={handleSearchEvent} className="flex items-center justify-center max-w-md mx-auto pt-3">
            <div className="relative w-full">
              <input
                type="text"
                value={eventCodeInput}
                onChange={(e) => setEventCodeInput(e.target.value)}
                placeholder="Enter Event PIN / Hashtag (e.g. rahul-ananya)..."
                className="w-full pl-4 pr-12 py-3 rounded-full bg-black/60 border border-[#D4AF37]/50 text-white font-mono text-sm focus:border-[#D4AF37] focus:outline-none shadow-2xl"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gold-gradient text-[#011F15] flex items-center justify-center shadow-md hover:scale-105 transition cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* CATEGORY FILTERS */}
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto mb-10">
          {[
            { id: "all", label: "All Captures", icon: Camera },
            { id: "photo-booth", label: "Photo Booth", icon: Camera },
            { id: "magnet-station", label: "Fridge Magnets", icon: Magnet },
            { id: "keychain-station", label: "Keychains", icon: Key },
            { id: "tote-tshirt-station", label: "Tote Bags", icon: ShoppingBag },
            { id: "mug-printing", label: "Live Mugs", icon: Coffee },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full border text-xs font-bold font-mono transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-gold-sm"
                  : "bg-white/5 border-white/15 text-white/80 hover:border-[#D4AF37]/50 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* PHOTO MASONRY GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPhotos.length === 0 ? (
            <div className="col-span-full py-16 text-center space-y-3 glass-card p-8 rounded-3xl border border-white/10 max-w-md mx-auto">
              <Lock className="w-10 h-10 text-[#D4AF37] mx-auto opacity-80" />
              <h3 className="font-serif text-lg text-white font-bold">No Photos Found for "{activeEventCode}"</h3>
              <p className="text-emerald-100/70 text-xs">
                Check your event PIN spelling or try searching "rahul-ananya" or "google-gala".
              </p>
            </div>
          ) : (
            filteredPhotos.map((photo) => (
              <motion.div
                key={photo.id}
                whileHover={{ scale: 1.03, y: -4 }}
                className="group relative rounded-2xl overflow-hidden border border-white/15 bg-black/50 shadow-xl cursor-pointer aspect-[3/4]"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.tagline || "Visriva Event Capture"}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                <div className="absolute bottom-0 left-0 right-0 p-4 text-left space-y-1">
                  <span className="text-[9px] font-mono text-[#D4AF37] uppercase bg-black/60 px-2 py-0.5 rounded border border-[#D4AF37]/30 inline-block">
                    Visriva Keepsake
                  </span>
                  <h4 className="font-serif text-sm font-bold text-white line-clamp-1">
                    {photo.tagline || "Event Capture"}
                  </h4>
                  <div className="text-[10px] text-emerald-200/80 font-mono flex items-center space-x-1">
                    <span>Click to Download</span>
                    <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

      </section>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
          >
            <div className="relative max-w-4xl w-full bg-[#041a12] border-2 border-[#D4AF37]/50 rounded-3xl p-6 shadow-2xl space-y-6">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="max-h-[60vh] rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center bg-black/60">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.tagline || "Photo Display"}
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              <div className="text-center space-y-3">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  {selectedPhoto.tagline || "Visriva Digital Capture"}
                </h3>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleDownload(selectedPhoto.url)}
                    className="px-5 py-2.5 rounded-xl bg-gold-gradient text-[#011F15] font-extrabold text-xs uppercase tracking-wider shadow-gold-sm hover:scale-105 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Original</span>
                  </button>

                  <button
                    onClick={() => handleOrderExtraPrint(selectedPhoto)}
                    className="px-5 py-2.5 rounded-xl bg-[#25D366] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white transition shadow-md cursor-pointer flex items-center space-x-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Order Physical Magnet / Tote Print</span>
                  </button>
                </div>

                {downloadSuccess && (
                  <div className="text-xs text-emerald-300 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Photo Saved to Device!</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#011F15] text-white p-20 text-center font-mono">Loading Gallery...</div>}>
      <GalleryContent />
    </Suspense>
  );
}
