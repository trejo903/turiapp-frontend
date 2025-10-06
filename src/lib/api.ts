

export const BASE_URL = "http://192.168.1.11:5001/api"

//prueba

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null
) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include", // si además usas cookies httpOnly
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return null;
}


export type Sitio = {
    id:number
    nombre:string
    img:string
    telefono: string
    estado:string
    municipio:string
    cp:string
    fraccionamiento:string
    calle:string
    latitude:number | string
    longitude:number | string
    categoriaId:number
    categoria?: any;
}

function normalizeSitioDecimals(s:Sitio):Sitio{
    return{
        ...s,
        latitude: typeof s.latitude === "string" ? Number(s.latitude) : s.latitude,
        longitude: typeof s.longitude === "string" ? Number(s.longitude) : s.longitude
    }
}

export async function getSitioById(id: number): Promise<Sitio> {
  const url = `${BASE_URL}/sitios/${id}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Get ${url} ${res.status} ${text}`);
  }

  const data: Sitio = await res.json();
  return normalizeSitioDecimals(data);
}


export async function getSitiosByCategoria(categoriaId:number):Promise<Sitio[]> {
    const url = `${BASE_URL}/sitios?categoriaId=${categoriaId}`
    const res  = await fetch(url)
    if(!res.ok){
        const text = await res.text().catch(()=>"");
        throw new Error(`Get ${url} ${res.status} ${text}`)
    }

    const data:Sitio[] = await res.json()
    return data.map(normalizeSitioDecimals)
}


export async function getCategorias() {
  const res = await fetch(`${BASE_URL}/categorias`);
  if (!res.ok) throw new Error("No se pudo cargar categorías");
  const json = await res.json();


  const arr = Array.isArray(json) ? json : json?.data ?? [];
  return arr.map((c: any) => ({
    id: c.id,
    nombre: c.nombre,
    img: c.img ?? null,
    color: c.color ?? null, 
  }));
}




// src/lib/api.ts
// src/lib/api.ts (o donde declares los tipos)
export type OpinionApi = {
  id: number;
  comentario: string;
  puntuacion: number;
  fecha: string; // o Date si lo parseas
  usuarioId?: number;
  sitioId?: number;

  // 👇 relación que viene del backend
  sitio?: {
    id: number;
    nombre?: string;     // hazlo opcional por si algún endpoint no lo manda
    img?: string;        // opcional: lo que quieras aprovechar
  };
};


export async function getOpinionesBySitio(sitioId: number): Promise<OpinionApi[]> {
  const url = `${BASE_URL}/opinion/sitio/${sitioId}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error al obtener opiniones: ${res.status} ${text}`);
  }
  return res.json();
}

export async function createOpinion(
  token: string,
  sitioId: number,
  comentario: string,
  puntuacion: number
): Promise<OpinionApi> {
  const res = await fetch(`${BASE_URL}/opinion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,   // 👈 token real
    },
    body: JSON.stringify({ sitioId, comentario, puntuacion }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error al crear opinión: ${res.status} ${text}`);
  }
  return res.json();
}


export async function createOpinionNoAuth(
  sitioId: number,
  comentario: string,
  puntuacion: number,
  usuarioId: number
) {
  const res = await fetch(`${BASE_URL}/opinion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sitioId, comentario, puntuacion, usuarioId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error al crear opinión: ${res.status} ${text}`);
  }
  return res.json();
}



export async function getOpinionesDeUsuario(userId: number): Promise<OpinionApi[]> {
  return apiFetch(`/opinion/usuario/${userId}`);
}

export async function getMisOpiniones(token: string): Promise<OpinionApi[]> {
  return apiFetch(`/opinion/mias`, {}, token);
}

export async function deleteOpinion(id: number) {
  const res = await fetch(`${BASE_URL}/opinion/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? 'No se pudo eliminar el comentario');
  }
  return res.json();
}
