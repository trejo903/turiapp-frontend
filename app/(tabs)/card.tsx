// app/(tabs)/card.tsx
import { Link } from "expo-router";
import { useState } from "react";
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from "react-native";

// Necesario para animaciones en Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const options = [
  { label: "Mi Perfil", path: "/perfil" },
  { label: "Mis Compras", path: "/mis-compras" },
  { label: "Configuración", path: "/configuracion" },
];

export default function Card() {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      {/* Cabecera de la tarjeta */}
      <Pressable onPress={toggleExpand} style={styles.card}>
        <Text style={styles.title}>Más opciones</Text>
        <Text style={styles.arrow}>{expanded ? "▲" : "▼"}</Text>
      </Pressable>

      {/* Opciones desplegables */}
      {expanded && (
        <View style={styles.optionsContainer}>
          {options.map((opt) => (
            <Link key={opt.path} href={opt.path} asChild>
              <Pressable android_ripple={{ color: "#ccc" }} style={styles.option}>
                <Text style={styles.optionText}>{opt.label}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 313,
    marginTop: 12,
  },
  card: {
    height: 88,
    backgroundColor: "#D9D9D9",
    borderRadius: 5,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  arrow: {
    fontSize: 18,
  },
  optionsContainer: {
    marginTop: 8,
    backgroundColor: "#EFEFEF",
    borderRadius: 5,
    overflow: "hidden",
  },
  option: {
    padding: 12,
  },
  optionText: {
    fontSize: 16,
  },
});
