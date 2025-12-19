import { TravelMode } from "./types";

export const formatEta = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  if (minutes < 1440) {
    const hours = minutes / 60;
    return `${hours.toFixed(1)} h`;
  }

  const days = minutes / 1440;
  return `${days.toFixed(1)} día${days >= 2 ? "s" : ""}`;
};

export const formatImageUrl = (imgPath?: string | null) => {
  if (!imgPath) return null;
  if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
    return imgPath;
  }
  return `https://res.cloudinary.com/${imgPath}`;
};

export const isDriving = (mode: TravelMode) => mode === "DRIVING";
