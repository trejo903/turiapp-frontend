import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function CalculadoraRecorridosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calculadora de Recorridos</Text>

      <View style={styles.mapPlaceholder}>
        <Text>MAPA AQUÍ</Text>
      </View>

      <TextInput style={styles.input} placeholder="Origen" />
      <TextInput style={styles.input} placeholder="Destino" />
      <TextInput style={styles.input} placeholder="Personas" keyboardType="numeric" />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>CALCULAR TARIFA</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  mapPlaceholder: { borderWidth: 1, borderColor: "#ccc", padding: 40, alignItems: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 },
  button: { backgroundColor: "#211C1C", padding: 15, borderRadius: 8, marginTop: 10 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
