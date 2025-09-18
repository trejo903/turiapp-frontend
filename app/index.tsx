import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Hola mundo</Text>
      <Link href={'/mapa/mapa'}>Ir a mapa</Link>
    </View>
  );
}
