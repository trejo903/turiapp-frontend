// app/(tabs)/home/sitios/servicio.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ServicioTaxi() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Servicio de taxi" }} />

      <View style={styles.card}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons
            name="taxi"
            size={40}
            color="#0d0575ff"
          />
        </View>

        <Text style={styles.title}>Servicio de taxi próximo a llegar</Text>

        <Text style={styles.subtitle}>
          Tu taxi está en camino. Prepárate, llegará en unos minutos.
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Tiempo estimado</Text>
            <Text style={styles.infoValue}>5–8 min</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Conductor</Text>
            <Text style={styles.infoValue}>Por asignar</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} activeOpacity={0.9}>
          <Text style={styles.buttonText}>Ver detalles del viaje</Text>
        </TouchableOpacity>
      </View>

      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
    padding: 16,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e3e7ff",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  infoBox: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#f7f7ff",
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: "#777",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  button: {
    marginTop: 4,
    backgroundColor: "#0d0575ff",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  backLink: {
    position: "absolute",
    top: 40,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    color: "#0d0575ff",
    fontSize: 14,
    fontWeight: "500",
  },
});
