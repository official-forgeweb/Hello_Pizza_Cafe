import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocationState {
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  isDetecting: boolean;
  setAddress: (address: string) => void;
  setCoordinates: (lat: number, lng: number) => void;
  detectLocation: () => Promise<void>;
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
              timeout: 8000,
              maximumAge: 0,
            });
          });

          const { latitude, longitude } = position.coords;
          set({ coordinates: { lat: latitude, lng: longitude } });

          // Reverse geocode using free Nominatim API
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              { headers: { "Accept-Language": "en" } }
            );
            if (res.ok) {
              const data = await res.json();
              // Build a clean short address
              const parts = [];
              if (data.address?.neighbourhood) parts.push(data.address.neighbourhood);
              else if (data.address?.suburb) parts.push(data.address.suburb);
              else if (data.address?.road) parts.push(data.address.road);

              if (data.address?.city || data.address?.town || data.address?.village) {
                parts.push(data.address.city || data.address.town || data.address.village);
              }
              if (data.address?.state) parts.push(data.address.state);

              const formattedAddress = parts.length > 0 ? parts.join(", ") : (data.display_name || "Your Location");
              set({ address: formattedAddress, isDetecting: false });
            } else {
              set({ address: "Your Location", isDetecting: false });
            }
          } catch {
            set({ address: "Your Location", isDetecting: false });
          }
        } catch (error: any) {
          let message = "Unknown location error";
          if (error?.code === 1) message = "Location permission denied";
          else if (error?.code === 2) message = "Location information unavailable";
          else if (error?.code === 3) message = "Location request timed out";
          console.warn("Geolocation warning:", message);
          set({ address: "Connaught Place, New Delhi", isDetecting: false });
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
