// app/(tabs)/usuario/login.tsx 
import { BASE_URL } from "@/src/lib/api";
import { useAuth } from "@/src/state/auth";
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type FormValues = { email: string };
type LoginStartResp = {
  id: number | string;
  correo: string;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  validado: boolean;
  nextStep: "crear-password" | "informacion" | "ultimo" | "password-check";
};

export default function Usuario() {
  const router = useRouter();
  const { isAuthenticated, hasValidToken, user } = useAuth();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();

  // ✅ Si ya hay sesión válida, redirige directo a perfil
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && hasValidToken()) {
        router.replace({
          pathname: "/(tabs)/usuario/perfil",
          params: { userId: String(user?.id ?? ""), email: String(user?.correo ?? "") },
        });
      }
    }, [isAuthenticated, hasValidToken, user, router])
  );

  const { control, handleSubmit, setError, formState: { errors, isSubmitting, isValid } } =
    useForm<FormValues>({ mode: "onChange", defaultValues: { email: "" } });

  const onSubmit = async ({ email }: FormValues) => {
    try {
      const res = await fetch(`${BASE_URL}/usuarios/login-start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Error ${res.status}`);
      }

      const body: LoginStartResp = await res.json();
      const userId = String(body.id);

      switch (body.nextStep) {
        case "crear-password":
          router.replace({ pathname: "/(tabs)/usuario/crearcuenta/password", params: { userId, email: body.correo } });
          break;
        case "informacion":
          router.replace({
            pathname: "/(tabs)/usuario/crearcuenta/informacion",
            params: { userId, email: body.correo, nombre: body.nombre ?? "", apellido: body.apellido ?? "" },
          });
          break;
        case "ultimo":
          router.replace({
            pathname: "/(tabs)/usuario/crearcuenta/ultimo",
            params: { userId, email: body.correo, nombre: body.nombre ?? "", apellido: body.apellido ?? "" },
          });
          break;
        case "password-check":
          router.replace({ pathname: "/(tabs)/usuario/nextlogin", params: { userId, email: body.correo, redirectTo, } });
          break;
      }
    } catch (e: any) {
      const msg = e?.message ?? "No pudimos continuar";
      setError("email", { type: "server", message: msg });
      Alert.alert("Inicio de sesión", msg);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding", android: undefined })}>
      <View style={styles.container}>
        <Text style={styles.title}>Iniciar Sesión</Text>

        <Controller
          control={control}
          name="email"
          rules={{
            required: "El correo electrónico es obligatorio",
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Escribe un correo válido" },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={{ width: "100%" }}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="correo@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>
          )}
        />

        <Pressable
          disabled={!isValid || isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={({ pressed }) => [styles.button, (!isValid || isSubmitting) && { opacity: 0.6 }, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.buttonText}>{isSubmitting ? "Enviando..." : "Continuar"}</Text>
        </Pressable>

        <Link href={"/(tabs)/usuario/crearcuenta"} asChild>
          <Pressable style={{ paddingVertical: 12 }}>
            <Text style={{ textAlign: "center", fontWeight: "700" }}>¿No tienes cuenta? Crea una</Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 14, alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 16, fontWeight: "500", marginTop: 12, marginBottom: 8, alignSelf: "center" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: { width: "100%", height: 48, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 12, backgroundColor: "#fff" },
  inputError: { borderColor: "#e11d48" },
  errorText: { color: "#e11d48", marginTop: 6 },
  button: { marginTop: 12, width: "100%", height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#2563eb" },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
