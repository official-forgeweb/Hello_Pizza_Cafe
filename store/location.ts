import { create } from "zustand";
import { persist } from "zustand/middleware";

// ==========================================
// CONFIGURATION: Paste your Gemini API Key here
// ==========================================
const GEMINI_API_KEY = "AIzaSyCSfE_2Xx7EbPjxZIE2wXt8AWpiv0s0Dq4"; // PASTE_YOUR_API_KEY_HERE

interface LocationState {
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  isDetecting: boolean;
  setAddress: (address: string) => void;
  setCoordinates: (lat: number, lng: number) => void;
  detectLocation: () => Promise<void>;
}

/**
 * Reverse geocode coordinates into a detailed street-level address.
 * Strategy: Use Google Maps Geocoding API for precise results, fallback to Nominatim.
 */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // ── Strategy 1: Google Maps Geocoding API (most accurate, ~10m precision) ──
  if (GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GEMINI_API_KEY}&language=en`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK" && data.results?.length > 0) {
          // results[0] is the most precise (street/building level)
          const precise = data.results[0]?.formatted_address;
          if (precise) {
            // Remove ", India" from end for cleaner display
            return precise.replace(/, India$/i, "").trim();
          }
        }
      }
    } catch (err) {
      console.warn("Google Geocoding failed, falling back to Nominatim:", err);
    }
  }

  // ── Strategy 2: Nominatim fallback (free, slightly less precise) ──
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=19`,
      { headers: { "Accept-Language": "en" } }
    );
    if (res.ok) {
      const nominatimData = await res.json();
      if (nominatimData?.address) {
        const a = nominatimData.address;
        const parts: string[] = [];

        if (a.amenity) parts.push(a.amenity);
        if (a.building) parts.push(a.building);
        if (a.house_number) parts.push(a.house_number);
        if (a.road) parts.push(a.road);
        if (a.neighbourhood) parts.push(a.neighbourhood);
        if (a.suburb && a.suburb !== a.neighbourhood) parts.push(a.suburb);
        if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
        if (a.state) parts.push(a.state);
        if (a.postcode) parts.push(a.postcode);

        if (parts.length > 1) return parts.join(", ");
      }
      return nominatimData.display_name || "Detected Location";
    }
  } catch (err) {
    console.error("Nominatim Error:", err);
  }

  return "Detected Location";
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      address: null,
      coordinates: null,
      isDetecting: false,
      setAddress: (address) => set({ address }),
      setCoordinates: (lat, lng) => set({ coordinates: { lat, lng } }),
      detectLocation: async () => {
        set({ isDetecting: true });

        if (!("geolocation" in navigator)) {
          set({ isDetecting: false, address: "Connaught Place, New Delhi" });
          return;
        }

        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });

          const { latitude, longitude } = position.coords;
          set({ coordinates: { lat: latitude, lng: longitude } });

          const formattedAddress = await reverseGeocode(latitude, longitude);
          set({ address: formattedAddress, isDetecting: false });
          
        } catch (error: any) {
          let message = "Location access denied";
          if (error?.code === 1) message = "Permission denied";
          else if (error?.code === 2) message = "Position unavailable";
          else if (error?.code === 3) message = "Request timed out";
          
          console.warn("Geolocation warning:", message);
          set({ address: null, isDetecting: false });
        }
      },
    }),
    {
      name: "hello-pizza-location",
      partialize: (state) => ({
        address: state.address,
        coordinates: state.coordinates,
      }),
    }
  )
);
