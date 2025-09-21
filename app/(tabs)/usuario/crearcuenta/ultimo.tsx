// app/(tabs)/usuario/crearcuenta/ultimo.tsx
import React from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BASE_URL } from "@/src/lib/api";


// Teléfono MX: 10 dígitos (ej. 6181234567)
const schema = z.object({
  telefono: z
    .string()
    .transform((v) => v.replace(/\D/g, "")) // deja solo números
    .refine((v) => v.length === 10, { message: "Debe tener 10 dígitos" }),
});

type FormValues = z.infer<typeof schema>;

export default function UltimoScreen() {
  const router = useRouter();
  const { userId, email, nombre, apellido } = useLocalSearchParams<{
    userId?: string;
    email?: string;
    nombre?: string;
    apellido?: string;
  }>();
const fullName = [nombre, apellido].filter(Boolean).join(" ");
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { telefono: "" },
  });

  const onSubmit = async ({ telefono }: FormValues) => {
  try {
    const res = await fetch(`${BASE_URL}/usuarios/${userId}/telefono`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefono }),
    });

    if (!res.ok) {
      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        const message = body?.message ?? "Ese teléfono ya está registrado";
        setError("telefono", { type: "conflict", message });
        return;
      }
      const text = await res.text().catch(() => "");
      throw new Error(text || `Error ${res.status}`);
    }

    // Si el backend devuelve { id, correo, nombre, apellido, telefono? }
    const body = await res.json().catch(() => null);
    const nextEmail = body?.correo ?? email ?? "";

    // Opción A: navegar directo
    router.replace({
      pathname: "/(tabs)/usuario/login",
    });

    // Opción B: si quieres mostrar Alert y navegar al cerrar
    // Alert.alert("Listo ✅", "Teléfono guardado", [
    //   {
    //     text: "Continuar",
    //     onPress: () =>
    //       router.replace({
    //         pathname: "/(tabs)/usuario/login",
    //         params: nextEmail ? { email: nextEmail } : undefined,
    //       }),
    //   },
    // ]);

  } catch (e: any) {
    setError("telefono", {
      type: "server",
      message: e?.message ?? "Ocurrió un error al guardar el teléfono",
    });
  }
};

  return (
    <View style={{ flex: 1, padding: 16, gap: 14, backgroundColor: "white" }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Tu teléfono</Text>
      {/* Debajo del título */}
{fullName ? (
  <Text style={{ fontSize: 14, color: "#6b7280", marginTop: -4 }}>
    {`¡Muy bien, ${fullName}! Ahora completa el último paso.`}
  </Text>
) : null}
      <Controller
        name="telefono"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Text style={{ marginBottom: 6 }}>Número (10 dígitos)</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.telefono ? "#ef4444" : "#ddd",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 16,
              }}
              placeholder="6181234567"
              keyboardType="phone-pad"
              value={value}
              onChangeText={(t) => {
                // permite escribir con espacios/guiones y los limpia
                const onlyDigits = t.replace(/\D/g, "").slice(0, 10);
                onChange(onlyDigits);
              }}
              onBlur={onBlur}
              maxLength={10}
            />
            {errors.telefono && (
              <Text style={{ color: "#ef4444", marginTop: 6 }}>
                {errors.telefono.message}
              </Text>
            )}
          </View>
        )}
      />

      <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        disabled={!isValid || isSubmitting}
        style={{
          backgroundColor: !isValid || isSubmitting ? "#9ca3af" : "#111827",
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 6,
        }}
      >
        {isSubmitting ? (
          <ActivityIndicator />
        ) : (
          <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
            Guardar teléfono
          </Text>
        )}
      </TouchableOpacity>

      <Text style={{ fontSize: 12, color: "#6b7280" }}>
        Ingresa solo 10 dígitos (ej. móviles de México). No incluyas +52.
      </Text>
    </View>
  );
}
