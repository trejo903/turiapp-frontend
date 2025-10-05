// app/(tabs)/usuario/mis-comentarios.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { useFocusEffect, Link } from "expo-router";
import { useAuth } from "@/src/state/auth";
import { OpinionApi, getOpinionesDeUsuario } from "@/src/lib/api";

export default function MisComentarios() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<OpinionApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!userId) {
      setError("Necesitas iniciar sesión para ver tus comentarios.");
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const data = await getOpinionesDeUsuario(userId); // <- SIEMPRE público
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "No se pudieron cargar tus comentarios");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  }, [cargar]);

  const total = items.length;
  const promedio = useMemo(() => {
    if (!total) return null;
    const sum = items.reduce((a, b) => a + (b.puntuacion ?? 0), 0);
    return (sum / total).toFixed(1);
  }, [items, total]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Cargando tus comentarios…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Mis comentarios</Text>
        <Text style={{ color: "#ef4444", textAlign: "center", marginTop: 8 }}>
          {String(error)}
        </Text>
        <Pressable onPress={cargar} style={[styles.primaryBtn, { marginTop: 12 }]}>
          <Text style={styles.primaryBtnText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis comentarios</Text>
        <Text style={styles.meta}>
          {total ? `(${total})` : "(0)"} {promedio ? `• Promedio ${promedio}⭐` : ""}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#6b7280" }}>
            Aún no has publicado comentarios.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.cardTitle}>
                {item.sitio?.id ? `Sitio #${item.sitio.id}` : "Sitio"}
              </Text>
              <Text style={styles.badge}>{item.puntuacion}⭐</Text>
            </View>

            <Text style={{ marginTop: 6 }}>{item.comentario}</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.date}>
                {new Date(item.fecha).toLocaleDateString()}
              </Text>
              {item.sitio?.id ? (
                <Link
                  href={{ pathname: "/sitios/[id]", params: { id: String(item.sitio.id) } }}
                  asChild
                >
                  <Pressable style={styles.linkBtn}>
                    <Text style={styles.linkBtnText}>Ver sitio</Text>
                  </Pressable>
                </Link>
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "#fff" },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700" },
  meta: { marginTop: 4, color: "#6b7280" },
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  cardTitle: { fontWeight: "700" },
  badge: { fontWeight: "700", color: "#111827" },
  cardFooter: { marginTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  date: { fontSize: 12, color: "#6b7280" },
  linkBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#111827", borderRadius: 8 },
  linkBtnText: { color: "#fff", fontWeight: "700" },
  primaryBtn: { backgroundColor: "#111827", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
});
