import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function IdiomaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona Idioma</Text>

      <TouchableOpacity style={styles.option}><Text>Español 🇲🇽</Text></TouchableOpacity>
      <TouchableOpacity style={styles.option}><Text>English 🇬🇧</Text></TouchableOpacity>
      <TouchableOpacity style={styles.option}><Text>Français 🇫🇷</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 30 },
  option: { borderWidth: 1, borderColor: "#ccc", padding: 15, borderRadius: 8, marginVertical: 10, width: "80%", alignItems: "center" },
});
