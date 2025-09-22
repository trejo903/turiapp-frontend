// app/(tabs)/usuario/perfil.tsx
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter, Link } from "expo-router";

export default function Perfil() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Mi perfil</Text>
      {!!email && <Text style={{ color: "#6b7280" }}>{email}</Text>}

    </View>
  );
}
