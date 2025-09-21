import { useRoute } from '@react-navigation/native'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod";
import {z} from 'zod'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from "expo-router";



const shema = z.object({
    password:z.string().min(8,"Minimo 8 caracteres").max(72,"Maximo 72 caracteres").regex(/^\S+$/, "Sin espacios"),
    confirm:z.string()
}).refine((data)=>data.password === data.confirm,{
    message:"Las contraseñas no coinciden",
    path:["confirm"]
})

type FormData = z.infer<typeof shema>


export default function PasswordScreen(){
    const { email, userId } = useLocalSearchParams<{ email: string; userId: string }>();
    const router = useRoute()
    const[showPass,setShowPass]=useState(false)
    const[showConfirm,setShowConfirm]=useState(false)
    const{control,handleSubmit,formState:{errors,isSubmitting,isValid}}=useForm({
        resolver:zodResolver(shema),
        mode:"onChange",
        defaultValues:{password:"",confirm:""}
    })
    const onSubmit = async ({ password }: FormData) => {
    try {
      const res = await fetch("https://tu-backend.com/api/usuario/registrar/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Error al guardar la contraseña");
      }

      alert("Contraseña guardada ✅");
    } catch (e: any) {
      alert(e.message ?? "Ocurrió un error");
    }
  };
  return (
    <View style={{ flex: 1, padding: 16, gap: 14, backgroundColor: "white" }}>
      
        {email ? (
        <Text style={{ fontSize: 14, color: "#6b7280", marginTop: -4 }}>
         Hola : {email}
        </Text>
      ) : null}
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Crea tu contraseña</Text>
      <Controller
        name="password"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Text style={{ marginBottom: 6 }}>Contraseña</Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: errors.password ? "#ef4444" : "#ddd",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TextInput
                style={{ flex: 1, fontSize: 16 }}
                value={value}
                onChangeText={(t) => onChange(t.trimStart())}
                onBlur={onBlur}
                placeholder="********"
                secureTextEntry={!showPass}
                autoCapitalize="none"
                textContentType="newPassword"
              />
              <TouchableOpacity onPress={() => setShowPass((s) => !s)}>
                <Text style={{ fontWeight: "600" }}>{showPass ? "Ocultar" : "Ver"}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={{ color: "#ef4444", marginTop: 6 }}>{errors.password.message}</Text>
            )}
          </View>
        )}
      />

      {/* Confirm */}
      <Controller
        name="confirm"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Text style={{ marginBottom: 6 }}>Confirmar contraseña</Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: errors.confirm ? "#ef4444" : "#ddd",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TextInput
                style={{ flex: 1, fontSize: 16 }}
                value={value}
                onChangeText={(t) => onChange(t.trimStart())}
                onBlur={onBlur}
                placeholder="********"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                textContentType="newPassword"
              />
              <TouchableOpacity onPress={() => setShowConfirm((s) => !s)}>
                <Text style={{ fontWeight: "600" }}>{showConfirm ? "Ocultar" : "Ver"}</Text>
              </TouchableOpacity>
            </View>
            {errors.confirm && (
              <Text style={{ color: "#ef4444", marginTop: 6 }}>{errors.confirm.message}</Text>
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
        {isSubmitting ? <ActivityIndicator /> : <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Continuar</Text>}
      </TouchableOpacity>

      <Text style={{ fontSize: 12, color: "#6b7280" }}>
        La contraseña debe tener al menos 8 caracteres y no puede incluir espacios.
      </Text>
    </View>
  );
}