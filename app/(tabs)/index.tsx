import { getCategorias } from "@/src/lib/api";
import { Link, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

  return (
    <ScrollView style={{ flex: 1, paddingTop: 20 }}>
      <Stack.Screen options={{ title: "TuriApp" }} />
      <Text style={styles.subtitle}>Lugares por conocer</Text>

      {/* 🔹 Bloque de botones de navegación rápida */}
      <View style={styles.quickNav}>
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.quickNavRow}>
          <Link href="/reserva" asChild>
            <Pressable style={styles.quickButton}>
              <Text style={styles.quickButtonText}>Reserva</Text>
            </Pressable>
          </Link>
          <Link href="/confirmacion" asChild>
            <Pressable style={styles.quickButton}>
              <Text style={styles.quickButtonText}>Confirmación</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.quickNavRow}>
          <Link href="/idioma" asChild>
            <Pressable style={styles.quickButton}>
              <Text style={styles.quickButtonText}>Idioma</Text>
            </Pressable>
          </Link>
          <Link href="/calculadora" asChild>
            <Pressable style={styles.quickButton}>
              <Text style={styles.quickButtonText}>Recorridos</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.quickNavRow}>
          <Link href="/recomendaciones" asChild>
            <Pressable style={styles.quickButton}>
              <Text style={styles.quickButtonText}>Recomendaciones</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {/* 🔹 Lista de categorías */}
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
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
              <Pressable
                android_ripple={{ color: "#00000022" }}
                style={styles.card}
              >
                <View style={[styles.cardInner, { backgroundColor: bg }]}>
                  <Text
                    numberOfLines={2}
                    style={[styles.cardTitle, { color: fg }]}
                  >
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  subtitle: { fontSize: 20, textAlign: "center", marginBottom: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  quickNav: { paddingHorizontal: 16, marginBottom: 20 },
  quickNavRow: { flexDirection: "row", justifyContent: "space-between" },
  quickButton: {
    flex: 1,
    backgroundColor: "#211C1C",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    marginBottom: 10,
  },
  quickButtonText: { color: "#fff", textAlign: "center", fontWeight: "600" },

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
});
