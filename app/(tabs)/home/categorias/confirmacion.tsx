import { StyleSheet, Text, View } from "react-native";

export default function ConfirmacionReservaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.checkmark}>✅</Text>
      <Text style={styles.title}>Reserva Confirmada</Text>

      <View style={styles.card}>
        <Text style={styles.detail}>Lugar: Restaurante X</Text>
        <Text style={styles.detail}>Fecha: 15 Oct 2025</Text>
        <Text style={styles.detail}>Hora: 12:00</Text>
        <Text style={styles.detail}>Personas: 2</Text>
      </View>

      <View style={styles.qrPlaceholder}>
        <Text>QR CODE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  checkmark: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: "bold", marginVertical: 20 },
  card: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 20, width: "80%" },
  detail: { fontSize: 16, marginVertical: 3 },
  qrPlaceholder: { marginVertical: 20, borderWidth: 1, borderColor: "#ccc", padding: 40 },
  button: { backgroundColor: "#211C1C", padding: 15, borderRadius: 8, width: "80%" },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
