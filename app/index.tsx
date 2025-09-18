import { getCategorias } from "@/src/lib/api";
import { Link, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList,Text, TouchableOpacity, View } from "react-native";

type Categoria = {
  id:number | string
  nombre:string
}

export default function Index() {
  const[data,setData]=useState<Categoria[]>([])
  const[loading, setLoading]=useState(true)
  const[error,setError]=useState<string | null>(null)

  useEffect(()=>{
    (async()=>{
      try {
        const json = await getCategorias();
        setData(Array.isArray(json)?json:json.data)
      } catch (error:any) {
        setError(error.message ?? "Error al cargar las categorias")
      }finally{
        setLoading(false)
      }
    })();
  },[])

  if(loading){
    return(
      <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
        <ActivityIndicator/>
        <Text>Cargando categorias.........</Text>
      </View>
    )
  }

  if(error){
    return(
      <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
        <Text>Error: {error}</Text>
      </View>
    )
  }


  return (
    <View
      style={{
        flex: 1,
        paddingTop:60
      }}
    >
      <Stack.Screen options={{title:"TuriApp"}}/>
      <Text style={{fontSize:20,textAlign:"center",marginBottom:12}}>Lugares por conocer</Text>

      <FlatList
        data={data}
        keyExtractor={(item)=>String(item.id)}
        renderItem={({item})=>(
          <Link
            href={{
              pathname:"/mapa/mapa",
              params:{catId:String(item.id),nombre:item.nombre}
            }}
            asChild
          >
              <TouchableOpacity
                style={{padding:14,borderBottomWidth:1,borderColor:"#eee"}}
              >
                <Text>{item.nombre}</Text>
                <Text>{item.id}</Text>
                <Text>Ver en el mapa</Text>
              </TouchableOpacity>

          </Link>
        )}
        ListEmptyComponent={<Text>Sin datos</Text>}
      />


    </View>
  );
}
