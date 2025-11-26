// app/categorias/reserva.tsx
import AuthRequiredModal from "@/src/components/AuthRequiredModal";
import Loader from "@/src/components/common/loader";
import { BASE_URL, getSitioById } from "@/src/lib/api";
import { notificarConfirmacion, programarRecordatorio } from "@/src/lib/notificaciones";
import { useAuth } from "@/src/state/auth";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function ReservaScreen() {
  const { sitioId } = useLocalSearchParams<{ sitioId: string }>();
  const insets = useSafeAreaInsets();

  const [sitio, setSitio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Personas
  const [personas, setPersonas] = useState("");
  const [menores, setMenores] = useState("");

  // Precio total
  const [precioTotal, setPrecioTotal] = useState(0);

  // Datos personales
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  const auth = useAuth();
  const token = auth.token ?? "";
  const isLoggedIn = !!token;
  const userId = auth.user?.id ?? null;

  const [showModal, setShowModal] = useState(false);

  // 🟢 Cargar info del sitio
  useEffect(() => {
    if (!sitioId) return;
    (async () => {
      try {
        const s = await getSitioById(Number(sitioId));
        setSitio(s);
      } catch (err) {
        console.log("❌ Error al cargar sitio:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [sitioId]);

  // 🧮 Calcular precio total
  useEffect(() => {
    const baseRestaurante = 180; // Precio por persona
    const transporteExtra = 50; // fijo
    const total =
      (Number(personas) * baseRestaurante +
        (Number(menores) || 0) * baseRestaurante * 0.6) +
      transporteExtra;
    setPrecioTotal(total);
  }, [personas, menores]);

  // 🟠 Manejar reserva
  const handleReserva = async () => {
    if (!isLoggedIn) {
      setShowModal(true);
      return;
    }

    if (!nombre.trim() || !telefono.trim() || !personas) {
      Alert.alert("Error", "Completa los campos obligatorios");
      return;
    }

    const reservaData: any = {
      tipo: "restaurante", 
      sitio_id: Number(sitioId),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      transporte: true,
      fecha,
      personas: Number(personas),
      menores: menores ? Number(menores) : 0,
      precio_total: precioTotal,
    };

    console.log("📦 Datos enviados al backend:", reservaData);

    try {
      const response = await fetch(`${BASE_URL}/reservas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reservaData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("❌ Error del servidor:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Reserva guardada correctamente:", result);

      await notificarConfirmacion(result.sitioNombre ?? "tu reserva", new Date(fecha));
      await programarRecordatorio(result.sitioNombre ?? "tu reserva", new Date(fecha));

      Alert.alert(
        "Reserva confirmada",
        "Tu mesa se ha reservado correctamente. Cancelaciones disponibles hasta 48h antes del día."
      );
      router.back();
    } catch (error) {
      console.log("❌ Error completo:", error);
      Alert.alert("Error", "No se pudo realizar la reserva");
    }
  };

  // 🔄 Loader y errores
  if (loading) return <Loader message="Cargando información del sitio..." />;
  if (!sitio) return <Text style={{ padding: 16 }}>No se encontró el sitio</Text>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 32,
        }}
      >
        <Text style={styles.title}>Reservar Mesa</Text>

        {/* Información personal */}
        <Text style={styles.sectionTitle}>Información Personal</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre completo *"
          placeholderTextColor="#777"
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          style={styles.input}
          placeholder="Teléfono *"
          placeholderTextColor="#777"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Email (opcional)"
          placeholderTextColor="#777"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        {/* Fecha y hora */}
        <Text style={styles.sectionTitle}>Fecha y Hora</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>Fecha: {fecha.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text>
            Hora: {fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </TouchableOpacity>

        {(showDatePicker || showTimePicker) && (
          <DateTimePicker
            value={fecha}
            mode={showDatePicker ? "date" : "time"}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              setShowTimePicker(false);
              if (selectedDate) setFecha(selectedDate);
            }}
          />
        )}

        {/* Personas */}
        <Text style={styles.sectionTitle}>Número de Personas</Text>
        <TextInput
          style={styles.input}
          placeholder="Total de personas *"
          placeholderTextColor="#777"
          value={personas}
          onChangeText={setPersonas}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Menores de edad"
          placeholderTextColor="#777"
          value={menores}
          onChangeText={setMenores}
          keyboardType="numeric"
        />

        {/* Precio total */}
        <View style={styles.precioContainer}>
          <Text style={styles.precioTitulo}>Resumen de pago</Text>
          <Text style={styles.precioDetalle}>${precioTotal.toFixed(2)} MXN total</Text>
          <Text style={styles.precioExtra}>Incluye transporte</Text>
        </View>

        {/* Botón */}
        <TouchableOpacity style={styles.button} onPress={handleReserva}>
          <Text style={styles.buttonText}>Confirmar Reserva</Text>
        </TouchableOpacity>
      </ScrollView>

      <AuthRequiredModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        sitioId={`/categorias/reserva?sitioId=${sitioId}`}
        context="restaurante"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  precioContainer: {
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },
  precioTitulo: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  precioDetalle: { fontSize: 16, color: "#111", marginBottom: 4 },
  precioExtra: { fontSize: 14, color: "#555" },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
