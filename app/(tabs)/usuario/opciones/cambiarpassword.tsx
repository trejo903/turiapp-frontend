// app/(tabs)/usuario/opciones/cambiarpassword.tsx
import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/src/state/auth";
import { BASE_URL } from "@/src/lib/api";

const schema = z.object({
  currentPassword: z.string().min(8, "Mínimo 8 caracteres").max(72, "Máximo 72"),
  newPassword: z.string().min(8, "Mínimo 8 caracteres").max(72, "Máximo 72"),
  confirmPassword: z.string().min(8, "Mínimo 8 caracteres").max(72, "Máximo 72"),
}).refine(v => v.newPassword === v.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

export default function CambiarPassword() {
  const auth = useAuth(); // <- de aquí sacas user.id y token
  const {
    control, handleSubmit, formState: { errors, isValid, isSubmitting }, reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onSubmit = async ({ currentPassword, newPassword }: FormValues) => {
    if (!auth.user?.id) {
      Alert.alert("Sesión", "Vuelve a iniciar sesión.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/usuarios/${auth.user.id}/password-change`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // Usa el token que guardaste en Zustand:
          ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 401) throw new Error("La contraseña actual es incorrecta");
        if (res.status === 400) throw new Error("La nueva contraseña no puede ser igual a la actual");
        if (res.status === 409) throw new Error("Conflicto al cambiar la contraseña");
        throw new Error(text || `Error ${res.status}`);
      }

      Alert.alert("Listo", "Tu contraseña fue actualizada.");
      reset();
    } catch (e: any) {
      Alert.alert("No se pudo cambiar", e?.message ?? "Intenta de nuevo");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding" })}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#fff" }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Cambiar contraseña</Text>

        {/* Contraseña actual */}
        <Controller
          name="currentPassword"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={{ width: "100%", marginTop: 12 }}>
              <Text style={styles.label}>Contraseña actual</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, errors.currentPassword && styles.inputError, { flex: 1 }]}
                  placeholder="********"
                  autoCapitalize="none"
                  secureTextEntry={!showCurrent}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  returnKeyType="next"
                />
                <Pressable onPress={() => setShowCurrent(s => !s)} style={styles.toggle}>
                  <Text style={{ fontWeight: "700" }}>{showCurrent ? "Ocultar" : "Ver"}</Text>
                </Pressable>
              </View>
              {errors.currentPassword && <Text style={styles.errorText}>{errors.currentPassword.message}</Text>}
            </View>
          )}
        />

        {/* Nueva contraseña */}
        <Controller
          name="newPassword"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={{ width: "100%", marginTop: 12 }}>
              <Text style={styles.label}>Nueva contraseña</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, errors.newPassword && styles.inputError, { flex: 1 }]}
                  placeholder="********"
                  autoCapitalize="none"
                  secureTextEntry={!showNew}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  returnKeyType="next"
                />
                <Pressable onPress={() => setShowNew(s => !s)} style={styles.toggle}>
                  <Text style={{ fontWeight: "700" }}>{showNew ? "Ocultar" : "Ver"}</Text>
                </Pressable>
              </View>
              {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword.message}</Text>}
            </View>
          )}
        />

        {/* Confirmar */}
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={{ width: "100%", marginTop: 12 }}>
              <Text style={styles.label}>Confirmar nueva contraseña</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError, { flex: 1 }]}
                  placeholder="********"
                  autoCapitalize="none"
                  secureTextEntry={!showConfirm}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  returnKeyType="done"
                />
                <Pressable onPress={() => setShowConfirm(s => !s)} style={styles.toggle}>
                  <Text style={{ fontWeight: "700" }}>{showConfirm ? "Ocultar" : "Ver"}</Text>
                </Pressable>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
            </View>
          )}
        />

        <Pressable
          disabled={!isValid || isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={({ pressed }) => [
            styles.button,
            (!isValid || isSubmitting) && { opacity: 0.6 },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.buttonText}>{isSubmitting ? "Guardando..." : "Guardar cambios"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, alignSelf: "flex-start" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { width: "100%", height: 48, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 12, backgroundColor: "#fff" },
  inputError: { borderColor: "#e11d48" },
  errorText: { color: "#e11d48", marginTop: 6 },
  toggle: { paddingHorizontal: 10, height: 48, justifyContent: "center" },
  button: { marginTop: 16, width: "100%", height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
