import { useLocalSearchParams } from "expo-router";
import { FlatList, Image, ScrollView, StyleSheet, Text, View } from "react-native";

export default function SitioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Datos simulados del sitio
  const sitio = {
    id,
    nombre: "Parque Guadiana",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Parque_Guadiana.jpg/320px-Parque_Guadiana.jpg",
    telefono: "618-123-4567",
    estado: "Durango",
    municipio: "Durango",
    cp: "34000",
    fraccionamiento: "Centro",
    calle: "Av. 20 de Noviembre",
  };

  // Valoraciones simuladas
  const valoraciones = [
    { id: 1, usuario: "Ana", comentario: "Muy bonito lugar", puntuacion: 5 },
    { id: 2, usuario: "Luis", comentario: "Algo descuidado pero vale la pena", puntuacion: 3 },
    { id: 3, usuario: "Marta", comentario: "Perfecto para pasear en familia", puntuacion: 4 },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Imagen principal */}
      <Image source={{ uri: sitio.img }} style={styles.image} />

      {/* Datos generales */}
      <Text style={styles.title}>{sitio.nombre}</Text>
      <Text style={styles.subtitle}>{sitio.municipio}, {sitio.estado}</Text>
      <Text style={styles.info}>Tel: {sitio.telefono}</Text>
      <Text style={styles.info}>{sitio.calle}, {sitio.fraccionamiento}, CP {sitio.cp}</Text>

      {/* Sección de valoraciones */}
      <Text style={styles.sectionTitle}>Valoraciones</Text>
      <FlatList
        data={valoraciones}
        keyExtractor={(v) => v.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewUser}>
              {item.usuario} ({item.puntuacion}⭐)
            </Text>
            <Text>{item.comentario}</Text>
          </View>
        )}
        scrollEnabled={false} // para que ScrollView maneje el scroll completo
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  image: { width: "100%", height: 200, borderRadius: 8, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold" },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 8 },
  info: { fontSize: 14, marginTop: 2 },
  sectionTitle: { marginTop: 20, fontSize: 18, fontWeight: "bold" },
  reviewCard: { marginTop: 12, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 8 },
  reviewUser: { fontWeight: "bold" },
});
