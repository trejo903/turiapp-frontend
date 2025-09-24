import { Stack } from "expo-router";


export default function UsuarioStackLayout(){
   return (
    <Stack initialRouteName="login">
      <Stack.Screen name="login"        options={{ headerShown: false }} />
      <Stack.Screen name="crearcuenta"  options={{ headerShown: false }} />
      <Stack.Screen name="opciones"  options={{ headerShown: false }} />
      <Stack.Screen name="nextlogin"  options={{ headerShown: false }} />
      <Stack.Screen name="perfil"       options={{ headerShown: false }}/>
    </Stack>
  );
}