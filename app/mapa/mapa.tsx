import { View , Text,StyleSheet} from "react-native";
import MapView,{Marker} from 'react-native-maps'

export default function Mapa(){
    const initialRegion={
        latitude:24.022,
        longitude:-104.653,
        latitudeDelta:0.05,
        longitudeDelta:0.05
    }
    return(
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={initialRegion}
            >
            <Marker
                coordinate={{latitude:initialRegion.latitude,longitude:initialRegion.longitude}}
                title="Aqui"
                description="Mi punto inicial" 
            />
            </MapView>
        </View>
    )
}

const styles= StyleSheet.create({
    container:{flex:1},
    map:{width:"100%",height:"100%"}
})