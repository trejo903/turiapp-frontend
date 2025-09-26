import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ReservaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reserva</Text>

      <Text style={styles.label}>Fecha</Text>
      <TextInput style={styles.input} placeholder="Selecciona la fecha" />

      <Text style={styles.label}>Hora</Text>
      <TextInput style={styles.input} placeholder="Selecciona la hora" />

      <Text style={styles.label}>Personas</Text>
      <TextInput style={styles.input} placeholder="2" keyboardType="numeric" />

      <Text style={styles.label}>Método de Pago</Text>
      <View style={styles.paymentOptions}>
        <TouchableOpacity style={styles.radio}><Text>Tarjeta</Text></TouchableOpacity>
        <TouchableOpacity style={styles.radio}><Text>PayPal</Text></TouchableOpacity>
        <TouchableOpacity style={styles.radio}><Text>OxxoPay</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>CONFIRMAR RESERVA</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 16, marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginTop: 5 },
  paymentOptions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  radio: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 },
  button: { backgroundColor: "#211C1C", padding: 15, borderRadius: 8, marginTop: 20 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
