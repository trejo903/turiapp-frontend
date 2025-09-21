import { Stack } from "expo-router";
export default function CrearCuentaLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }}  />
      <Stack.Screen name="password" options={{ headerShown: false }}  />
      <Stack.Screen name="informacion" options={{ headerShown: false }}  />
      <Stack.Screen name="ultimo" options={{ headerShown: false }}  />
    </Stack>
  );
}
