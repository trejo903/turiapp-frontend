import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  Alert,
  Animated,
} from "react-native";
import { useFocusEffect, Link } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import { useAuth } from "@/src/state/auth";
import { OpinionApi, getOpinionesDeUsuario, deleteOpinion } from "@/src/lib/api";



// Tipos útiles
type Interp = Animated.AnimatedInterpolation<string | number>;
type RowRef = Swipeable | null;

export default function MisComentarios() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<OpinionApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const rowRefs = useRef<Record<string, RowRef>>({});

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
      const data = await getOpinionesDeUsuario(userId);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "No se pudieron cargar tus comentarios");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

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

  const openConfirm = (id: number, key: string) => {
    setPendingId(id);
    setConfirmOpen(true);
    rowRefs.current[key]?.close?.(); // cierra el swipe visualmente
  };

  const handleDelete = async () => {
    if (!pendingId) return;
    try {
      // Optimista: quita de la lista
      setItems((prev) => prev.filter((x) => x.id !== pendingId));
      setConfirmOpen(false);
      await deleteOpinion(pendingId);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo eliminar el comentario");
      cargar(); // revertir/recargar
    } finally {
      setPendingId(null);
    }
  };

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
      // ✅ corregido el brace extra
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
        renderItem={({ item }) => {
  const key = String(item.id);
  const sitio = item.sitio; // 🔹narrowing claro para TS

  return (
    <Swipeable
      friction={2}
      rightThreshold={40}
      renderRightActions={(progress, dragX) => (
        <DeleteAction progress={progress as any} dragX={dragX as any} />
      )}
      onSwipeableOpen={(direction) => {
        if (direction === "right") openConfirm(item.id, key);
      }}
    >
      <View style={styles.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.cardTitle}>
            {sitio
              ? `Sitio #${sitio.id}${sitio.nombre ? ` • ${sitio.nombre}` : ""}`
              : "Sitio"}
          </Text>
          <Text style={styles.badge}>{item.puntuacion}⭐</Text>
        </View>

        <Text style={{ marginTop: 6 }}>{item.comentario}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.date}>
            {new Date(item.fecha).toLocaleDateString()}
          </Text>
          {sitio?.id ? (
            <Link
              href={{ pathname: "/sitios/[id]", params: { id: String(sitio.id) } }}
              asChild
            >
              <Pressable style={styles.linkBtn}>
                <Text style={styles.linkBtnText}>Ver sitio</Text>
              </Pressable>
            </Link>
          ) : null}
        </View>
      </View>
    </Swipeable>
  );
}}

      />

      {/* Modal de confirmación */}
      <Modal
        transparent
        visible={confirmOpen}
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontWeight: "700", fontSize: 16 }}>Eliminar comentario</Text>
            <Text style={{ marginTop: 8, color: "#374151" }}>
              ¿Seguro que deseas eliminar este comentario? Esta acción no se puede deshacer.
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 16 }}>
              <Pressable
                onPress={() => setConfirmOpen(false)}
                style={[styles.btn, { backgroundColor: "#e5e7eb" }]}
              >
                <Text style={[styles.btnText, { color: "#111827" }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                style={[styles.btn, { backgroundColor: "#ef4444", marginLeft: 8 }]}
              >
                <Text style={styles.btnText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DeleteAction({
  progress,
  dragX,
}: {
  progress: Interp;
  dragX: Interp;
}) {
  const scale = dragX.interpolate({
    inputRange: [-120, -60, 0],
    outputRange: [1.1, 1, 0.8],
    extrapolate: "clamp",
  });
  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });
  return (
    <Animated.View style={[styles.deleteAction, { opacity }]}>
      <Animated.Text style={{ transform: [{ scale }], color: "#fff", fontWeight: "700" }}>
        Eliminar
      </Animated.Text>
    </Animated.View>
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

  deleteAction: {
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "700" },
});
