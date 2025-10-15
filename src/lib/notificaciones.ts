import * as Notifications from "expo-notifications";

/** ✅ Al confirmar reserva */
export async function notificarConfirmacion(nombreSitio: string, fechaEntrada: Date) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Reserva confirmada ✅",
      body: `Tu reserva en ${nombreSitio} fue confirmada. Cancelaciones disponibles hasta 48h antes del ${fechaEntrada.toLocaleDateString()}.`,
      sound: true,
    },
    trigger: null,
  });
}

/** 🕓 Recordatorio automático (2 horas antes del check-in) */
export async function programarRecordatorio(nombreSitio: string, fechaEntrada: Date) {
  const recordatorio = new Date(fechaEntrada.getTime() - 2 * 60 * 60 * 1000);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Recordatorio de reserva 🏨",
      body: `Tienes una reserva en ${nombreSitio} hoy a las ${fechaEntrada.toLocaleTimeString()}.`,
    },
    trigger: recordatorio,
  });
  return id;
}

/** ❌ Cancelación con mensaje empático */
export async function cancelarRecordatorio(notificationId?: string, nombreSitio?: string) {
  if (notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💔 Te extrañamos en tu reserva",
      body: `Hoy tenías tu visita a ${nombreSitio}... ¿Quieres volver a intentarlo o ver nuevos lugares?`,
      data: { type: "reengagement" },
    },
    trigger: { seconds: 300 }, // 5 minutos después
  });
}
