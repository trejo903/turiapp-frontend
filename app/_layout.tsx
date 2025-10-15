// app/_layout.tsx
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Notifications from "expo-notifications";
import { Stack } from 'expo-router';
import { useEffect } from "react";
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Activa las notificaciones en ajustes para recibir recordatorios.");
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Tu árbol principal: tabs, stacks, etc. */}
          <Stack.Screen name="(tabs)" />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
