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

export default function ReservaScreen() {
  const { sitioId } = useLocalSearchParams<{ sitioId: string }>();
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [personas, setPersonas] = useState('');
  const [menores, setMenores] = useState('');
  const [transporte, setTransporte] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
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

  const handleReserva = async () => {
    if (!isLoggedIn) {
      setShowModal(true);
      return;
    }

    console.log('🧾 Datos actuales del formulario:', {
      nombre,
      telefono,
      personas,
      menores,
      fecha,
      transporte,
      sitioId,
      usuarioId: userId,
    });

    if (!nombre.trim() || !telefono.trim() || !personas) {
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }

    const reservaData = {
      tipo: 'restaurante',
      usuario_id: userId,
      sitio_id: Number(sitioId),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      transporte,
      fecha,
      personas: Number(personas),
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

      await notificarConfirmacion(result.sitioNombre ?? "tu reserva", new Date(reservaData.fecha));
      await programarRecordatorio(result.sitioNombre ?? "tu reserva", new Date(reservaData.fecha));

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
        <Text style={styles.title}>Reservar Mesa</Text>

        <Text style={styles.sectionTitle}>Información Personal</Text>
        <TextInput style={styles.input} placeholder="Nombre completo *" value={nombre} onChangeText={setNombre} editable={isLoggedIn}/>
        <TextInput style={styles.input} placeholder="Teléfono *" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" editable={isLoggedIn}/>
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" editable={isLoggedIn}/>

        <Text style={styles.sectionTitle}>Fecha y Hora</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>Fecha: {fecha.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text>Hora: {fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>

        {(showDatePicker || showTimePicker) && (
          <DateTimePicker
            value={fecha}
            mode={showDatePicker ? 'date' : 'time'}
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              setShowTimePicker(false);
              if (selectedDate) setFecha(selectedDate);
            }}
          />
        )}

        <Text style={styles.sectionTitle}>Número de Personas</Text>
        <TextInput style={styles.input} placeholder="Total de personas *" value={personas} onChangeText={setPersonas} keyboardType="numeric" editable={isLoggedIn}/>
        <TextInput style={styles.input} placeholder="Menores de edad" value={menores} onChangeText={setMenores} keyboardType="numeric" editable={isLoggedIn}/>

        <View style={styles.transporteContainer}>
          <Text style={styles.transporteText}>¿Necesitas transporte?</Text>
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
              Necesitas una cuenta activa para poder realizar una reserva.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#2563eb' }]}
                onPress={() => {
                  setShowModal(false);
                  router.push({
                    pathname: "/usuario/login",
                    params: { redirectTo: `/categorias/reserva?sitioId=${sitioId}` },
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
