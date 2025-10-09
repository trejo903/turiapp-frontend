import { BASE_URL } from "./api";

// src/lib/api.ts
export type Sitio = {
  id: number;
  nombre: string;
  img?: string | null;
  telefono?: string | null;
  estado: string;
  municipio: string;
  cp?: string | null;
  fraccionamiento?: string | null;
  calle?: string | null;
  latitude: number;
  longitude: number;
  categoria?: { id: number; nombre: string; reservable?: boolean } | null;
};

// Si tu endpoint devuelve { total, items: [{ sitio: {...}, ...}] }
export async function getFavoritos(userId: number): Promise<Sitio[]> {
  const res = await fetch(`${BASE_URL}/usuarios/${userId}/favoritos`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("No se pudieron cargar favoritos");
  const data = await res.json();

  // normaliza posibles formas de respuesta
  if (Array.isArray(data?.items)) {
    return data.items.map((f: any) => f.sitio ?? f); // si ya viene { sitio }
  }
  if (Array.isArray(data)) {
    return data.map((f: any) => f.sitio ?? f);
  }
  return [];
}

export async function removeFavorito(userId: number, sitioId: number) {
  const res = await fetch(`${BASE_URL}/usuarios/${userId}/favoritos/${sitioId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("No se pudo eliminar de favoritos");
  return res.json();
}
