import { Stack } from "expo-router";


export default function UsuarioStackLayout(){
   return (
    <Stack>
      <Stack.Screen name="login"        options={{ headerShown: false }} />
      <Stack.Screen name="crearcuenta"  options={{ headerShown: false }} />
    </Stack>
  );
}