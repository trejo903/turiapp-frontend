import { BASE_URL } from "@/src/lib/api";
import { useRouter } from "expo-router";
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const router = useRouter();


type FormValues={
    email:string
}


export default function CrearCuenta(){
    const{control,handleSubmit,formState:{errors,isSubmitted,isSubmitting,isValid},setError,reset} = useForm({
        mode:'onChange',
        defaultValues:{email:""}
    })

    const onSubmit=async({email}:FormValues)=>{
        try {
            const res = await fetch(`${BASE_URL}/usuarios/email`,{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({correo:email})
            })

            if(!res.ok){
                if(res.status ===409){
                    const body = await res.json().catch(()=>({}))
                    const message = body?.message ?? "El correo ya esta registrado";
                    setError("email",{type:"conflic",message})
                    return
                }
                const text = await res.text().catch(()=>"")
                throw new Error(text || `Error ${res.status}`)
            }
            const data:{id:number | string;correo:string} = await res.json()
             router.push({
      pathname: "/(tabs)/usuario/crearcuenta/password",
      params: { email: data.correo, userId: String(data.id) },
    });
        
        } catch (error:any) {
            setError("email",{type:"server",message:error?.message || "error al registrar"})
        }
    }
    return(
        <KeyboardAvoidingView
            style={{flex:1}}
            behavior={Platform.select({ios:"padding",android:undefined})}
        >
            <View style={styles.container}>
                <Text style={styles.title}>Crear Cuenta</Text>
                <Controller
                    control={control}
                    name="email"
                    rules={{
                        required:"El correo electronico es obligatorio",
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Escribe un correo válido",
                        }
                    }} 
                    render={({field:{onChange,onBlur,value}})=>(
                        <View style={{width:"100%"}}>
                            <Text style={styles.label}>Correo electronico</Text>
                            <TextInput
                                style={[styles.input, errors.email && styles.inputError]}
                                placeholder='correo@gmail.com'
                                keyboardType='email-address'
                                autoCapitalize='none'
                                autoCorrect={false}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                returnKeyType='done'
                                onSubmitEditing={handleSubmit(onSubmit)}
                            />
                            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                        </View>
                    )} 
                />
                <Pressable
                    onPress={handleSubmit(onSubmit)}
                    disabled={!isValid || isSubmitting}
                   style={({ pressed }) => [
                        styles.button,
                        (!isValid || isSubmitting) && { opacity: 0.6 },
                        pressed && { opacity: 0.8 },
                    ]}
                >
                    <Text style={styles.buttonText}>{isSubmitting ? "Enviando..." : "Continuar"}</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    )
}


const styles = StyleSheet.create({
    container:{
        flex:1,
        padding:20,
        gap:14,
        alignItems:"center",
        backgroundColor:"#fff"
    },
     title: { fontSize: 16, fontWeight: "500", marginTop: 12, marginBottom: 8, alignSelf: "center" },
    label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
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
  button: {
    marginTop: 12,
    width: "100%",
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
  },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
})