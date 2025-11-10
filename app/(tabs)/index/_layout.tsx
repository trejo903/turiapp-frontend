import { Stack } from "expo-router";


export default function UsuarioStackLayout(){
   return (
    <Stack>
      <Stack.Screen name="index"options={{ headerShown: false }} />
    </Stack>
  );
}