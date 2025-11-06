// app/(tabs)/usuario/opciones/editarperfil.tsx
import { BASE_URL } from "@/src/lib/api";
import { useAuth } from "@/src/state/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

const schema = z.object({
  nombre: z.string().min(1, "Requerido").max(80, "Máximo 80"),
  apellido: z.string().min(1, "Requerido").max(80, "Máximo 80"),
  correo: z.string().email("Correo inválido"),
});
type FormValues = z.infer<typeof schema>;

export default function EditarPerfil() {
  const router = useRouter();
  const auth = useAuth();

  // params esperados: userId, nombre, apellido, email (opcionales)
  const params = useLocalSearchParams<{
    userId?: string;
    nombre?: string;
    apellido?: string;
    email?: string;
  }>();

  const userId =
    (params?.userId && String(params.userId)) ||
    (auth.user?.id ? String(auth.user.id) : "");

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      nombre: String(params?.nombre ?? auth.user?.nombre ?? ""),
      apellido: String(params?.apellido ?? auth.user?.apellido ?? ""),
      correo: String(params?.email ?? auth.user?.correo ?? ""),
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!userId) {
      Alert.alert("Sesión requerida", "Vuelve a iniciar sesión.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/usuarios/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        body: JSON.stringify(values), // { nombre, apellido, correo }
      });

      if (!res.ok) {
        const msg = (await res.text().catch(() => "")) || `Error ${res.status}`;
        throw new Error(msg);
      }

      const updated = await res.json(); // { id, correo, nombre, apellido, ... }

      // ✅ Actualiza Zustand: conserva el token actual
      auth.login({
        user: {
          id: Number(updated.id),
          correo: String(updated.correo),
          nombre: updated.nombre ?? undefined,
          apellido: updated.apellido ?? undefined,
        },
        token: auth.token ?? null,
      } as any);

      reset({
        nombre: updated.nombre ?? "",
        apellido: updated.apellido ?? "",
        correo: updated.correo ?? "",
      });

      Alert.alert("Listo", "Tu perfil se actualizó correctamente.");
      router.back();
    } catch (e: any) {
      Alert.alert("No pudimos actualizar", e?.message ?? "Inténtalo de nuevo");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding" })}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: "#fff" }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Editar perfil</Text>

        {/* Nombre */}
        <Controller
          name="nombre"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={[styles.input, errors.nombre && styles.inputError]}
                placeholder="Tu nombre"
                placeholderTextColor="#777"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                returnKeyType="next"
              />
              {errors.nombre && (
                <Text style={styles.errorText}>{errors.nombre.message}</Text>
              )}
            </View>
          )}
        />

        {/* Apellido */}
        <Controller
          name="apellido"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>Apellido</Text>
              <TextInput
                style={[styles.input, errors.apellido && styles.inputError]}
                placeholder="Tu apellido"
                placeholderTextColor="#777"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                returnKeyType="next"
              />
              {errors.apellido && (
                <Text style={styles.errorText}>{errors.apellido.message}</Text>
              )}
            </View>
          )}
        />

        {/* Correo */}
        <Controller
          name="correo"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>Correo</Text>
              <TextInput
                style={[styles.input, errors.correo && styles.inputError]}
                placeholder="email@dominio.com"
                placeholderTextColor="#777"
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                returnKeyType="done"
              />
              {errors.correo && (
                <Text style={styles.errorText}>{errors.correo.message}</Text>
              )}
            </View>
          )}
        />

        {/* Botones */}
        <View style={{ gap: 10, marginTop: 8 }}>
          <Pressable
            disabled={!isValid || isSubmitting}
            onPress={handleSubmit(onSubmit)}
            style={({ pressed }) => [
              styles.buttonPrimary,
              (!isValid || isSubmitting) && { opacity: 0.6 },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.buttonGhost, pressed && { opacity: 0.8 }]}
          >
            <Text style={[styles.buttonText, { color: "#111827" }]}>
              Cancelar
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  field: { width: "100%", marginTop: 12 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, alignSelf: "flex-start" },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "#e11d48" },
  errorText: { color: "#e11d48", marginTop: 6 },
  buttonPrimary: {
    width: "100%",
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  buttonGhost: {
    width: "100%",
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  buttonText: { fontWeight: "700", fontSize: 16, color: "white" },
});
