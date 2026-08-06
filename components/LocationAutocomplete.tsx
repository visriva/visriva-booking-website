"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, AlertCircle } from "lucide-react";
import { useJsApiLoader } from "@react-google-maps/api";

const LIBRARIES: ("places")[] = ["places"];
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const FALLBACK_LUXURY_VENUES = [
  { name: "Taj West End", area: "Race Course Rd, Bengaluru, Karnataka" },
  { name: "The Leela Palace Bengaluru", area: "HAL Old Airport Rd, Kodihalli, Bengaluru" },
  { name: "JW Marriott Hotel Bengaluru", area: "Vittal Mallya Rd, Bengaluru, Karnataka" },
  { name: "The Ritz-Carlton", area: "Residency Rd, Shanthala Nagar, Bengaluru" },
  { name: "ITC Gardenia", area: "Residency Rd, Ashok Nagar, Bengaluru" },
  { name: "Four Seasons Hotel Bengaluru", area: "Ganganagar, Bengaluru, Karnataka" },
  { name: "Shangri-La Bengaluru", area: "Palace Rd, Abshot Layout, Vasanth Nagar, Bengaluru" },
  { name: "Bhartiya City Convention Center", area: "Thanisandra Main Rd, Bengaluru, Karnataka" },
];

export default function LocationAutocomplete({ value, onChange, placeholder }: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [predictions, setPredictions] = useState<Array<{ name: string; area: string }>>([]);
  const [googlePredictions, setGooglePredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load Google Maps Places API Script (falls back to curated venue list if key is missing)
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    preventGoogleFontsLoading: true,
  });

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    if (isLoaded && window.google && window.google.maps && window.google.maps.places) {
      try {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      } catch (e) {
        console.error("Google Places AutocompleteService initialization error:", e);
      }
    }
  }, [isLoaded]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);
    setIsOpen(true);

    if (query.trim().length > 1) {
      if (isLoaded && autocompleteServiceRef.current) {
        // Fetch real Google Places predictions dynamically
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: "in" },
          },
          (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              setGooglePredictions(results);
            } else {
              setGooglePredictions([]);
              filterFallbackVenues(query);
            }
          }
        );
      } else {
        filterFallbackVenues(query);
      }
    } else {
      setGooglePredictions([]);
      setPredictions(FALLBACK_LUXURY_VENUES);
    }
  };

  const filterFallbackVenues = (query: string) => {
    const filtered = FALLBACK_LUXURY_VENUES.filter(
      (v) =>
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        v.area.toLowerCase().includes(query.toLowerCase())
    );
    if (filtered.length > 0) {
      setPredictions(filtered);
    } else {
      setPredictions([
        { name: query, area: "Custom Venue Address, Bengaluru" },
        ...FALLBACK_LUXURY_VENUES.slice(0, 4),
      ]);
    }
  };

  const handleSelectVenue = (venueStr: string) => {
    onChange(venueStr);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          required
          placeholder={placeholder || "Search event venue location..."}
          value={value}
          onFocus={() => {
            setIsOpen(true);
            if (predictions.length === 0) setPredictions(FALLBACK_LUXURY_VENUES);
          }}
          onChange={handleInputChange}
          className="w-full bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3.5 pl-11 text-white text-sm outline-none transition-colors backdrop-blur-md"
        />
        <MapPin className="w-5 h-5 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* CRUCIAL Z-INDEX FIX: absolute z-[9999] dark glassmorphic dropdown container */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[9999] bg-[#011F15] border border-white/20 shadow-2xl rounded-2xl p-2 max-h-64 overflow-y-auto no-scrollbar backdrop-blur-2xl text-white">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] border-b border-white/10 flex items-center justify-between">
            <span>{googlePredictions.length > 0 ? "Google Places Results" : "Verified Luxury Venues"}</span>
            <span className="text-[9px] text-emerald-200/60 font-sans">
              {isLoaded ? "Live Maps API" : "Fallback Mode"}
            </span>
          </div>

          <div className="py-1">
            {googlePredictions.length > 0 ? (
              googlePredictions.map((pred) => (
                <button
                  key={pred.place_id}
                  type="button"
                  onClick={() => handleSelectVenue(pred.description)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-start space-x-3 group"
                >
                  <Navigation className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                      {pred.structured_formatting.main_text}
                    </div>
                    <div className="text-[11px] text-emerald-200/70 truncate max-w-xs sm:max-w-md">
                      {pred.structured_formatting.secondary_text}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              predictions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectVenue(`${item.name}, ${item.area}`)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-start space-x-3 group"
                >
                  <Navigation className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-emerald-200/70 truncate max-w-xs sm:max-w-md">
                      {item.area}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
