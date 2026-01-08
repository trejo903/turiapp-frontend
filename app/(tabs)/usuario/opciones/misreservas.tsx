// app/(tabs)/usuario/opciones/misreservas.tsx
// @ts-ignore — algunos tipos de react-native-calendars no están publicados
import { BASE_URL } from "@/src/lib/api";
import { normalizeReservasResponse, type Reserva } from "@/src/schemas/reservas";
import { useAuth } from "@/src/state/auth";
import * as Notifications from "expo-notifications";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

// 📲 Configuración de notificaciones locales
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function MisReservas() {
  const auth = useAuth();
  const user = auth.user;
  const token = (auth.token ?? "").trim();

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 🔍 Cargar reservas del backend (y validar con Zod)
  useEffect(() => {
    if (!user?.id || !token) return;

    const fetchReservas = async () => {
      try {
        const res = await fetch(`${BASE_URL}/reservas`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.log("❌ Error reservas:", res.status, text);

          if (res.status === 401) {
            Alert.alert("Sesión expirada", "Vuelve a iniciar sesión.");
          } else {
            Alert.alert("Error", "No se pudieron cargar tus reservas.");
          }
          return;
        }

        const raw = await res.json();
        const list = normalizeReservasResponse(raw); // ✅ Zod aquí
        setReservas(list);

        // 🗓️ Crear marcas para el calendario
        const marks: any = {};

        list.forEach((r) => {
          if (r.tipo === "hotel" && r.fecha_entrada && r.fecha_salida) {
            const start = new Date(r.fecha_entrada);
            const end = new Date(r.fecha_salida);
            const current = new Date(start);

            while (current <= end) {
              const dateKey = current.toISOString().split("T")[0];
              marks[dateKey] = {
                ...(marks[dateKey] || {}),
                marked: true,
                color: "#007AFF",
                textColor: "#fff",
              };
              current.setDate(current.getDate() + 1);
            }
          } else if (r.fecha) {
            const dateKey = r.fecha.split("T")[0];
            marks[dateKey] = {
              ...(marks[dateKey] || {}),
              marked: true,
              dotColor: "#FF9500",
            };
          }
        });

        setMarkedDates(marks);
      } catch (err) {
        console.error("❌ Error al obtener reservas:", err);
        Alert.alert("Error", "No se pudieron cargar tus reservas.");
      }
    };

    fetchReservas();
  }, [user?.id, token]);

  // 🔔 Programar recordatorio 2 horas antes
  const scheduleNotification = async (reserva: Reserva) => {
    const dateStr =
      reserva.tipo === "hotel"
        ? reserva.fecha_entrada ?? null
        : reserva.fecha ?? null;

    if (!dateStr) {
      Alert.alert("Sin fecha", "Esta reserva no tiene fecha para recordatorio.");
      return;
    }

    const fechaAlerta = new Date(dateStr);

    let triggerSeconds =
      (fechaAlerta.getTime() - Date.now() - 2 * 60 * 60 * 1000) / 1000;

    // expo-notifications suele requerir >= 1 segundo
    triggerSeconds = Math.max(1, Math.ceil(triggerSeconds));

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Recordatorio de reserva",
        body: `Tienes una reserva ${
          reserva.tipo === "hotel" ? "de hotel" : "de restaurante"
        } hoy a las ${fechaAlerta.toLocaleTimeString()}.`,
      },
      trigger: {
        seconds: triggerSeconds,
      } as Notifications.TimeIntervalTriggerInput,
    });

    Alert.alert("🔔 Notificación programada", "Se te recordará antes del evento");
  };

  // 📅 Seleccionar un día
  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  // ✅ Filtrar reservas del día seleccionado
  const reservasDelDia = useMemo(() => {
    if (!selectedDate) return [];

    return reservas.filter((r) => {
      if (r.tipo === "hotel" && r.fecha_entrada && r.fecha_salida) {
        const start = r.fecha_entrada.split("T")[0];
        const end = r.fecha_salida.split("T")[0];
        return selectedDate >= start && selectedDate <= end;
      }

      if (r.fecha) {
        return r.fecha.split("T")[0] === selectedDate;
      }

      return false;
    });
  }, [reservas, selectedDate]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mis Reservas</Text>

      <Calendar
        markedDates={{
          ...markedDates,
          ...(selectedDate ? { [selectedDate]: { selected: true } } : {}),
        }}
        onDayPress={handleDayPress}
        theme={{
          selectedDayBackgroundColor: "#007AFF",
          todayTextColor: "#FF9500",
          arrowColor: "#007AFF",
        }}
      />

      {selectedDate && reservasDelDia.length > 0 ? (
        reservasDelDia.map((reserva) => (
          <View key={reserva.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              {reserva.tipo === "hotel" ? "🏨 Hotel" : "🍽️ Restaurante"}
            </Text>

            <Text style={styles.cardText}>
              Fecha:{" "}
              {reserva.tipo === "hotel"
                ? `${new Date(reserva.fecha_entrada!).toLocaleDateString()} → ${new Date(
                    reserva.fecha_salida!
                  ).toLocaleDateString()}`
                : new Date(reserva.fecha!).toLocaleString()}
            </Text>

            <Text style={styles.cardText}>Nombre: {reserva.nombre ?? "-"}</Text>
            <Text style={styles.cardText}>
              Transporte: {reserva.transporte ? "Sí" : "No"}
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => scheduleNotification(reserva)}
            >
              <Text style={styles.buttonText}>Recordar esta reserva</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : selectedDate ? (
        <Text style={styles.noData}>No tienes reservas para este día</Text>
      ) : (
        <Text style={styles.noData}>Selecciona un día en el calendario</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
  cardText: { fontSize: 15, marginBottom: 4 },
  button: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  noData: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontStyle: "italic",
  },
});
