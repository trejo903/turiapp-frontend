import { getSitiosByCategoria, Sitio } from "@/src/lib/api";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { View , Text,StyleSheet, Image} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView,{Marker} from 'react-native-maps'
import CLEAN_STYLE from '../../assets/map-style-clean.json';

export default function Mapa(){
    const {nombre,catId} = useLocalSearchParams<{nombre?:string,catId:string}>();
    const categoriaId = Number(catId)
    const [sitios,setSitios] = useState<Sitio[]>([]);
    const [loading,setLoading] = useState(true)
    const mapRef = useRef<MapView>(null)


    const initialRegion=useMemo(()=>({
        latitude:24.022,
        longitude:-104.653,
        latitudeDelta:0.05,
        longitudeDelta:0.05
    }),[])

    useEffect(()=>{
        let mounted = true;
        (async()=>{
            try {
                setLoading(true)
                const data = await getSitiosByCategoria(categoriaId)
                if(!mounted) return
                setSitios(data)
                if(data.length>0 && mapRef.current){
                    const coords = data.map(s=>({
                        latitude:s.latitude as number,
                        longitude:s.longitude as number
                    }));
                    mapRef.current.fitToCoordinates(coords,{
                        edgePadding:{top:80,right:40,bottom:40,left:40},
                        animated:true
                    })
                }
            } catch (error) {
                console.log("Error al mostrar los sitios")
            }finally{
                if(mounted) setLoading(false)
            }
        })()
        return ()=>{
            mounted = false
        }
    },[categoriaId])
    return(
        <View style={styles.container}>
            <Stack.Screen options={{title: nombre ? String(nombre): "Mapa"}}/>
            <MapView
                customMapStyle={CLEAN_STYLE} 
                style={styles.map}
                initialRegion={initialRegion}
                ref={mapRef}
                showsPointsOfInterest={false} 
                showsBuildings={false}   
            >
            {sitios.map(s=>(
                <Marker
                key={s.id}
                coordinate={{latitude:s.latitude as number,longitude:s.longitude as number}}
                title={s.nombre}
                anchor={{x:0.5,y:1}}
                
                >
                    <MaterialCommunityIcons name="map-marker" size={36} color="#0d0575ff" />
                </Marker>
            ))}
            
            </MapView>
        </View>
    )
}

const styles= StyleSheet.create({
    container:{flex:1},
    map:{width:"100%",height:"100%"}
})