import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { z } from "zod";

import { BASE_URL } from "@/src/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";

const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

const schema = z.object({
  nombre: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50")
    .regex(nameRegex, "Solo letras y espacios (sin dobles espacios)"),
  apellido: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50")
    .regex(nameRegex, "Solo letras y espacios (sin dobles espacios)"),
});
const router = useRouter();
type FormValues = z.infer<typeof schema>;
 

export default function InformacionScreen() {
  // opcional: si vienes con userId de pantallas anteriores
  const { userId, email } = useLocalSearchParams<{ userId?: string; email?: string }>();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { nombre: "", apellido: "" },
  });

  const onSubmit = async (data: FormValues) => {
  const endpoint = `${BASE_URL}/usuarios/${userId}/nombre-apellido`;

  const res = await fetch(endpoint, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }

  // El backend regresa { id, correo, nombre, apellido }
  const body: { id: number | string; correo: string; nombre: string; apellido: string } =
    await res.json();

  // Navega al componente "ultimo" con los datos
  router.replace({
    pathname: "/(tabs)/usuario/crearcuenta/ultimo",
    params: {
      userId: String(body.id ?? userId ?? ""),
      email: String(body.correo ?? email ?? ""),
      nombre: body.nombre ?? "",
      apellido: body.apellido ?? "",
    },
  });
};

  return (
    <View style={{ flex: 1, padding: 16, gap: 14, backgroundColor: "white" }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Tu información</Text>
      {!!email && (
        <Text style={{ fontSize: 14, color: "#6b7280", marginTop: -4 }}>Muy bien : {email} ahora completa esta informacion</Text>
      )}

      {/* Nombre */}
      <Controller
        name="nombre"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Text style={{ marginBottom: 6 }}>Nombre</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.nombre ? "#ef4444" : "#ddd",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 16,
              }}
              placeholder="Juan"
              value={value}
              onChangeText={(t) => onChange(t.replace(/\s{2,}/g, " "))}
              onBlur={onBlur}
              autoCapitalize="words"
            />
            {errors.nombre && (
              <Text style={{ color: "#ef4444", marginTop: 6 }}>{errors.nombre.message}</Text>
            )}
          </View>
        )}
      />

      {/* Apellido */}
      <Controller
        name="apellido"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Text style={{ marginBottom: 6 }}>Apellido</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.apellido ? "#ef4444" : "#ddd",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 16,
              }}
              placeholder="Pérez"
              value={value}
              onChangeText={(t) => onChange(t.replace(/\s{2,}/g, " "))}
              onBlur={onBlur}
              autoCapitalize="words"
            />
            {errors.apellido && (
              <Text style={{ color: "#ef4444", marginTop: 6 }}>{errors.apellido.message}</Text>
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
          <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Guardar</Text>
        )}
      </TouchableOpacity>

      <Text style={{ fontSize: 12, color: "#6b7280" }}>
        Usa solo letras y espacios. Ej.: “María José”.
      </Text>
    </View>
  );
}
