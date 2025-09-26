import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function RecomendacionesScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Recomendaciones para ti</Text>

      <View style={styles.card}>
        <View style={styles.imgPlaceholder} />
        <Text style={styles.name}>Top 1: Nombre Sitio</Text>
        <Text style={styles.desc}>Descripción breve...</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.imgPlaceholder} />
        <Text style={styles.name}>Top 2: Nombre Sitio</Text>
        <Text style={styles.desc}>Descripción breve...</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.imgPlaceholder} />
        <Text style={styles.name}>Top 3: Nombre Sitio</Text>
        <Text style={styles.desc}>Descripción breve...</Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Planifica tu viaje con IA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 15, marginBottom: 15 },
  imgPlaceholder: { backgroundColor: "#ddd", height: 100, borderRadius: 8, marginBottom: 10 },
  name: { fontSize: 18, fontWeight: "bold" },
  desc: { fontSize: 14, color: "#666" },
  button: { backgroundColor: "#211C1C", padding: 15, borderRadius: 8, marginTop: 20 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
