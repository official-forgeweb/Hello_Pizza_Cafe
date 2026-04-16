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
 * Strategy: Fetch real data from Nominatim → Format with Gemini AI.
 */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // ── STEP 1: Get real address data from Nominatim (always) ──
  let nominatimData: any = null;
  let rawDisplayName = "";

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&extratags=1`,
      { headers: { "Accept-Language": "en" } }
    );
    if (res.ok) {
      nominatimData = await res.json();
      rawDisplayName = nominatimData.display_name || "";
    }
  } catch (err) {
    console.error("Nominatim Error:", err);
  }

  // ── STEP 2: Use Gemini to format the raw data into a clean delivery address ──
  if (GEMINI_API_KEY && rawDisplayName) {
    try {
      const addressJSON = JSON.stringify(nominatimData?.address || {});
      
      const prompt = `You are an Indian delivery address formatter. I have raw geocoding data for coordinates (${lat}, ${lng}).

Raw address from map service: "${rawDisplayName}"

Structured address fields: ${addressJSON}

Using this REAL data, format a clean, complete Indian delivery address suitable for a food delivery order. Include house number, road/gali, neighbourhood/mohalla/colony, area, city, state, and PIN code — but ONLY use information from the data above. Do NOT invent or guess any details.

Format as a single line like: "123, Main Road, Lajpat Nagar, Near Metro Station, New Delhi, Delhi 110024"

Return ONLY the formatted address string. No quotes, no explanation.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 200 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text && text.length > 10) {
          return text.replace(/^["']|["']$/g, "").replace(/\n/g, ", ").trim();
        }
      }
    } catch (err) {
      console.error("Gemini Formatting Error:", err);
    }
  }

  // ── STEP 3: Manual formatting from Nominatim data (if Gemini unavailable) ──
  if (nominatimData?.address) {
    const a = nominatimData.address;
    const parts: string[] = [];

    // Build from most specific to least specific
    if (a.house_number) parts.push(a.house_number);
    if (a.road) parts.push(a.road);
    if (a.neighbourhood) parts.push(a.neighbourhood);
    if (a.suburb && a.suburb !== a.neighbourhood) parts.push(a.suburb);
    if (a.city_district) parts.push(a.city_district);
    if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
    if (a.state_district && a.state_district !== (a.city || a.town || a.village)) parts.push(a.state_district);
    if (a.state) parts.push(a.state);
    if (a.postcode) parts.push(a.postcode);

    if (parts.length > 1) return parts.join(", ");
  }

  // Last resort: use Nominatim's full display_name
  return rawDisplayName || "Detected Location";
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
