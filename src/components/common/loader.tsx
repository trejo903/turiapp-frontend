//Loader.tsx
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';



export default function Loader({ message = "Cargando..." }: { message?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large"   />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  message: { marginTop: 12, fontSize: 14, color: '#555', textAlign: 'center' }
});
