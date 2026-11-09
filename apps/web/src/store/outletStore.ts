import { create } from 'zustand';
import { OutletSummary } from '@dumline/shared';
import ApiClient from '../lib/api';

interface OutletState {
  outlets: OutletSummary[];
  selectedOutlet: OutletSummary | null;
  isLoading: boolean;
  error: string | null;
  loadOutlets: () => Promise<void>;
  setSelectedOutlet: (outlet: OutletSummary) => void;
}

export const useOutletStore = create<OutletState>((set, get) => ({
  outlets: [],
  selectedOutlet: null,
  isLoading: false,
  error: null,

  loadOutlets: async () => {
    set({ isLoading: true, error: null });
    try {
      const outlets = await ApiClient.getOutlets(true);
      set({ outlets, isLoading: false });

      // If no outlet is selected yet, select Gachibowli as the royal default or restore from storage
      const current = get().selectedOutlet;
      if (!current && outlets.length > 0) {
        let storedId: string | null = null;
        if (typeof window !== 'undefined') {
          storedId = localStorage.getItem('dumline_selected_outlet_id');
        }
        const matched = storedId ? outlets.find((o) => o.id === storedId) : null;
        const gachibowliDefault =
          outlets.find((o) => o.slug === 'gachibowli-cloud-kitchen' || o.slug.includes('gachibowli') || o.name.toLowerCase().includes('gachibowli')) ||
          outlets[0];
        const initial = matched || gachibowliDefault;
        set({ selectedOutlet: initial });
        if (typeof window !== 'undefined') {
          localStorage.setItem('dumline_selected_outlet_id', initial.id);
        }
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setSelectedOutlet: (outlet: OutletSummary) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dumline_selected_outlet_id', outlet.id);
    }
    set({ selectedOutlet: outlet });
  },
}));

