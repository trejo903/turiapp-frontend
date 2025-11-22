// app/(tabs)/recomendaciones.tsx
import FilterModal, {
  CategoryFilter,
  SortFilter,
} from "@/src/components/FilterModal";
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
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Reco = {
  id: number;
  nombre: string;
  img?: string | null;
  latitude: number;
  longitude: number;
  estado: string;
  municipio: string;
  cp?: string | null;
  score?: number; // promedio/ranking
  distancekm?: number; // distancia en KM
  reviewCount?: number; // # de opiniones
};

const formatImageUrl = (imgPath?: string | null) => {
  if (!imgPath) return null;
  if (imgPath.startsWith("http://") || imgPath.startsWith("https://"))
    return imgPath;
  return `https://res.cloudinary.com/${imgPath}`;
};

// 👇 Mapea el filtro a los IDs de tu tabla "categoria"
const getCategoriaIdFromFilter = (filter: CategoryFilter): number | null => {
  switch (filter) {
    case "ocio":
      return 1; // Ocio & Aventura
    case "gastro":
      return 2; // Gastro & Cultura
    case "relax":
      return 3; // Relax & Salud Hotel
    case "fre":
      return 4; // FreeFire (si la usas)
    case "all":
    default:
      return null; // todas las categorías
  }
};

export default function RecomendacionesTab() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Reco[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [selectedFilter, setSelectedFilter] =
    useState<CategoryFilter>("all");

  const [selectedSort, setSelectedSort] =
    useState<SortFilter>("distance"); // Más cercano por defecto

  const router = useRouter();

  const subtitle = useMemo(() => {
    if (!userLocation) return "Cerca de ti";
    return `Cerca de ti (${userLocation.latitude.toFixed(
      3
    )}, ${userLocation.longitude.toFixed(3)})`;
  }, [userLocation]);

  const getFilterLabel = () => {
    switch (selectedFilter) {
      case "all":
        return "Todas";
      case "ocio":
        return "Ocio & Aventura";
      case "gastro":
        return "Gastro & Cultura";
      case "relax":
        return "Relax & Salud Hotel";
      default:
        return "Filtrar";
    }
  };

  // --- Fetch recomendaciones desde backend ---
  const fetchRecs = useCallback(async () => {
    if (!userLocation) return;
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("lat", String(userLocation.latitude));
      params.append("lng", String(userLocation.longitude));
      params.append("k", "30");
      params.append("sortBy", selectedSort); // 👈 orden

      if (userId) params.append("userId", String(userId));

      const categoriaId = getCategoriaIdFromFilter(selectedFilter);
      if (categoriaId !== null) {
        params.append("categoriaId", String(categoriaId));
      }

      const res = await fetch(`${BASE_URL}/recs/nearby?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const payload: { total: number; data: any[] } = await res.json();

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
        distancekm: Number(
          r.distancekm ?? r.distanceKm ?? r.distance_km ?? r.distance ?? 0
        ),
        reviewCount: Number(r.reviewCount ?? r.review_count ?? 0),
      }));

      setItems(mapped);
    } catch (e: any) {
      console.log("Recs error:", e?.message ?? e);
      Alert.alert(
        "Recomendaciones",
        "No se pudieron cargar las recomendaciones."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userLocation, userId, selectedFilter, selectedSort]); // 👈 incluye sort

  // --- Permiso + ubicación del usuario ---
  useEffect(() => {
    (async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Ubicación",
          "Necesitamos permiso de ubicación para recomendarte lugares cercanos."
        );
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    })();
  }, []);

  // --- Refetch cuando haya ubicación o cambie filtros / orden ---
  useEffect(() => {
    if (userLocation) fetchRecs();
  }, [userLocation, selectedFilter, selectedSort, fetchRecs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecs();
  };

  // --- Render de cada card ---
  const renderItem = ({ item }: { item: Reco }) => {
    const uri = formatImageUrl(item.img) ?? undefined;

    return (
      <View style={s.card}>
        {/* Imagen superior */}
        {uri ? (
          <Image source={{ uri }} style={s.img} resizeMode="cover" />
        ) : (
          <View style={s.imgPlaceholder}>
            <MaterialCommunityIcons
              name="image-off-outline"
              size={36}
              color="#888"
            />
          </View>
        )}

        {/* Contenido */}
        <View style={s.cardBody}>
          <Text style={s.title} numberOfLines={1}>
            {item.nombre}
          </Text>
          <Text style={s.meta} numberOfLines={1}>
            {item.municipio}, {item.estado}
            {item.cp ? `, C.P. ${item.cp}` : ""}
          </Text>

          {/* Badges de info */}
          <View style={s.badges}>
            {typeof item.distancekm === "number" && (
              <View style={s.badge}>
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={14}
                />
                <Text style={s.badgeText}>
                  {item.distancekm.toFixed(2)} km
                </Text>
              </View>
            )}
            {typeof item.score === "number" && item.score > 0 && (
              <View style={s.badge}>
                <MaterialCommunityIcons name="star-outline" size={14} />
                <Text style={s.badgeText}>{item.score.toFixed(2)}</Text>
              </View>
            )}
            {typeof item.reviewCount === "number" &&
              item.reviewCount > 0 && (
                <View style={s.badge}>
                  <MaterialCommunityIcons
                    name="message-text-outline"
                    size={14}
                  />
                  <Text style={s.badgeText}>{item.reviewCount}</Text>
                </View>
              )}
          </View>

          {/* Acciones */}
          <View style={s.actions}>
            {/* Ir al mapa interno */}
            <TouchableOpacity
              style={[s.btn, s.btnMap]}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/home/mapa/mapa",
                  params: { sitioId: String(item.id) },
                })
              }
            >
              <MaterialCommunityIcons
                name="map-search"
                size={16}
                color="#fff"
              />
              <Text style={s.btnTextWhite}>Ver en mapa</Text>
            </TouchableOpacity>

            {/* Más información */}
            <Link href={`/(tabs)/home/sitios/${item.id}`} asChild>
              <TouchableOpacity style={[s.btn, s.btnPrimary]}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={16}
                  color="#fff"
                />
                <Text style={s.btnTextWhite}>Detalles</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.h1}>Recomendados</Text>
            <Text style={s.h2}>{subtitle}</Text>
          </View>

          <TouchableOpacity
            style={s.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={20}
              color="#0d0575ff"
            />
            <Text style={s.filterButtonText}>{getFilterLabel()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista */}
      {loading ? (
        <View style={s.loading}>
          <ActivityIndicator />
          <Text style={s.loadingTxt}>Buscando lugares cercanos…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={s.empty}>No hay recomendaciones por ahora.</Text>
          }
        />
      )}

      {/* Modal de filtros + orden */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f9" },

  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e4e4ea",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h1: { fontSize: 22, fontWeight: "700", color: "#0d0575ff" },
  h2: { fontSize: 13, color: "#777", marginTop: 2 },

  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f8f9ff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0d0575ff",
  },

  listContent: {
    padding: 12,
    gap: 12,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingTxt: { color: "#666" },
  empty: {
    textAlign: "center",
    color: "#777",
    marginTop: 40,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  img: { width: "100%", height: 140 },
  imgPlaceholder: {
    width: "100%",
    height: 140,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111" },
  meta: { fontSize: 13, color: "#555" },

  badges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f1f5ff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  badgeText: { fontSize: 12, color: "#333" },

  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  btn: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  btnPrimary: { backgroundColor: "#0d0575ff" },
  btnMap: { backgroundColor: "#4CAF50" },
  btnTextWhite: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
