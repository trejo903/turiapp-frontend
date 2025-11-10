// app/(tabs)/index.tsx
import { getCategorias, getRegiones } from "@/src/lib/api";
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
  Modal,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

type Categoria = {
  id: number | string;
  nombre: string;
  img?: string | null;
  color?: string | null;
};

// Si tu endpoint devuelve [{ estado, municipios: [...] }]
type RegionApi = {
  estado: string;
  municipios: string[];
};

// Región “plana” para manejar más fácil
type Region = {
  estado: string;
  municipio: string;
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

  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [regionModalVisible, setRegionModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Cargamos categorías y regiones al mismo tiempo
        const [cats, regionesApi] = await Promise.all([
          getCategorias(),
          getRegiones(), // 👈 nuevo helper
        ]);

        setData(cats);

        // “Aplanar” [{estado, municipios:[]}] -> Region[]
        const flat: Region[] = [];
        (regionesApi as RegionApi[]).forEach((r) => {
          r.municipios.forEach((mun) =>
            flat.push({ estado: r.estado, municipio: mun })
          );
        });
        setRegions(flat);

        // Región por defecto: Durango / Victoria de Durango
        const defaultRegion =
          flat.find(
            (r) =>
              r.estado.toLowerCase().includes("durango") &&
              r.municipio.toLowerCase().includes("victoria")
          ) ||
          flat.find((r) => r.estado.toLowerCase().includes("durango")) ||
          flat[0] ||
          null;

        setSelectedRegion(defaultRegion);
      } catch (e: any) {
        console.log(e);
        setError(e?.message ?? "Error al cargar las categorías");
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
    router.push("/(tabs)/home/sitios/chat");
  };

  const openRegionModal = () => setRegionModalVisible(true);
  const closeRegionModal = () => setRegionModalVisible(false);

  const handleSelectRegion = (reg: Region) => {
    setSelectedRegion(reg);
    closeRegionModal();
  };

  return (
    <View style={{ flex: 1, paddingTop: 20 }}>
      <Stack.Screen options={{ title: "TuriApp" }} />

      {/* Filtro de estado / municipio */}
      <View style={styles.header}>
        <Text style={styles.subtitle}>Lugares por conocer</Text>

        <TouchableOpacity
          style={styles.regionFilter}
          activeOpacity={0.8}
          onPress={openRegionModal}
        >
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={20}
            color="#0d0575ff"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.regionLabel}>Buscando en</Text>
            <Text style={styles.regionValue}>
              {selectedRegion
                ? `${selectedRegion.municipio}, ${selectedRegion.estado}`
                : "Todas las regiones"}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-down"
            size={22}
            color="#0d0575ff"
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        renderItem={({ item }) => {
          const bg = (item.color ?? "#f5f5f5").trim();
          const fg = getContrastText(bg);

          return (
            <Link
              href={{
                pathname: "/(tabs)/home/mapa/mapa",
                params: {
                  catId: String(item.id),
                  nombre: item.nombre,
                  // 👇 enviamos también la región seleccionada
                  estado: selectedRegion?.estado,
                  municipio: selectedRegion?.municipio,
                },
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
                  <Text
                    style={[styles.cardCta, { color: fg, opacity: 0.9 }]}
                  >
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
        <MaterialCommunityIcons
          name="message-text-outline"
          size={24}
          color="#fff"
        />
      </TouchableOpacity>

      {/* Modal de selección de región */}
      <Modal
        visible={regionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeRegionModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Elegir ubicación</Text>
              <TouchableOpacity onPress={closeRegionModal}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color="#333"
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {regions.map((reg, idx) => {
                const isSelected =
                  selectedRegion &&
                  selectedRegion.estado === reg.estado &&
                  selectedRegion.municipio === reg.municipio;

                return (
                  <TouchableOpacity
                    key={`${reg.estado}-${reg.municipio}-${idx}`}
                    style={[
                      styles.regionItem,
                      isSelected && styles.regionItemSelected,
                    ]}
                    onPress={() => handleSelectRegion(reg)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.regionItemMunicipio}>
                        {reg.municipio}
                      </Text>
                      <Text style={styles.regionItemEstado}>
                        {reg.estado}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color="#0d0575ff"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    textAlign: "left",
    marginBottom: 8,
    fontWeight: "700",
  },

  regionFilter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f5f5ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0ff",
  },
  regionLabel: {
    fontSize: 11,
    color: "#777",
  },
  regionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0d0575ff",
  },

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

  // Modal regiones
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  regionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  regionItemSelected: {
    backgroundColor: "#f1f5ff",
  },
  regionItemMunicipio: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  regionItemEstado: {
    fontSize: 13,
    color: "#666",
  },
});
