import { createOpinion, getOpinionesBySitio, getSitioById, Sitio } from "@/src/lib/api";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Opinion = {
  id: number;
  usuario: { nombre: string };
  comentario: string;
  puntuacion: number;
};

export default function SitioScreen() {
  // 👇 Hook solo arriba (render directo, no dentro de useEffect)
  const { id } = useLocalSearchParams<{ id: string }>();
  const sitioId = Number(id); // lo fijamos en una variable

  const [sitio, setSitio] = useState<Sitio | null>(null);
  const [opiniones, setOpiniones] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");
  const [puntuacion, setPuntuacion] = useState(5);
  const [enviando, setEnviando] = useState(false);

  const token = "TOKEN_DE_PRUEBA";

  // 🔹 Cargar sitio y opiniones
  useEffect(() => {
    if (!sitioId) return;

    (async () => {
      try {
        const dataSitio = await getSitioById(sitioId);
        setSitio(dataSitio);

        const dataOpiniones = await getOpinionesBySitio(sitioId);
        setOpiniones(dataOpiniones);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [sitioId]);

  const handleEnviarOpinion = async () => {
    try {
      setEnviando(true);
      const nueva = await createOpinion(token, sitioId, comentario, puntuacion);
      setOpiniones((prev) => [nueva, ...prev]);
      setComentario("");
      setPuntuacion(5);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (!sitio) return <Text>No se encontró el sitio</Text>;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={{ uri: sitio.img }} style={styles.image} />

        <Text style={styles.title}>{sitio.nombre}</Text>
        <Text style={styles.subtitle}>
          {sitio.municipio}, {sitio.estado}
        </Text>
        <Text style={styles.info}>Tel: {sitio.telefono}</Text>
        <Text style={styles.info}>
          {sitio.calle}, {sitio.fraccionamiento}, CP {sitio.cp}
        </Text>

        {/* 🔹 Botón hacia Reserva, solo si la categoría es reservable */}
        {sitio.categoria?.reservable && (
          <Link
            href={{
              pathname: "/categorias/reserva",
              params: { sitioId: sitio.id },
            }}
            asChild
          >
            <Pressable style={styles.button}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Ir a Reserva</Text>
            </Pressable>
          </Link>
        )}

        <Text style={styles.sectionTitle}>Valoraciones</Text>

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

        <Text style={styles.sectionTitle}>Deja tu opinión</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu comentario..."
          value={comentario}
          onChangeText={setComentario}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Puntuación (1-5)"
          value={String(puntuacion)}
          onChangeText={(val) => setPuntuacion(Number(val))}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleEnviarOpinion}
          disabled={enviando}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            {enviando ? "Enviando..." : "ENVIAR"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  image: { width: "100%", height: 200, borderRadius: 8, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold" },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 8 },
  info: { fontSize: 14, marginTop: 2 },
  sectionTitle: { marginTop: 20, fontSize: 18, fontWeight: "bold" },
  reviewCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  reviewUser: { fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
