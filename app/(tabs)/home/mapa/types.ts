import { Sitio } from "@/src/lib/api";

export type SitioWithImgs = Sitio & {
  imagenes?: { id: number; url: string; orden?: number }[];
};

export type TravelMode = "DRIVING" | "WALKING";
