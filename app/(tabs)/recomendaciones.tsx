// app/(tabs)/recomendaciones.tsx
import FilterModal from "@/src/components/FilterModal";
import { BASE_URL } from "@/src/lib/api";
import { useAuth } from "@/src/state/auth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

export type SortBy = 'distance' | 'rating' | 'popular' | 'combined';

type Reco = {
  id: number;
  nombre: string;
  img?: string | null;
  latitude: number;
  longitude: number;
  estado: string;
  municipio: string;
  cp?: string | null;
  score?: number;         // promedio/ranking
  distancekm?: number;    // distancia en KM
  reviewCount?: number;   // # de opiniones
};

const formatImageUrl = (imgPath?: string | null) => {
  if (!imgPath) return null;
  if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) return imgPath;
  return `https://res.cloudinary.com/${imgPath}`;
};

export default function RecomendacionesTab() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Reco[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);


  const [selectedFilter, setSelectedFilter] =
    useState<SortBy>("distance");

  const subtitle = useMemo(() => {
    if (!userLocation) return "Cerca de ti";
    return `Cerca de ti (${userLocation.latitude.toFixed(3)}, ${userLocation.longitude.toFixed(3)})`;
  }, [userLocation]);

  // Orden local (además de pedirlo al backend)
  const calculateCombinedScore = (item: Reco) => {
    const maxDistance = Math.max(...items.map(i => i.distancekm || 0));
    const normalizedDistance = maxDistance > 0 ? 1 - ((item.distancekm || 0) / maxDistance) : 0;
    const normalizedRating = (item.score || 0) / 5;
    return (normalizedDistance * 0.5) + (normalizedRating * 0.5);
  };
  const router = useRouter();

  const sortedItems = useMemo(() => {
    const arr = [...items];
    switch (selectedFilter) {
      case "distance":
        return arr.sort((a, b) => (a.distancekm ?? Infinity) - (b.distancekm ?? Infinity));
      case "rating":
        return arr.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      case "popular":
        return arr.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
      case "combined":
        return arr.sort((a, b) => calculateCombinedScore(b) - calculateCombinedScore(a));
      default:
        return arr;
    }
  }, [items, selectedFilter]);

  const getFilterLabel = () => {
    switch (selectedFilter) {
      case "distance": return "Más cercano";
      case "rating": return "Mejor puntuado";
      case "popular": return "Más opinado";
      case "combined": return "Recomendado";
      default: return "Filtrar";
    }
  };

  const openMaps = useCallback(
    async (lat: number, lng: number) => {
      const origin = userLocation ? `${userLocation.latitude},${userLocation.longitude}` : null;
      const googleApp = `comgooglemaps://?${origin ? `saddr=${origin}&` : ""}daddr=${lat},${lng}&directionsmode=driving`;
      const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${origin ? `&origin=${origin}` : ""}&travelmode=driving`;
      const appleApp = `maps://?${origin ? `saddr=${origin}&` : ""}daddr=${lat},${lng}`;
      const appleWeb = `http://maps.apple.com/?${origin ? `saddr=${origin}&` : ""}daddr=${lat},${lng}`;
      if (Platform.OS === "ios") {
        const canApple = await Linking.canOpenURL("maps://");
        if (canApple) return Linking.openURL(appleApp);
        const canGoogle = await Linking.canOpenURL("comgooglemaps://");
        if (canGoogle) return Linking.openURL(googleApp);
        return Linking.openURL(appleWeb);
      } else {
        const canGoogle = await Linking.canOpenURL("comgooglemaps://");
        if (canGoogle) return Linking.openURL(googleApp);
        return Linking.openURL(googleWeb);
      }
    },
    [userLocation]
  );

  const fetchRecs = useCallback(async () => {
    if (!userLocation) return;
    try {
      setLoading(true);

      // 👇 ahora enviamos sortBy para que el backend ordene
      const url =
        `${BASE_URL}/recs/nearby` +
        `?lat=${userLocation.latitude}` +
        `&lng=${userLocation.longitude}` +
        (userId ? `&userId=${userId}` : "") +
        `&k=30` +
        `&sortBy=${selectedFilter}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // El backend responde { sortByUsed, total, data: [...] }
      const payload: { sortByUsed: string; total: number; data: any[] } = await res.json();

      const mapped: Reco[] = (payload.data ?? []).map((r) => ({
        id: Number(r.id),
        nombre: r.nombre,
        img: r.img ?? r.image ?? null,
        latitude: Number(r.latitude ?? r.lat),
        longitude: Number(r.longitude ?? r.lng),
        estado: r.estado,
        municipio: r.municipio,
        cp: r.cp ?? null,
        score: Number(r.score ?? r.reco_score ?? r.avg_rating ?? 0),
        distancekm: Number(r.distancekm ?? r.distanceKm ?? r.distance_km ?? r.distance ?? 0),
        reviewCount: Number(r.reviewCount ?? r.review_count ?? 0),
      }));

      setItems(mapped);
    } catch (e: any) {
      console.log("Recs error:", e?.message ?? e);
      Alert.alert("Recomendaciones", "No se pudieron cargar las recomendaciones.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userLocation, userId, selectedFilter]);

  // Permisos + ubicación
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Ubicación", "Necesitamos permiso de ubicación para recomendarte lugares cercanos.");
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    })();
  }, []);

  // Refetch cuando haya ubicación o cambie el filtro
  useEffect(() => {
    if (userLocation) fetchRecs();
  }, [userLocation, selectedFilter, fetchRecs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecs();
  };

  const renderItem = ({ item }: { item: Reco }) => {
    const uri = formatImageUrl(item.img) ?? undefined;
    return (
      <View style={s.card}>
        {uri ? (
          <Image source={{ uri }} style={s.img} resizeMode="cover" />
        ) : (
          <View style={s.imgPlaceholder}>
            <MaterialCommunityIcons name="image-off-outline" size={36} color="#888" />
          </View>
        )}
        <View style={s.cardBody}>
          <Text style={s.title}>{item.nombre}</Text>
          <Text style={s.meta}>
            {item.municipio}, {item.estado}
            {item.cp ? `, C.P. ${item.cp}` : ""}
          </Text>
          <View style={s.badges}>
            {typeof item.distancekm === "number" && (
              <View style={s.badge}>
                <MaterialCommunityIcons name="map-marker-distance" size={14} />
                <Text style={s.badgeText}>{item.distancekm.toFixed(2)} km</Text>
              </View>
            )}
            {typeof item.score === "number" && item.score > 0 && (
              <View style={s.badge}>
                <MaterialCommunityIcons name="star-outline" size={14} />
                <Text style={s.badgeText}>{item.score.toFixed(2)}</Text>
              </View>
            )}
            {typeof item.reviewCount === "number" && item.reviewCount > 0 && (
              <View style={s.badge}>
                <MaterialCommunityIcons name="message-text-outline" size={14} />
                <Text style={s.badgeText}>{item.reviewCount}</Text>
              </View>
            )}
          </View>

          <View style={s.actions}>

            {/* 🟢 Botón verde - Ir (redirige al mapa con ruta y bottomsheet) */}
            <Link
              href={{
                pathname: "/mapa/mapa", // 👈 ruta absoluta, no relativa
                params: { sitioId: String(item.id) }, // el ID real del sitio
              }}
              asChild
            >
              <TouchableOpacity style={[s.btn, s.btnMap]}>
                <MaterialCommunityIcons name="navigation" size={16} color="#0000" />
                <Text style={s.btnTextWhite}>Ir</Text>
              </TouchableOpacity>
            </Link>

            {/* 🔹 Botón azul - Más información */}
            <Link href={`/sitios/${item.id}`} asChild>
              <TouchableOpacity style={[s.btn, s.btnPrimary]}>
                <Text style={s.btnTextPrimary}>Más información</Text>
              </TouchableOpacity>
            </Link>

            
          </View>

        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View className="headerTop" style={s.headerTop}>
          <Text style={s.h1}>Recomendados</Text>
          <TouchableOpacity style={s.filterButton} onPress={() => setFilterModalVisible(true)}>
            <MaterialCommunityIcons name="filter-variant" size={20} color="#0d0575ff" />
            <Text style={s.filterButtonText}>{getFilterLabel()}</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.h2}>{subtitle}</Text>
      </View>

      {loading ? (
        <View style={s.loading}>
          <ActivityIndicator />
          <Text style={s.loadingTxt}>Buscando lugares cercanos…</Text>
        </View>
      ) : (
        <FlatList
          data={sortedItems}  // 👈 usa la lista ordenada
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={s.empty}>No hay recomendaciones por ahora.</Text>}
        />
      )}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedFilter={selectedFilter}
        onFilterChange={(f: string) => setSelectedFilter(f as SortBy)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 16, paddingBottom: 6 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  h1: { fontSize: 22, fontWeight: "700", color: "#0d0575ff" },
  h2: { fontSize: 14, color: "#666", marginTop: 2 },

  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f8f9ff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterButtonText: { fontSize: 14, fontWeight: "600", color: "#0d0575ff" },

  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  loadingTxt: { color: "#666" },
  empty: { textAlign: "center", color: "#777", marginTop: 40 },

  card: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", elevation: 2, shadowOpacity: 0.08 },
  img: { width: "100%", height: 140 },
  imgPlaceholder: {
    width: "100%", height: 140, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center",
  },
  cardBody: { padding: 12, gap: 8 },
  title: { fontSize: 16, fontWeight: "700", color: "#111" },
  meta: { fontSize: 13, color: "#555" },

  badges: { flexDirection: "row", gap: 10, marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f1f5ff", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 9999 },
  badgeText: { fontSize: 12, color: "#333" },

  actions: { flexDirection: "row", gap: 10, marginTop: 6 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  btnPrimary: { backgroundColor: "#0d0575ff" },
  btnMap: { backgroundColor: "#4CAF50" },
  btnTextPrimary: { color: "#fff", fontWeight: "700" },
  btnTextWhite: { color: "#fff", fontWeight: "700" },
});
