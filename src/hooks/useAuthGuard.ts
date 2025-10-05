import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/state/auth";

// Redirige a login si no hay token válido.
// Espera a que Zustand rehidrate SecureStore para evitar “flicker”.
export function useAuthGuard() {
  const router = useRouter();
  const hasHydrated = useAuth.persist.hasHydrated();
  const { isAuthenticated, hasValidToken } = useAuth();

  useEffect(() => {
    if (!hasHydrated) return;
    const ok = isAuthenticated && hasValidToken();
    if (!ok) router.replace("/(tabs)/usuario/login");
  }, [hasHydrated, isAuthenticated, hasValidToken, router]);
}
