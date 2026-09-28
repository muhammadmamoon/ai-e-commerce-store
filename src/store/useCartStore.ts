import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  sku: string;
  price: number;
  quantity: number;
  maxStock: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.variantId === newItem.variantId,
          );
          if (existing) {
            const updatedQty = Math.min(
              existing.quantity + newItem.quantity,
              existing.maxStock,
            );
            return {
              isOpen: true,
              items: state.items.map((i) =>
                i.variantId === newItem.variantId
                  ? { ...i, quantity: updatedQty }
                  : i,
              ),
            };
          }
          return {
            isOpen: true,
            items: [...state.items, newItem],
          };
        }),

      updateQuantity: (variantId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.variantId !== variantId),
            };
          }
          return {
            items: state.items.map((i) =>
              i.variantId === variantId
                ? { ...i, quantity: Math.min(quantity, i.maxStock) }
                : i,
            ),
          };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      clearCart: () => set({ items: [] }),

      getItemCount: () =>
        get().items.reduce((count, item) => count + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        ),
    }),
    {
      name: "ai-ecommerce-cart",
      partialize: (state) => ({ items: state.items }), // Only persist items in localStorage
    },
  ),
);
