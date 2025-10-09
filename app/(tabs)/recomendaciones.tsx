// app/(tabs)/recomendaciones.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import * as Location from "expo-location";
import { Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/src/state/auth";
import { BASE_URL } from "@/src/lib/api";

type Reco = {
  id: number;
  nombre: string;
  img?: string | null;
  latitude: number;
  longitude: number;
  estado: string;
  municipio: string;
  cp?: string | null;
  score?: number;
  distancekm?: number; // si tu API lo regresa en snake/camel ajusta abajo
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

  const subtitle = useMemo(() => {
    if (!userLocation) return "Cerca de ti";
    return `Cerca de ti (${userLocation.latitude.toFixed(3)}, ${userLocation.longitude.toFixed(3)})`;
  }, [userLocation]);

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
      const url = `${BASE_URL}/recs/nearby?lat=${userLocation.latitude}&lng=${userLocation.longitude}${
        userId ? `&userId=${userId}` : ""
      }&k=30`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Normaliza campos que puedan venir en snake_case
      const mapped: Reco[] = data.map((r: any) => ({
        id: Number(r.id),
        nombre: r.nombre,
        img: r.img ?? r.image ?? null,
        latitude: Number(r.latitude ?? r.lat),
        longitude: Number(r.longitude ?? r.lng),
        estado: r.estado,
        municipio: r.municipio,
        cp: r.cp ?? null,
        score: Number(r.score ?? r.reco_score ?? 0),
        distancekm: Number(r.distanceKm ?? r.distance_km ?? r.distance ?? 0),
      }));
      setItems(mapped);
    } catch (e: any) {
      console.log("Recs error:", e?.message ?? e);
      Alert.alert("Recomendaciones", "No se pudieron cargar las recomendaciones.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userLocation, userId]);

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

  // Cargar recomendaciones cuando haya ubicación
  useEffect(() => {
    if (userLocation) fetchRecs();
  }, [userLocation, fetchRecs]);

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
          </View>

          <View style={s.actions}>
            <Link href={`/sitios/${item.id}`} asChild>
              <TouchableOpacity style={[s.btn, s.btnPrimary]}>
                <Text style={s.btnTextPrimary}>Más información</Text>
              </TouchableOpacity>
            </Link>
            <TouchableOpacity style={[s.btn, s.btnMap]} onPress={() => openMaps(item.latitude, item.longitude)}>
              <MaterialCommunityIcons name="navigation" size={16} color="#fff" />
              <Text style={s.btnTextWhite}>Ir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.h1}>Recomendados</Text>
        <Text style={s.h2}>{subtitle}</Text>
      </View>

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
          contentContainerStyle={{ padding: 12, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={s.empty}>No hay recomendaciones por ahora.</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 16, paddingBottom: 6 },
  h1: { fontSize: 22, fontWeight: "700", color: "#0d0575ff" },
  h2: { fontSize: 14, color: "#666", marginTop: 2 },

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
