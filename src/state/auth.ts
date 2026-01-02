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

      // ✅ guarda también isAuthenticated
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
      }),

      // ✅ al rehidratar: ajusta isAuthenticated según token válido
      onRehydrateStorage: () => (state, error) => {
        if (!state) return;

        const t = state.token;
        if (!t) {
          // sin token => fuera
          state.logout();
          return;
        }

        try {
          const { exp } = jwtDecode<JwtPayload>(t);
          // si no hay exp, lo consideramos válido (como tu lógica)
          if (!exp) {
            // marca sesión como activa (por si venía false)
            state.login({ user: state.user as any, token: t });
            return;
          }

          const now = Math.floor(Date.now() / 1000);
          if (exp > now) {
            // válido => asegura bandera en true
            state.login({ user: state.user as any, token: t });
          } else {
            // expirado => limpia
            state.logout();
          }
        } catch {
          state.logout();
        }
      },
    }
  )
);
