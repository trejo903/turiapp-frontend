// src/components/FilterModal.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type CategoryFilter = "all" | "ocio" | "gastro" | "relax" | "fre";
export type SortFilter = "distance" | "popular" | "rating";

type Props = {
  visible: boolean;
  onClose: () => void;

  // filtro de categoría
  selectedFilter: CategoryFilter;
  onFilterChange: (f: CategoryFilter) => void;

  // filtro de orden
  selectedSort: SortFilter;
  onSortChange: (s: SortFilter) => void;
};

const CATEGORY_OPTIONS: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: "all", label: "Todas", icon: "select-all" },
  { id: "ocio", label: "Ocio & Aventura", icon: "run" },
  { id: "gastro", label: "Gastro & Cultura", icon: "silverware-fork-knife" },
  { id: "relax", label: "Relax & Salud Hotel", icon: "spa" },
];

const SORT_OPTIONS: { id: SortFilter; label: string; icon: string }[] = [
  { id: "distance", label: "Más cercano", icon: "map-marker-distance" },
  { id: "popular", label: "Más popular", icon: "fire" },
  { id: "rating", label: "Más comentado", icon: "star-outline" },
];

export default function FilterModal({
  visible,
  onClose,
  selectedFilter,
  onFilterChange,
  selectedSort,
  onSortChange,
}: Props) {
  const handleSelectCategory = (id: CategoryFilter) => {
    onFilterChange(id);
  };

  const handleSelectSort = (id: SortFilter) => {
    onSortChange(id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>Filtros</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color="#111" />
            </TouchableOpacity>
          </View>

          {/* --- Categorías --- */}
          <Text style={s.subtitle}>Filtrar por categoría</Text>
          {CATEGORY_OPTIONS.map((opt) => {
            const active = selectedFilter === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[s.row, active && s.rowActive]}
                onPress={() => handleSelectCategory(opt.id)}
              >
                <View style={s.rowLeft}>
                  <MaterialCommunityIcons
                    name={opt.icon as any}
                    size={20}
                    color={active ? "#0d0575ff" : "#555"}
                  />
                  <Text style={[s.rowText, active && s.rowTextActive]}>
                    {opt.label}
                  </Text>
                </View>
                {active && (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color="#0d0575ff"
                  />
                )}
              </TouchableOpacity>
            );
          })}

          {/* --- Orden --- */}
          <Text style={[s.subtitle, { marginTop: 16 }]}>Ordenar por</Text>
          {SORT_OPTIONS.map((opt) => {
            const active = selectedSort === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[s.row, active && s.rowActive]}
                onPress={() => handleSelectSort(opt.id)}
              >
                <View style={s.rowLeft}>
                  <MaterialCommunityIcons
                    name={opt.icon as any}
                    size={20}
                    color={active ? "#0d0575ff" : "#555"}
                  />
                  <Text style={[s.rowText, active && s.rowTextActive]}>
                    {opt.label}
                  </Text>
                </View>
                {active && (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color="#0d0575ff"
                  />
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={s.applyBtn} onPress={onClose}>
            <Text style={s.applyText}>Aplicar filtros</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0d0575ff" },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 4,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  rowActive: {
    backgroundColor: "#f4f3ff",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowText: { fontSize: 15, color: "#333" },
  rowTextActive: { color: "#0d0575ff", fontWeight: "600" },
  applyBtn: {
    marginTop: 10,
    backgroundColor: "#0d0575ff",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  applyText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
