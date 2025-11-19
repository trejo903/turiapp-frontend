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

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedFilter: CategoryFilter;
  onFilterChange: (f: CategoryFilter) => void;
};

const OPTIONS: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: "all", label: "Todas", icon: "select-all" },
  { id: "ocio", label: "Ocio & Aventura", icon: "run" },
  { id: "gastro", label: "Gastro & Cultura", icon: "silverware-fork-knife" },
  { id: "relax", label: "Relax & Salud Hotel", icon: "spa" },
];

export default function FilterModal({
  visible,
  onClose,
  selectedFilter,
  onFilterChange,
}: Props) {
  const handleSelect = (id: CategoryFilter) => {
    onFilterChange(id);
    onClose();
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
            <Text style={s.title}>Filtrar por</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color="#111"
              />
            </TouchableOpacity>
          </View>

          {OPTIONS.map((opt) => {
            const active = selectedFilter === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[s.row, active && s.rowActive]}
                onPress={() => handleSelect(opt.id)}
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

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
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
});
