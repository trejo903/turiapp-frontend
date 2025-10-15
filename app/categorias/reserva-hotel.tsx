import { BASE_URL } from '@/src/lib/api';
import { notificarConfirmacion, programarRecordatorio } from "@/src/lib/notificaciones";
import { useAuth } from '@/src/state/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ReservaHotelScreen() {
  const { sitioId } = useLocalSearchParams<{ sitioId: string }>();

  const [fechaEntrada, setFechaEntrada] = useState(new Date());
  const [fechaSalida, setFechaSalida] = useState(new Date(Date.now() + 86400000));
  const [showEntradaPicker, setShowEntradaPicker] = useState(false);
  const [showSalidaPicker, setShowSalidaPicker] = useState(false);
  const [adultos, setAdultos] = useState('');
  const [menores, setMenores] = useState('');
  const [transporte, setTransporte] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [showModal, setShowModal] = useState(false);

  // animaciones
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const auth = useAuth();
  const token = auth.token ?? "";
  const isLoggedIn = !!token;
  const userId = auth.user?.id ?? null;

  useEffect(() => {
    if (showModal) {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [showModal]);

  const calcularNoches = () => {
    const diff = fechaSalida.getTime() - fechaEntrada.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleReserva = async () => {
    if (!isLoggedIn) {
      setShowModal(true);
      return;
    }

    console.log('🧾 Datos actuales del formulario:', {
      nombre,
      telefono,
      adultos,
      menores,
      fechaEntrada,
      fechaSalida,
      transporte,
      sitioId,
      usuarioId: userId,
    });

    if (!nombre.trim() || !telefono.trim() || !adultos) {
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }

    if (fechaEntrada >= fechaSalida) {
      Alert.alert('Error', 'La fecha de salida debe ser posterior a la de entrada');
      return;
    }

    const reservaData = {
      tipo: 'hotel',
      usuario_id: userId,
      sitio_id: Number(sitioId),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      transporte,
      fecha_entrada: fechaEntrada,
      fecha_salida: fechaSalida,
      adultos: Number(adultos),
      menores: menores ? Number(menores) : 0,
    };

    console.log('📤 Datos enviados al backend:', reservaData);

    try {
      const response = await fetch(`${BASE_URL}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservaData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error del servidor:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Reserva guardada correctamente:', result);

      await notificarConfirmacion(result.sitioNombre ?? "tu reserva", new Date(reservaData.fecha_entrada));
      await programarRecordatorio(result.sitioNombre ?? "tu reserva", new Date(reservaData.fecha_entrada));

      Alert.alert("Reserva confirmada", "Cancelaciones disponibles hasta 48h antes del día.");
      router.back();
    } catch (error) {
      console.log('❌ Error completo:', error);
      Alert.alert('Error', 'No se pudo realizar la reserva');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Reservar Hotel</Text>

        <Text style={styles.sectionTitle}>Información Personal</Text>
        <TextInput style={styles.input} placeholder="Nombre completo *" value={nombre} onChangeText={setNombre} editable={isLoggedIn}/>
        <TextInput style={styles.input} placeholder="Teléfono *" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" editable={isLoggedIn}/>
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" editable={isLoggedIn}/>

        <Text style={styles.sectionTitle}>Fechas de Estadía</Text>
        <Text style={styles.nochesText}>
          {calcularNoches()} {calcularNoches() === 1 ? 'noche' : 'noches'}
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

        <Text style={styles.sectionTitle}>Huéspedes</Text>
        <TextInput style={styles.input} placeholder="Adultos *" value={adultos} onChangeText={setAdultos} keyboardType="numeric" editable={isLoggedIn}/>
        <TextInput style={styles.input} placeholder="Menores de edad" value={menores} onChangeText={setMenores} keyboardType="numeric" editable={isLoggedIn}/>

        <View style={styles.transporteContainer}>
          <Text style={styles.transporteText}>¿Necesitas transporte al hotel?</Text>
          <TouchableOpacity
            style={[styles.checkbox, transporte && styles.checkboxSelected]}
            onPress={() => setTransporte(!transporte)}
            disabled={!isLoggedIn}
          >
            <Text style={styles.checkboxText}>{transporte ? '✓' : ''}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleReserva}>
          <Text style={styles.buttonText}>Confirmar Reserva</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 🔒 Modal de advertencia con blur y animación */}
      <Modal visible={showModal} transparent animationType="none" onRequestClose={() => setShowModal(false)}>
        <BlurView intensity={40} tint="dark" style={styles.blurBackground}>
          <Animated.View style={[styles.modalContainer, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.modalIcon}>🔒</Text>
            <Text style={styles.modalTitle}>Inicia sesión para continuar</Text>
            <Text style={styles.modalText}>
              Necesitas una cuenta activa para poder realizar una reserva de hotel.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#2563eb' }]}
                onPress={() => {
                  setShowModal(false);
                  router.push({
                    pathname: "/usuario/login",
                    params: { redirectTo: `/categorias/reserva-hotel?sitioId=${sitioId}` },
                  });
                }}
              >
                <Text style={styles.modalButtonText}>Iniciar sesión</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#e5e7eb' }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: '#111827' }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  nochesText: { fontSize: 16, color: '#007AFF', fontWeight: '500', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  transporteContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 16 },
  transporteText: { fontSize: 16 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#007AFF', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: '#007AFF' },
  checkboxText: { color: '#fff', fontWeight: 'bold' },
  button: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  blurBackground: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center' },
  modalIcon: { fontSize: 50, marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  modalText: { fontSize: 14, color: '#4b5563', textAlign: 'center', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
});
