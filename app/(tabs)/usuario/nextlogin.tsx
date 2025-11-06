// app/(tabs)/usuario/nextlogin.tsx
import { BASE_URL } from "@/src/lib/api";
import { useAuth } from "@/src/state/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres").max(72, "Máximo 72"),
});
type FormValues = z.infer<typeof schema>;

export default function NextLogin() {
  const router = useRouter();
  const { email, userId, redirectTo } = useLocalSearchParams<{
    email?: string;
    userId?: string;
    redirectTo?: string;
  }>(); // 👈 ahora leemos redirectTo
  const [show, setShow] = useState(false);
  const auth = useAuth();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { password: "" },
  });

  const onSubmit = async ({ password }: FormValues) => {
    try {
      const res = await fetch(`${BASE_URL}/usuarios/login-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ correo: email, password }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("password", {
            type: "auth",
            message: "Contraseña incorrecta",
          });
          return;
        }
        if (res.status === 403) {
          Alert.alert("Tu cuenta aún no está validada", "Completa tu registro.");
          return;
        }
        const text = await res.text().catch(() => "");
        throw new Error(text || `Error ${res.status}`);
      }

      const body: any = await res.json();
      if (!body?.accessToken || !body?.user?.id) {
        throw new Error("Respuesta inválida del servidor");
      }

      // ✅ Guarda sesión en Zustand
      auth.login({ user: body.user, token: body.accessToken });

      // ✅ Si se proporcionó redirectTo, regresa a esa ruta (ej: /sitios/98)
      if (redirectTo) {
        router.replace(redirectTo as any);
      } else {
        // flujo normal al perfil
        router.replace({
          pathname: "/(tabs)/usuario/perfil",
          params: {
            userId: String(body.user.id),
            email: String(body.user.correo ?? email ?? ""),
          },
        });
      }
    } catch (e: any) {
      Alert.alert(
        "No pudimos iniciar sesión",
        e?.message ?? "Intenta de nuevo"
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding" })}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Ingresa tu contraseña</Text>
        {!!email && <Text style={styles.subtitle}>{email}</Text>}

        <Controller
          name="password"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={{ width: "100%" }}>
              <Text style={styles.label}>Contraseña</Text>
              <View className="row" style={styles.row}>
                <TextInput
                  style={[
                    styles.input,
                    errors.password && styles.inputError,
                    { flex: 1 },
                  ]}
                  placeholder="********"
                  placeholderTextColor="#777"
                  autoCapitalize="none"
                  secureTextEntry={!show}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
                <Pressable
                  onPress={() => setShow((s) => !s)}
                  style={styles.toggle}
                >
                  <Text style={{ fontWeight: "700" }}>
                    {show ? "Ocultar" : "Ver"}
                  </Text>
                </Pressable>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>
                  {errors.password.message}
                </Text>
              )}
            </View>
          )}
        />

        <Pressable
          disabled={!isValid || isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={({ pressed }) => [
            styles.button,
            (!isValid || isSubmitting) && { opacity: 0.6 },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? "Verificando..." : "Iniciar sesión"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: { fontSize: 18, fontWeight: "700", marginTop: 12, marginBottom: 2 },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 8 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  toggle: { paddingHorizontal: 10, height: 48, justifyContent: "center" },
  button: {
    marginTop: 12,
    width: "100%",
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
