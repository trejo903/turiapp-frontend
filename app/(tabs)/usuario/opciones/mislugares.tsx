// app/usuario/mis-lugares.tsx (o donde tengas MisCompras)
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Link } from "expo-router";
import { getFavoritos, removeFavorito, Sitio } from "@/src/lib/mislugaresapi";
import { useAuth } from "@/src/state/auth";
import { MaterialCommunityIcons } from "@expo/vector-icons";

function formatImageUrl(imgPath?: string | null) {
  if (!imgPath) return null;
  if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) return imgPath;
  return `https://res.cloudinary.com/${imgPath}`;
}

export default function MisCompras() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<Sitio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      setError("Inicia sesión para ver tus lugares guardados.");
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const sitios = await getFavoritos(userId);
      setItems(sitios);
    } catch (e) {
      setError("No se pudieron cargar tus lugares.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const onRemove = useCallback(
    async (sitio: Sitio) => {
      if (!userId) return;
      // Optimista
      const prev = items;
      setItems((curr) => curr.filter((s) => s.id !== sitio.id));
      try {
        await removeFavorito(userId, sitio.id);
      } catch {
        setItems(prev); // revertir
        Alert.alert("Favoritos", "No se pudo quitar de favoritos.");
      }
    },
    [items, userId]
  );

  const openExternalMaps = async (s: Sitio) => {
    const origin = ""; // si quieres pasar origen, obtén coords del user como ya haces en mapa
    const dest = `${s.latitude},${s.longitude}`;
    const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${dest}${origin}`;
    const googleApp = `comgooglemaps://?daddr=${dest}`;
    const appleApp = `maps://?daddr=${dest}`;

    if (Platform.OS === "ios") {
      const canApple = await Linking.canOpenURL("maps://");
      if (canApple) return Linking.openURL(appleApp);
      const canGoogle = await Linking.canOpenURL("comgooglemaps://");
      if (canGoogle) return Linking.openURL(googleApp);
      return Linking.openURL(googleWeb);
    } else {
      const canGoogle = await Linking.canOpenURL("comgooglemaps://");
      if (canGoogle) return Linking.openURL(googleApp);
      return Linking.openURL(googleWeb);
    }
  };

  const renderItem = ({ item }: { item: Sitio }) => {
    const uri = formatImageUrl(item.img);
    return (
      <View style={styles.card}>
        {uri ? (
          <Image source={{ uri }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <MaterialCommunityIcons name="image-off" size={32} color="#888" />
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.name}>{item.nombre}</Text>
          <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(item)}>
            <MaterialCommunityIcons name="heart-broken" size={18} color="#fff" />
            <Text style={styles.removeText}>Quitar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtle}>
          {item.calle ? `${item.calle}, ` : ""}
          {item.fraccionamiento ? `${item.fraccionamiento}, ` : ""}
          {item.municipio}, {item.estado}
          {item.cp ? `, C.P. ${item.cp}` : ""}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.mapBtn} onPress={() => openExternalMaps(item)}>
            <MaterialCommunityIcons name="navigation" size={18} color="#fff" />
            <Text style={styles.mapText}>Abrir en mapas</Text>
          </TouchableOpacity>

          <Link href={`/(tabs)/home/sitios/${item.id}`} asChild>
            <TouchableOpacity style={styles.moreBtn}>
              <Text style={styles.moreText}>Más información</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando tus lugares…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="heart-outline" size={36} color="#999" />
        <Text style={styles.muted}>Aún no tienes lugares guardados.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(s) => String(s.id)}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
  muted: { color: "#666" },
  error: { color: "#b00020", fontWeight: "600", textAlign: "center" },
  retry: { backgroundColor: "#0d0575ff", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600" },

  card: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", elevation: 2 },
  cover: { width: "100%", height: 140 },
  coverPlaceholder: {
    width: "100%", height: 140, backgroundColor: "#f3f4f6",
    justifyContent: "center", alignItems: "center",
  },

  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, gap: 12 },
  name: { fontSize: 18, fontWeight: "700", color: "#0d0575ff", flex: 1 },

  removeBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#E53935", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  removeText: { color: "#fff", fontWeight: "700" },

  subtle: { color: "#444", paddingHorizontal: 12, paddingBottom: 8 },

  actions: { flexDirection: "row", gap: 10, padding: 12 },
  mapBtn: { flex: 1, backgroundColor: "#4CAF50", padding: 12, borderRadius: 8, flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" },
  mapText: { color: "#fff", fontWeight: "700" },
  moreBtn: { flex: 1, backgroundColor: "#0d0575ff", padding: 12, borderRadius: 8, alignItems: "center" },
  moreText: { color: "#fff", fontWeight: "700" },
});
