import { Stack } from "expo-router";

export default function HomeStackLayout() {
  return (
    <Stack>
      {/* Pantalla principal de la tab */}
      <Stack.Screen
        name="index"
        options={{
          title: "Inicio",           // 👈 aquí pones el header de la pantalla principal
          headerTitleAlign: "left",
        }}
      />

      {/* Pantalla del mapa */}
      <Stack.Screen
        // ruta: app/(tabs)/home/mapa/mapa.tsx
        name="mapa/mapa"
        options={({ route }) => ({
          title: (route.params as any)?.titulo ?? "Mapa",  // ejemplo: "Relax & Salud"
          headerBackTitleVisible: false,
        })}
      />

      {/* si tienes más pantallas en home, las agregas aquí */}
    </Stack>
  );
}
