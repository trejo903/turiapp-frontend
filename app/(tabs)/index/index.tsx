// app/(tabs)/index.tsx
import { getCategorias } from "@/src/lib/api";
import { Link, Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

type Categoria = {
  id: number | string;
  nombre: string;
  img?: string | null;
  color?: string | null;
};

function getContrastText(bg?: string | null) {
  const hex = (bg ?? "#ffffff").replace("#", "");
  if (hex.length !== 6) return "#000";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000" : "#fff";
}

export default function Index() {
  const router = useRouter();
  const tabBarH = useBottomTabBarHeight();

  const [data, setData] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cats = await getCategorias();
        setData(cats);
      } catch (e: any) {
        setError(e?.message ?? "Error al cargar las categorias");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Cargando categorías…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  const openChat = () => {
    router.push("/sitios/chat"); // 👈 ruta recomendada (archivo en app/chat.tsx)
  };

  return (
    <View style={{ flex: 1, paddingTop: 20 }}>
      <Stack.Screen options={{ title: "TuriApp" }} />
      <Text style={styles.subtitle}>Lugares por conocer</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }} // espacio para el FAB
        renderItem={({ item }) => {
          const bg = (item.color ?? "#f5f5f5").trim();
          const fg = getContrastText(bg);

          return (
            <Link
              href={{
                pathname: "/mapa/mapa",
                params: { catId: String(item.id), nombre: item.nombre },
              }}
              asChild
            >
              <Pressable android_ripple={{ color: "#00000022" }} style={styles.card}>
                <View style={[styles.cardInner, { backgroundColor: bg }]}>
                  <Text numberOfLines={2} style={[styles.cardTitle, { color: fg }]}>
                    {item.nombre}
                  </Text>
                  <Text style={[styles.cardCta, { color: fg, opacity: 0.9 }]}>
                    Ver en el mapa
                  </Text>
                </View>
              </Pressable>
            </Link>
          );
        }}
        ListEmptyComponent={<Text>Sin datos</Text>}
      />

      {/* FAB Chat */}
      <TouchableOpacity
        style={[styles.fabChat, { bottom: tabBarH + 16 }]}
        onPress={openChat}
        activeOpacity={0.9}
      >
        <MaterialCommunityIcons name="message-text-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  subtitle: { fontSize: 20, textAlign: "center", marginBottom: 12 },

  row: { justifyContent: "space-between", marginBottom: 12 },
  card: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    overflow: "hidden",
  },
  cardInner: {
    height: 130,
    borderRadius: 14,
    padding: 12,
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardCta: { fontSize: 12, fontWeight: "600" },

  // FAB de chat
  fabChat: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0d0575ff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
