import { Stack } from "expo-router";
export default function OpcionesLayout() {
  return (
    <Stack>
      <Stack.Screen name="miscompras" options={{ headerShown: false }}  />
      <Stack.Screen name="miscomentarios" options={{ headerShown: false }}  />
      <Stack.Screen name="mislugares" options={{ headerShown: false }}  />
      <Stack.Screen name="favoritos" options={{ headerShown: false }}  />
      <Stack.Screen name="cambiarpassword" options={{ headerShown: false }}  />
      <Stack.Screen name="editarperfil" options={{ headerShown: false }}  />
    </Stack>
  );
}
