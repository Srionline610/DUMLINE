import { create } from 'zustand';
import { FulfillmentType, OutletSummary } from '@dumline/shared';
import { useOutletStore } from './outletStore';

export interface CartItem {
  itemId: string;
  itemName: string;
  unitPrice: number; // Retail price (GST-inclusive)
  quantity: number;
  selectedOptions?: Record<string, string>;
  image?: string;
  category?: string;
}

export interface PendingOutletChange {
  targetOutlet: OutletSummary;
  pendingItemToAdd?: {
    item: {
      id: string;
      name: string;
      effectivePrice: number;
      category?: string;
    };
    quantity: number;
    options?: Record<string, string>;
  };
}

interface CartState {
  boundOutletId: string | null;
  boundOutletName: string | null;
  items: CartItem[];
  fulfillmentType: FulfillmentType;
  deliveryAddress: {
    line1: string;
    line2?: string;
    city: string;
    distanceKm: number;
  };
  isCartDrawerOpen: boolean;
  isSwitchModalOpen: boolean;
  pendingChange: PendingOutletChange | null;

  // Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  setDeliveryAddress: (address: Partial<CartState['deliveryAddress']>) => void;

  // Cart operations
  addItem: (
    outlet: OutletSummary,
    item: { id: string; name: string; effectivePrice: number; category?: string },
    quantity?: number,
    options?: Record<string, string>
  ) => boolean;

  updateQuantity: (itemId: string, newQuantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;

  // Outlet Switching Modal Handlers
  openSwitchModal: (pending: PendingOutletChange) => void;
  closeSwitchModal: () => void;
  confirmSwitchOutlet: () => void;

  // Computed / Summaries
  getSubtotal: () => number;
  getBaseAmount: () => number;
  getGstAmount: () => number;
  getDeliveryFee: () => number;
  getTotalAmount: () => number;
  getItemCount: () => number;

  initializeCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  boundOutletId: null,
  boundOutletName: null,
  items: [],
  fulfillmentType: 'DELIVERY',
  deliveryAddress: {
    line1: '',
    line2: '',
    city: 'Hyderabad',
    distanceKm: 2.5,
  },
  isCartDrawerOpen: false,
  isSwitchModalOpen: false,
  pendingChange: null,

  openCart: () => set({ isCartDrawerOpen: true }),
  closeCart: () => set({ isCartDrawerOpen: false }),
  toggleCart: () => set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),

  setFulfillmentType: (fulfillmentType) => {
    set({ fulfillmentType });
    saveCartToStorage({ ...get(), fulfillmentType });
  },

  setDeliveryAddress: (addr) => {
    set((state) => {
      const updated = {
        deliveryAddress: { ...state.deliveryAddress, ...addr },
      };
      saveCartToStorage({ ...state, ...updated });
      return updated;
    });
  },

  addItem: (outlet, item, quantity = 1, options) => {
    const { boundOutletId, items } = get();

    // Enforce Single-Outlet Cart Isolation:
    if (items.length > 0 && boundOutletId && boundOutletId !== outlet.id) {
      // Trigger modal confirmation
      set({
        isSwitchModalOpen: true,
        pendingChange: {
          targetOutlet: outlet,
          pendingItemToAdd: { item, quantity, options },
        },
      });
      return false; // Not added yet; waiting for user confirmation
    }

    // Add or increment item
    const existingIndex = items.findIndex((i) => i.itemId === item.id);
    let updatedItems: CartItem[];

    if (existingIndex > -1) {
      updatedItems = [...items];
      updatedItems[existingIndex].quantity += quantity;
    } else {
      updatedItems = [
        ...items,
        {
          itemId: item.id,
          itemName: item.name,
          unitPrice: item.effectivePrice,
          quantity,
          selectedOptions: options,
          category: item.category,
        },
      ];
    }

    const nextState = {
      boundOutletId: outlet.id,
      boundOutletName: outlet.name,
      items: updatedItems,
      isCartDrawerOpen: true, // open cart drawer upon adding
    };

    set(nextState);
    saveCartToStorage({ ...get(), ...nextState });
    return true;
  },

  updateQuantity: (itemId, newQuantity) => {
    const { items } = get();
    if (newQuantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    const updated = items.map((i) => (i.itemId === itemId ? { ...i, quantity: newQuantity } : i));
    set({ items: updated });
    saveCartToStorage({ ...get(), items: updated });
  },

  removeItem: (itemId) => {
    const updated = get().items.filter((i) => i.itemId !== itemId);
    const nextState = {
      items: updated,
      boundOutletId: updated.length === 0 ? null : get().boundOutletId,
      boundOutletName: updated.length === 0 ? null : get().boundOutletName,
    };
    set(nextState);
    saveCartToStorage({ ...get(), ...nextState });
  },

  clearCart: () => {
    const nextState = {
      items: [],
      boundOutletId: null,
      boundOutletName: null,
      isSwitchModalOpen: false,
      pendingChange: null,
    };
    set(nextState);
    saveCartToStorage({ ...get(), ...nextState });
  },

  openSwitchModal: (pending) => set({ isSwitchModalOpen: true, pendingChange: pending }),
  closeSwitchModal: () => set({ isSwitchModalOpen: false, pendingChange: null }),

  confirmSwitchOutlet: () => {
    const { pendingChange } = get();
    if (!pendingChange) return;

    const { targetOutlet, pendingItemToAdd } = pendingChange;

    try {
      useOutletStore.getState().setSelectedOutlet(targetOutlet);
    } catch {
      // safe fallback if store hydration is in progress
    }

    let nextItems: CartItem[] = [];
    if (pendingItemToAdd) {
      nextItems = [
        {
          itemId: pendingItemToAdd.item.id,
          itemName: pendingItemToAdd.item.name,
          unitPrice: pendingItemToAdd.item.effectivePrice,
          quantity: pendingItemToAdd.quantity,
          selectedOptions: pendingItemToAdd.options,
          category: pendingItemToAdd.item.category,
        },
      ];
    }

    const nextState = {
      boundOutletId: targetOutlet.id,
      boundOutletName: targetOutlet.name,
      items: nextItems,
      isSwitchModalOpen: false,
      pendingChange: null,
      isCartDrawerOpen: true,
    };

    set(nextState);
    saveCartToStorage({ ...get(), ...nextState });
  },

  getSubtotal: () => {
    const { items } = get();
    return Math.round(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100) / 100;
  },

  getBaseAmount: () => {
    const subtotal = get().getSubtotal();
    return Math.round((subtotal / 1.05) * 100) / 100;
  },

  getGstAmount: () => {
    const subtotal = get().getSubtotal();
    const base = get().getBaseAmount();
    return Math.round((subtotal - base) * 100) / 100;
  },

  getDeliveryFee: () => {
    const { fulfillmentType, deliveryAddress } = get();
    if (fulfillmentType === 'PICKUP') return 0;
    const distance = deliveryAddress.distanceKm ?? 2.5;
    if (distance > 3.0) {
      return Math.round((30.0 + (distance - 3.0) * 10.0) * 100) / 100;
    }
    return 30.0;
  },

  getTotalAmount: () => {
    return Math.round((get().getSubtotal() + get().getDeliveryFee()) * 100) / 100;
  },

  getItemCount: () => {
    return get().items.reduce((count, i) => count + i.quantity, 0);
  },

  initializeCart: () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('dumline_cart');
        if (stored) {
          const parsed = JSON.parse(stored);
          set({
            boundOutletId: parsed.boundOutletId || null,
            boundOutletName: parsed.boundOutletName || null,
            items: parsed.items || [],
            fulfillmentType: parsed.fulfillmentType || 'DELIVERY',
            deliveryAddress: parsed.deliveryAddress || {
              line1: '',
              city: 'Hyderabad',
              distanceKm: 2.5,
            },
          });
        }
      } catch {
        localStorage.removeItem('dumline_cart');
      }
    }
  },
}));

function saveCartToStorage(state: Partial<CartState>): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        'dumline_cart',
        JSON.stringify({
          boundOutletId: state.boundOutletId,
          boundOutletName: state.boundOutletName,
          items: state.items,
          fulfillmentType: state.fulfillmentType,
          deliveryAddress: state.deliveryAddress,
        })
      );
    } catch {
      // ignore
    }
  }
}

