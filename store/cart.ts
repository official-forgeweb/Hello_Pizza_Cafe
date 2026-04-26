import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // Unique ID for the cart line item (e.g. uuid)
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  categoryId?: string;
  variant?: {
    id: string;
    name: string;
    price: number;
  };
  addOns?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalPrice: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          // Check if identical item (same variant & addons) exists
          const existingItemIndex = state.items.findIndex(
            (i) =>
              i.menuItemId === item.menuItemId &&
              i.variant?.id === item.variant?.id &&
              JSON.stringify(i.addOns) === JSON.stringify(item.addOns)
          );

          if (existingItemIndex > -1) {
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += item.quantity;
            newItems[existingItemIndex].totalPrice =
              (newItems[existingItemIndex].price +
                (newItems[existingItemIndex].variant?.price || 0) +
                 (newItems[existingItemIndex].addOns?.reduce((a, b) => a + (b.price * (b.quantity || 1)), 0) || 0)) *
              newItems[existingItemIndex].quantity;
            return { items: newItems };
          }
          return { items: [...state.items, item] };
        });
      },
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === id) {
              const baseAndAddonsPrice =
                item.price +
                (item.variant?.price || 0) +
                 (item.addOns?.reduce((a, b) => a + (b.price * (b.quantity || 1)), 0) || 0);
              return {
                ...item,
                quantity,
                totalPrice: baseAndAddonsPrice * quantity,
              };
            }
            return item;
          }),
        })),
      clearCart: () => set({ items: [] }),
      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.totalPrice, 0);
      },
      getCartCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'hello-pizza-cart',
    }
  )
);
