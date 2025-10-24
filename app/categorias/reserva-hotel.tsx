// app/categorias/reserva-hotel.tsx
import AuthRequiredModal from "@/src/components/AuthRequiredModal";
import { BASE_URL } from "@/src/lib/api";
import { notificarConfirmacion, programarRecordatorio } from "@/src/lib/notificaciones";
import { useAuth } from "@/src/state/auth";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ReservaHotelScreen() {
  const { sitioId } = useLocalSearchParams<{ sitioId: string }>();

  // Fechas
  const [fechaEntrada, setFechaEntrada] = useState(new Date());
  const [fechaSalida, setFechaSalida] = useState(new Date(Date.now() + 86400000));
  const [showEntradaPicker, setShowEntradaPicker] = useState(false);
  const [showSalidaPicker, setShowSalidaPicker] = useState(false);

  // Huéspedes
  const [adultos, setAdultos] = useState("");
  const [menores, setMenores] = useState("");
  // Precio
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

  //harcodeo del chido calcular noches
  const calcularNoches = () => {
    const diff = fechaSalida.getTime() - fechaEntrada.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  //  harcodeo  calcular precio total
  useEffect(() => {
    const noches = calcularNoches();
    const baseHotelPorNoche = 350; //  por adulto
    const precioMenor = baseHotelPorNoche * 0.6; // 40% descuento para menores
    const transporteExtra = 50; //  Incluido por defecto

    const total =
      (Number(adultos) * baseHotelPorNoche + Number(menores || 0) * precioMenor) *
        noches +
      transporteExtra;

    setPrecioTotal(total);
  }, [adultos, menores, fechaEntrada, fechaSalida]);

  //  Enviar reserva
  const handleReserva = async () => {
    if (!isLoggedIn) {
      setShowModal(true);
      return;
    }

    if (!nombre.trim() || !telefono.trim() || !adultos) {
      Alert.alert("Error", "Completa los campos obligatorios");
      return;
    }

    if (fechaEntrada >= fechaSalida) {
      Alert.alert("Error", "La fecha de salida debe ser posterior a la de entrada");
      return;
    }

    const reservaData: any = {
      tipo: "hotel",
      usuario_id: Number(userId),
      sitio_id: Number(sitioId),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      transporte: true, // siempre incluido
      fecha_entrada: fechaEntrada,
      fecha_salida: fechaSalida,
      adultos: Number(adultos),
      menores: menores ? Number(menores) : 0,
      precio_total: precioTotal, //  harcodeo del nuevo campo
    };

    if (email.trim().length > 0) {
      reservaData.email = email.trim();
    }

    console.log(" Datos enviados al backend:", reservaData);

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

      await notificarConfirmacion(
        result.sitioNombre ?? "tu reserva",
        new Date(reservaData.fecha_entrada)
      );
      await programarRecordatorio(
        result.sitioNombre ?? "tu reserva",
        new Date(reservaData.fecha_entrada)
      );

      Alert.alert(
        "Reserva confirmada",
        "Tu reserva se ha guardado correctamente. Cancelaciones disponibles hasta 48h antes del día."
      );
      router.back();
    } catch (error) {
      console.log("❌ Error completo:", error);
      Alert.alert("Error", "No se pudo realizar la reserva");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Reservar Hotel</Text>

        {/*  Datos personales */}
        <Text style={styles.sectionTitle}>Información Personal</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre completo *"
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          style={styles.input}
          placeholder="Teléfono *"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Email (opcional)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        {/*  Fechas */}
        <Text style={styles.sectionTitle}>Fechas de Estadía</Text>
        <Text style={styles.nochesText}>
          {calcularNoches()} {calcularNoches() === 1 ? "noche" : "noches"}
        </Text>

        <TouchableOpacity style={styles.input} onPress={() => setShowEntradaPicker(true)}>
          <Text>Check-in: {fechaEntrada.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.input} onPress={() => setShowSalidaPicker(true)}>
          <Text>Check-out: {fechaSalida.toLocaleDateString()}</Text>
        </TouchableOpacity>

        {(showEntradaPicker || showSalidaPicker) && (
          <DateTimePicker
            value={showEntradaPicker ? fechaEntrada : fechaSalida}
            mode="date"
            display="default"
            minimumDate={showEntradaPicker ? new Date() : fechaEntrada}
            onChange={(event, selectedDate) => {
              setShowEntradaPicker(false);
              setShowSalidaPicker(false);
              if (selectedDate) {
                if (showEntradaPicker) {
                  setFechaEntrada(selectedDate);
                  if (selectedDate >= fechaSalida) {
                    setFechaSalida(new Date(selectedDate.getTime() + 86400000));
                  }
                } else {
                  setFechaSalida(selectedDate);
                }
              }
            }}
          />
        )}

        {/*  Huéspedes */}
        <Text style={styles.sectionTitle}>Huéspedes</Text>
        <TextInput
          style={styles.input}
          placeholder="Adultos *"
          value={adultos}
          onChangeText={setAdultos}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Menores"
          value={menores}
          onChangeText={setMenores}
          keyboardType="numeric"
        />

        {/*  Precio total */}
        <View style={styles.precioContainer}>
          <Text style={styles.precioTitulo}>Resumen de pago</Text>
          <Text style={styles.precioDetalle}>
            ${precioTotal.toFixed(2)} MXN total
          </Text>
          <Text style={styles.precioExtra}>Incluye transporte </Text>
        </View>

        {/*  Botón final */}
        <TouchableOpacity style={styles.button} onPress={handleReserva}>
          <Text style={styles.buttonText}>Confirmar Reserva</Text>
        </TouchableOpacity>
      </ScrollView>

      <AuthRequiredModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        sitioId={`/categorias/reserva?sitioId=${sitioId}`}
        context="hotel"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  nochesText: { fontSize: 16, color: "#007AFF", fontWeight: "500", marginBottom: 12 },
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
