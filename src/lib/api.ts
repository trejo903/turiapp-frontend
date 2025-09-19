

const BASE_URL = "http://192.168.1.6:5001"

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
}

function normalizeSitioDecimals(s:Sitio):Sitio{
    return{
        ...s,
        latitude: typeof s.latitude === "string" ? Number(s.latitude) : s.latitude,
        longitude: typeof s.longitude === "string" ? Number(s.longitude) : s.longitude
    }
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
    const res = await fetch(`${BASE_URL}/categorias`)
    if(!res.ok){
        throw new Error(`HTTP ${res.status}`)
    }
    return res.json()
}