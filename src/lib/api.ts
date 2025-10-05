

export const BASE_URL = "http://192.168.1.12:5001/api"

//prueba

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

export async function getOpinionesBySitio(sitioId: number) {
  const url = `${BASE_URL}/opinion/sitio/${sitioId}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error al obtener opiniones: ${res.status} ${text}`);
  }

  return res.json();
}

//POST para las valora
export async function createOpinion(token: string, sitioId: number, comentario: string, puntuacion: number) {
  const url = `${BASE_URL}/opinion`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // JWT del usuario logueado
    },
    body: JSON.stringify({ sitioId, comentario, puntuacion }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error al crear opinión: ${res.status} ${text}`);
  }

  return res.json();
}

