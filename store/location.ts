import { create } from "zustand";

interface LocationState {
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  isDetecting: boolean;
  setAddress: (address: string) => void;
  setCoordinates: (lat: number, lng: number) => void;
  detectLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set) => ({
  address: "Connaught Place, New Delhi", // Default
  coordinates: null,
  isDetecting: false,
  setAddress: (address) => set({ address }),
  setCoordinates: (lat, lng) => set({ coordinates: { lat, lng } }),
  detectLocation: async () => {
    set({ isDetecting: true });
    
    // Simulate real fetching delay for "Studio" UX
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          set({ coordinates: { lat: latitude, lng: longitude } });
          
          const mockAddresses = [
            "Lodi Road, New Delhi",
            "MG Road, Bengaluru",
            "Juhu, Mumbai",
            "Salt Lake, Kolkata",
            "Banjara Hills, Hyderabad"
          ];
          const randomAddress = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
          set({ address: randomAddress, isDetecting: false });
        },
        (error) => {
          let message = "Unknown location error";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location permission denied";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information unavailable";
              break;
            case error.TIMEOUT:
              message = "Location request timed out";
              break;
          }
          console.warn("Geolocation warning:", message);
          set({ isDetecting: false });
          // If detection fails, we keep the default "Connaught Place" address
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      set({ isDetecting: false });
    }
  },
}));
