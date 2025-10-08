import { BASE_URL } from '@/src/lib/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const auth = { user: { id: 2 } };

export default function ReservaHotelScreen() {
  const { sitioId } = useLocalSearchParams<{ sitioId: string }>();

  const [fechaEntrada, setFechaEntrada] = useState(new Date());
  const [fechaSalida, setFechaSalida] = useState(new Date(Date.now() + 86400000)); // +1 día
  const [showEntradaPicker, setShowEntradaPicker] = useState(false);
  const [showSalidaPicker, setShowSalidaPicker] = useState(false);
  const [adultos, setAdultos] = useState('');
  const [menores, setMenores] = useState('');
  const [transporte, setTransporte] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  const calcularNoches = () => {
    const diff = fechaSalida.getTime() - fechaEntrada.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleReserva = async () => {
    // 🔍 Mostrar datos actuales
    console.log('🧾 Datos actuales del formulario:', {
      nombre,
      telefono,
      adultos,
      menores,
      fechaEntrada,
      fechaSalida,
      transporte,
      sitioId,
      usuarioId: auth.user?.id,
    });

    // ✅ Validaciones reales
    if (!nombre.trim() || !telefono.trim() || !adultos) {
      console.log('⚠️ Campos faltantes:', {
        nombreVacio: !nombre.trim(),
        telefonoVacio: !telefono.trim(),
        adultosVacio: !adultos,
      });
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }

    if (fechaEntrada >= fechaSalida) {
      Alert.alert('Error', 'La fecha de salida debe ser posterior a la de entrada');
      return;
    }

    // 🧱 Datos finales a enviar al backend
    const reservaData = {
      tipo: 'hotel',
      usuario_id: auth.user?.id,
      sitio_id: Number(sitioId),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      transporte: transporte,
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
      Alert.alert('Éxito', 'Reserva enviada correctamente');
      router.back();
    } catch (error) {
      console.log('❌ Error completo:', error);
      Alert.alert('Error', 'No se pudo realizar la reserva');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Reservar Hotel</Text>

      {/* Información Personal */}
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
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Fechas de Estadía */}
      <Text style={styles.sectionTitle}>Fechas de Estadía</Text>
      <Text style={styles.nochesText}>
        {calcularNoches()} {calcularNoches() === 1 ? 'noche' : 'noches'}
      </Text>

      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowEntradaPicker(true)}
      >
        <Text>Check-in: {fechaEntrada.toLocaleDateString()}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowSalidaPicker(true)}
      >
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

      {/* Huéspedes */}
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
        placeholder="Menores de edad"
        value={menores}
        onChangeText={setMenores}
        keyboardType="numeric"
      />

      {/* Transporte */}
      <View style={styles.transporteContainer}>
        <Text style={styles.transporteText}>¿Necesitas transporte al hotel?</Text>
        <TouchableOpacity
          style={[styles.checkbox, transporte && styles.checkboxSelected]}
          onPress={() => setTransporte(!transporte)}
        >
          <Text style={styles.checkboxText}>{transporte ? '✓' : ''}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleReserva}>
        <Text style={styles.buttonText}>Confirmar Reserva</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  nochesText: { fontSize: 16, color: '#007AFF', fontWeight: '500', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff'
  },
  transporteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16
  },
  transporteText: { fontSize: 16 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxSelected: { backgroundColor: '#007AFF' },
  checkboxText: { color: '#fff', fontWeight: 'bold' },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
