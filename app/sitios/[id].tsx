import { getOpinionesBySitio } from "@/src/lib/api";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, View } from "react-native";

type Opinion = {
  id: number;
  usuario: { nombre: string }; // depende de lo que devuelva tu backend
  comentario: string;
  puntuacion: number;
};

export default function SitioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [opiniones, setOpiniones] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos del sitio (todavía simulados, pero puedes traerlos de la API igual)
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

  useEffect(() => {
    (async () => {
      try {
        const data = await getOpinionesBySitio(Number(id));
        setOpiniones(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: sitio.img }} style={styles.image} />

      <Text style={styles.title}>{sitio.nombre}</Text>
      <Text style={styles.subtitle}>{sitio.municipio}, {sitio.estado}</Text>
      <Text style={styles.info}>Tel: {sitio.telefono}</Text>
      <Text style={styles.info}>{sitio.calle}, {sitio.fraccionamiento}, CP {sitio.cp}</Text>

      <Text style={styles.sectionTitle}>Valoraciones</Text>

      {loading && <ActivityIndicator size="large" />}
      {error && <Text style={{ color: "red" }}>{error}</Text>}

      <FlatList
        data={opiniones}
        keyExtractor={(v) => v.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewUser}>
              {item.usuario?.nombre ?? "Anónimo"} ({item.puntuacion}⭐)
            </Text>
            <Text>{item.comentario}</Text>
          </View>
        )}
        scrollEnabled={false}
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
