import { createOpinion, getOpinionesBySitio } from "@/src/lib/api";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const [opiniones, setOpiniones] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");
  const [puntuacion, setPuntuacion] = useState(5);
  const [enviando, setEnviando] = useState(false);

  //Token simulado (luego se reemplaza por el del login real)
  const token = "TOKEN_DE_PRUEBA";

  // Datos del sitio (simulado)
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

  // Cargar opiniones
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

  // Enviar nueva opinión
  const handleEnviarOpinion = async () => {
    try {
      setEnviando(true);
      const nueva = await createOpinion(token, Number(id), comentario, puntuacion);
      setOpiniones((prev) => [nueva, ...prev]); // agrega la nueva opinión arriba
      setComentario("");
      setPuntuacion(5);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"} // iOS sube, Android ajusta altura
      keyboardVerticalOffset={80} // ajusta según tu header
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

        {/* Formulario para nueva opinión */}
        <Text style={styles.sectionTitle}>Deja tu opinión</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu comentario..."
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Puntuación (1-5)"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.button}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>ENVIAR</Text>
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
  form: { marginTop: 20 },
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
