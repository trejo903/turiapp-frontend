// app/categorias/[id].tsx
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function CategoriaScreen() {
  return (
    <View>
      <Text>Pantalla de categoría</Text>
      <Link href={`/(tabs)/home/categorias/reserva`} asChild>
        <Pressable style={styles.button}>
          <Text>Ir a Reserva</Text>
        </Pressable>
      </Link>

      <Link href={`/(tabs)/home/categorias/confirmacion`} asChild>
        <Pressable style={styles.button}>
          <Text>Ir a Confirmación</Text>
        </Pressable>
      </Link>

    </View>
  );
}
const styles = {
  button: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, marginTop: 20 },
  buttonText: { color: "#007AFF", textAlign: "center" },
};
