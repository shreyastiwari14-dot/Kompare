"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, X } from "lucide-react";

export interface UserLocation {
  lat: number;
  lng: number;
  city: string;
  pincode: string;
}

const STORAGE_KEY = "kompare_location";

interface LocationPillProps {
  onLocationChange?: (loc: UserLocation | null) => void;
}

export function useLocation() {
  const [location, setLocationState] = useState<UserLocation | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setLocationState(JSON.parse(saved)); return; } catch {}
    }

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await geo.json();
          const loc: UserLocation = {
            lat: latitude,
            lng: longitude,
            city: data.address?.city || data.address?.town || data.address?.state_district || '',
            pincode: data.address?.postcode || '',
          };
          setLocationState(loc);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
        } catch {
          const loc: UserLocation = { lat: latitude, lng: longitude, city: '', pincode: '' };
          setLocationState(loc);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
        }
      },
      () => {} // denied — user can set manually via pill
    );
  }, []);

  const setLocation = (loc: UserLocation | null) => {
    setLocationState(loc);
    if (loc) localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    else localStorage.removeItem(STORAGE_KEY);
  };

  return { location, setLocation };
}

export default function LocationPill({ onLocationChange }: LocationPillProps) {
  const { location, setLocation } = useLocation();
  const [editing, setEditing] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Notify parent when location changes
  useEffect(() => {
    onLocationChange?.(location);
  }, [location, onLocationChange]);

  const handlePincodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinInput.trim();
    if (!/^\d{6}$/.test(pin)) { setError("Enter a valid 6-digit pincode"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${pin}&country=India&format=json&limit=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      if (data?.[0]) {
        const loc: UserLocation = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          city: data[0].display_name?.split(',')?.[2]?.trim() || pin,
          pincode: pin,
        };
        setLocation(loc);
        setEditing(false);
        setPinInput("");
      } else {
        setError("Pincode not found");
      }
    } catch {
      setError("Could not lookup pincode");
    } finally {
      setLoading(false);
    }
  };

  const label = location
    ? [location.city, location.pincode].filter(Boolean).join(' ') || 'Location set'
    : null;

  return (
    <div className="relative inline-flex items-center">
      {!editing ? (
        <button
          onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span>{label ? `📍 ${label}` : '📍 Set location'}</span>
          <span className="text-[10px] opacity-60">· Change</span>
        </button>
      ) : (
        <form onSubmit={handlePincodeSubmit} className="flex items-center gap-1.5">
          <div className="relative">
            <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={pinInput}
              onChange={e => { setPinInput(e.target.value); setError(""); }}
              placeholder="Enter pincode"
              maxLength={6}
              className="pl-6 pr-2 py-1 w-32 rounded-full border border-border bg-card text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold disabled:opacity-50"
          >
            {loading ? '...' : 'Go'}
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setError(""); }}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground"
          >
            <X className="w-3 h-3" />
          </button>
          {error && <span className="text-[10px] text-red-500">{error}</span>}
        </form>
      )}
    </div>
  );
}
