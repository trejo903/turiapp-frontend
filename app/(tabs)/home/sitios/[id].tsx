import Loader from "@/src/components/common/Loader";
import { createOpinionNoAuth, getOpinionesBySitio, getSitioById, OpinionApi, Sitio } from "@/src/lib/api";
import { useAuth } from "@/src/state/auth";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function SitioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sitioId = Number(id);
  const { user, token } = useAuth();
  const userId = user?.id!;
  const isLoggedIn = !!token;
  const insets = useSafeAreaInsets();

  const [sitio, setSitio] = useState<Sitio | null>(null);
  const [opiniones, setOpiniones] = useState<OpinionApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState("");
  const [puntuacion, setPuntuacion] = useState<number>(5);
  const [enviando, setEnviando] = useState(false);

  // 🧭 Cargar datos
  useEffect(() => {
    if (!Number.isFinite(sitioId)) return;
    (async () => {
      try {
        const [s, ops] = await Promise.all([
          getSitioById(sitioId),
          getOpinionesBySitio(sitioId)
        ]);
        setSitio(s);
        setOpiniones(ops);
      } catch (err: any) {
        Alert.alert("Error", err?.message ?? "No se pudo cargar la información");
      } finally {
        setLoading(false);
      }
    })();
  }, [sitioId]);

  const avg = useMemo(() => {
    if (!opiniones.length) return null;
    const sum = opiniones.reduce((a, b) => a + (b.puntuacion ?? 0), 0);
    return (sum / opiniones.length).toFixed(1);
  }, [opiniones]);

  // 📨 Enviar opinión
  const handleEnviarOpinion = async () => {
    if (!isLoggedIn) {
      Alert.alert("Inicia sesión", "Debes iniciar sesión para opinar.");
      return;
    }
    const txt = comentario.trim();
    if (!txt) {
      Alert.alert("Comentario requerido", "Escribe tu comentario.");
      return;
    }
    if (puntuacion < 1 || puntuacion > 5) {
      Alert.alert("Puntuación inválida", "Debe ser entre 1 y 5 estrellas.");
      return;
    }
    try {
      setEnviando(true);
      const nueva = await createOpinionNoAuth(sitioId, txt, puntuacion, userId);
      setOpiniones((prev) => [nueva, ...prev]);
      setComentario("");
      setPuntuacion(5);
      Alert.alert(
        "Gracias por compartir tu experiencia",
        "Tu opinión será visible públicamente de forma anónima."
      );
    } catch (err: any) {
      Alert.alert("No se pudo enviar", err?.message ?? "Intenta de nuevo");
    } finally {
      setEnviando(false);
    }
  };

  // 🔄 Loader y error
  if (loading) return <Loader message="Cargando información del sitio..." />;
  if (!sitio) return <Text style={{ padding: 16 }}>No se encontró el sitio</Text>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {/* Imagen */}
          <Image source={{ uri: sitio.img }} style={styles.image} />

          <Text style={styles.title}>{sitio.nombre}</Text>
          <Text style={styles.subtitle}>
            {sitio.municipio}, {sitio.estado}
          </Text>
          <Text style={styles.info}>Tel: {sitio.telefono}</Text>
          <Text style={styles.info}>
            {sitio.calle}, {sitio.fraccionamiento}, CP {sitio.cp}
          </Text>

          {typeof avg === "string" && (
            <Text style={{ marginTop: 8, fontWeight: "600" }}>
              Promedio: {avg} ⭐ ({opiniones.length})
            </Text>
          )}

          <Text style={styles.sectionTitle}>Valoraciones</Text>

          <FlatList
            data={opiniones}
            keyExtractor={(v) => String(v.id)}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewUser}>
                  {(item.usuario?.nombre ?? "Anónimo")} ({item.puntuacion}⭐)
                </Text>
                <Text>{item.comentario}</Text>
              </View>
            )}
            ListEmptyComponent={<Text>No hay opiniones. ¡Sé el primero!</Text>}
            scrollEnabled={false}
          />

          <Text style={styles.sectionTitle}>Deja tu opinión</Text>
          {!isLoggedIn && (
            <Text style={{ color: "#f43f5e", marginBottom: 6 }}>
              Debes{" "}
              <Text
                style={{
                  color: "#2563eb",
                  textDecorationLine: "underline",
                }}
                onPress={() =>
                  router.push({
                    pathname: "/usuario/login",
                    params: { redirectTo: `/sitios/${id}` },
                  })
                }
              >
                iniciar sesión
              </Text>{" "}
              para publicar una opinión.
            </Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Escribe tu comentario..."
            placeholderTextColor="#777"
            value={comentario}
            onChangeText={setComentario}
            multiline
            editable={isLoggedIn}
          />

          <TextInput
            style={styles.input}
            placeholder="Puntuación (1-5)"
            placeholderTextColor="#777"
            value={puntuacion ? String(puntuacion) : ""}
            onChangeText={(val) => {
              const num = Number(val);
              if (!isNaN(num) && num >= 1 && num <= 5) {
                setPuntuacion(num);
              } else if (val === "") setPuntuacion(0);
            }}
            keyboardType="numeric"
            maxLength={1}
          />

          <TouchableOpacity
            style={[
              styles.button,
              (!isLoggedIn || enviando) && { opacity: 0.6 },
            ]}
            onPress={handleEnviarOpinion}
            disabled={!isLoggedIn || enviando}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              {enviando ? "Enviando..." : "ENVIAR"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});
