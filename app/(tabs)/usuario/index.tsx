// app/(tabs)/usuario/index.tsx
import { useAuth } from "@/src/state/auth";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function UsuarioIndex() {
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);
  const hasValidToken = useAuth((s) => s.hasValidToken);

  useEffect(() => {
    const ok = !!token && hasValidToken();

    if (ok) {
      router.replace({
        pathname: "/(tabs)/usuario/perfil",
        params: {
          userId: String(user?.id ?? ""),
          email: String(user?.correo ?? ""),
        },
      });
    } else {
      router.replace("/(tabs)/usuario/login");
    }
  }, [token]); // deps simples

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}
