// app/(tabs)/usuario/favoritos.tsx
import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Favoritos() {
  const router = useRouter();

  const goProductos = () =>
    router.push('/(tabs)/usuario/crearcuenta'); 
  const goLugares = () =>
    router.push('/(tabs)/usuario/crearcuenta/informacion');   

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
        Mis favoritos
      </Text>

      <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <Tile label="Productos" onPress={goProductos}>
          <MaterialIcons name="shopping-bag" size={28} />
        </Tile>

        <Tile label="Lugares" onPress={goLugares}>
          <Ionicons name="location-sharp" size={28} />
        </Tile>
      </View>
    </ScrollView>
  );
}

function Tile({
  children,
  label,
  onPress,
}: {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#e5e7eb" }}
      style={{
        width: "48%",                // 2 columnas
        backgroundColor: "#F9FAFB",
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <View style={{ alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 9999,
            backgroundColor: "#E5E7EB",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </View>
        <Text style={{ fontWeight: "700", color: "#111827", textAlign: "center" }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
