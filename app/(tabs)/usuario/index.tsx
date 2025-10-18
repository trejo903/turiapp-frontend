// app/(tabs)/usuario/index.tsx
import { useAuth } from "@/src/state/auth";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function UsuarioIndex() {
  const { isAuthenticated, hasValidToken, user } = useAuth();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isAuthenticated && hasValidToken()) {
        // ✅ Si ya hay sesión → ir directo al perfil
        router.replace({
          pathname: "/(tabs)/usuario/perfil",
          params: {
            userId: String(user?.id ?? ""),
            email: String(user?.correo ?? ""),
          },
        });
      } else {
        // ❌ Si no hay sesión → ir al login
        router.replace("/(tabs)/usuario/login");
      }
    }, 120);

    return () => clearTimeout(timeout);
  }, [isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}
