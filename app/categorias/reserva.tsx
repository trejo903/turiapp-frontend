// app/categorias/reserva.tsx
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
  const auth = { user: { id: 1 } }; //pOR AHORA SOLO SIMULA 
  
  const handleReserva = async () => {
    // 🔍 Mostrar datos actuales
    console.log('🧾 Datos actuales del formulario:', {
      nombre,
      telefono,
      personas,
      menores,
      fecha,
      transporte,
      sitioId,
      usuarioId: auth.user?.id,
    });

    // ✅ Validaciones
    if (!nombre.trim() || !telefono.trim() || !personas) {
      console.log('⚠️ Campos faltantes:', {
        nombreVacio: !nombre.trim(),
        telefonoVacio: !telefono.trim(),
        personasVacio: !personas,
      });
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }

    const reservaData = {
      tipo: 'restaurante',
      usuario_id: auth.user?.id,
      sitio_id: Number(sitioId),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      transporte: transporte,
      fecha: fecha,
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
      Alert.alert('Éxito', 'Reserva enviada correctamente');
      router.back();
    } catch (error) {
      console.log('❌ Error completo:', error);
      Alert.alert('Error', 'No se pudo realizar la reserva');
    }
  };


  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Reservar Mesa</Text>
      
      {/* Información Básica */}
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

      {/* Fecha y Hora */}
      <Text style={styles.sectionTitle}>Fecha y Hora</Text>
      <TouchableOpacity 
        style={styles.input} 
        onPress={() => setShowDatePicker(true)}
      >
        <Text>Fecha: {fecha.toLocaleDateString()}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.input} 
        onPress={() => setShowTimePicker(true)}
      >
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

      {/* Número de Personas */}
      <Text style={styles.sectionTitle}>Número de Personas</Text>
      <TextInput
        style={styles.input}
        placeholder="Total de personas *"
        value={personas}
        onChangeText={setPersonas}
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
        <Text style={styles.transporteText}>¿Necesitas transporte?</Text>
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