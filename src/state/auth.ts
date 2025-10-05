// src/state/auth.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

type User = { id: number; correo: string; nombre?: string; apellido?: string };
type JwtPayload = { exp?: number; sub?: number; correo?: string };

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (p: { user: User; token: string }) => void;
  logout: () => void;
  hasValidToken: () => boolean;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: ({ user, token }) => {
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      hasValidToken: () => {
        const t = get().token;
        if (!t) return false;
        try {
          const { exp } = jwtDecode<JwtPayload>(t);
          if (!exp) return true; // si tu backend no pone 'exp'
          const now = Math.floor(Date.now() / 1000);
          return exp > now;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);
