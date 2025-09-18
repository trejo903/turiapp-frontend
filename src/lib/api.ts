

const BASE_URL = "http://192.168.1.6:5001"

export async function getCategorias() {
    const res = await fetch(`${BASE_URL}/categorias`)
    if(!res.ok){
        throw new Error(`HTTP ${res.status}`)
    }
    return res.json()
}