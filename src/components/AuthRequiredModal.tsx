import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AuthRequiredModalProps = {
  visible: boolean;
  onClose: () => void;
  sitioId?: string | number;
  context?: "hotel" | "restaurante";
  message?: string;
};

export default function AuthRequiredModal({
  visible,
  onClose,
  sitioId,
  context = "restaurante",
  message = "Necesitas una cuenta activa para continuar.",
}: AuthRequiredModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
  }, [visible]);

  const redirectPath =
  context === "hotel"
    ? `/categorias/reserva-hotel?sitioId=${sitioId}`
    : `/categorias/reserva?sitioId=${sitioId}`;

  const handleLogin = () => {
    onClose();
    router.push({
      pathname: "/usuario/login",
      params: { redirectTo: redirectPath  },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <BlurView intensity={40} tint="dark" style={styles.blurBackground}>
        <Animated.View
          style={[
            styles.modalContainer,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.modalIcon}>🔒</Text>
          <Text style={styles.modalTitle}>Inicia sesión para continuar</Text>
          <Text style={styles.modalText}>{message}</Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#2563eb" }]}
              onPress={handleLogin}
            >
              <Text style={styles.modalButtonText}>Iniciar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#e5e7eb" }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: "#111827" }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalIcon: { fontSize: 50, marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
  modalText: { fontSize: 14, color: "#4b5563", textAlign: "center", marginBottom: 20 },
  modalButtons: { flexDirection: "row", gap: 10 },
  modalButton: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  modalButtonText: { color: "#fff", fontWeight: "bold" },
});
