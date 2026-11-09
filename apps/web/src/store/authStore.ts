import { create } from 'zustand';
import { UserSummary } from '@dumline/shared';

interface AuthState {
  user: UserSummary | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (token: string, user: UserSummary) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dumline_token', token);
      localStorage.setItem('dumline_user', JSON.stringify(user));
    }
    set({ token, user, isAuthenticated: true, isInitialized: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dumline_token');
      localStorage.removeItem('dumline_user');
    }
    set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
  },

  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('dumline_token');
      const userStr = localStorage.getItem('dumline_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as UserSummary;
          set({ token, user, isAuthenticated: true, isInitialized: true });
          return;
        } catch {
          localStorage.removeItem('dumline_token');
          localStorage.removeItem('dumline_user');
        }
      }
    }
    set({ isInitialized: true });
  },
}));

