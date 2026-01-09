import * as Localization from "expo-localization";

const locale = Localization.getLocales()[0]?.languageCode ?? "en"; // ej. "es-MX", "en-US"

export function formatDateLong(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
export function formatDateTime12h(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;

  const datePart = d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} · ${timePart}`;
}
