import { getSitiosByCategoria, Sitio } from "@/src/lib/api";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from 'react-native-maps';
import CLEAN_STYLE from '../../assets/map-style-clean.json';

export default function Mapa() {
  const { nombre, catId } = useLocalSearchParams<{ nombre?: string, catId: string }>();
  const categoriaId = Number(catId);
  const [sitios, setSitios] = useState<Sitio[]>([]);
  const [selectedSitio, setSelectedSitio] = useState<Sitio | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%', '75%', '90%'], []);

  const initialRegion = useMemo(() => ({
    latitude: 24.022,
    longitude: -104.653,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
  }), []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getSitiosByCategoria(categoriaId);
        if (!mounted) return;
        setSitios(data);
        if (data.length > 0 && mapRef.current) {
          const coords = data.map(s => ({
            latitude: s.latitude as number,
            longitude: s.longitude as number
          }));
          mapRef.current.fitToCoordinates(coords, {
            edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
            animated: true
          });
        }
      } catch (error) {
        console.log("Error al mostrar los sitios");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [categoriaId]);

  const handleMarkerPress = (sitio: Sitio) => {
    setSelectedSitio(sitio);
    bottomSheetRef.current?.expand();
  };

  const handleCallPress = (telefono: string) => {
    const phoneNumber = `tel:${telefono.replace(/\s/g, '')}`;
    Linking.openURL(phoneNumber);
  };

  const formatImageUrl = (imgPath: string) => {
    if (imgPath.includes('http')) return imgPath;
    if (imgPath.includes('cloudinary')) return `https://res.cloudinary.com/${imgPath}`;
    return `https://res.cloudinary.com/${imgPath}`;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: nombre ? String(nombre) : "Mapa" }} />
      
      <MapView
        customMapStyle={CLEAN_STYLE}
        style={styles.map}
        initialRegion={initialRegion}
        ref={mapRef}
        showsPointsOfInterest={false}
        showsBuildings={false}
      >
        {sitios.map(s => (
          <Marker
            key={s.id}
            coordinate={{
              latitude: s.latitude as number,
              longitude: s.longitude as number
            }}
            title={s.nombre}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => handleMarkerPress(s)}
          >
            <MaterialCommunityIcons name="map-marker" size={36} color="#0d0575ff" />
          </Marker>
        ))}
      </MapView>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={-1}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          {selectedSitio ? (
            <View style={styles.contactCard}>
              {/* Imagen */}
              {selectedSitio.img && selectedSitio.img !== 'dgby3/image/upload/v1758302223/404_oploov.avif' ? (
                <Image 
                  source={{ uri: formatImageUrl(selectedSitio.img) }} 
                  style={styles.contactImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="business" size={40} color="#666" />
                </View>
              )}

              {/* Nombre */}
              <Text style={styles.contactName}>{selectedSitio.nombre}</Text>

              {/* Teléfono */}
              {selectedSitio.telefono && (
                <TouchableOpacity 
                  style={styles.contactField}
                  onPress={() => handleCallPress(selectedSitio.telefono!)}
                >
                  <FontAwesome5 name="phone" size={16} color="#0d0575ff" />
                  <Text style={styles.contactText}>{selectedSitio.telefono}</Text>
                  <MaterialCommunityIcons name="phone-outgoing" size={16} color="#0d0575ff" />
                </TouchableOpacity>
              )}

              {/* Dirección completa */}
              <View style={styles.addressSection}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#0d0575ff" />
                <View style={styles.addressText}>
                  {selectedSitio.calle && (
                    <Text style={styles.addressLine}>{selectedSitio.calle}</Text>
                  )}
                  {selectedSitio.fraccionamiento && (
                    <Text style={styles.addressLine}>{selectedSitio.fraccionamiento}</Text>
                  )}
                  <Text style={styles.addressLine}>
                    {selectedSitio.municipio}, {selectedSitio.estado}
                    {selectedSitio.cp && `, C.P. ${selectedSitio.cp}`}
                  </Text>
                </View>
              </View>

              {/* Estado/Municipio en línea separada */}
              <View style={styles.locationInfo}>
                <View style={styles.locationItem}>
                  <Text style={styles.locationLabel}>Estado:</Text>
                  <Text style={styles.locationValue}>{selectedSitio.estado}</Text>
                </View>
                <View style={styles.locationItem}>
                  <Text style={styles.locationLabel}>Municipio:</Text>
                  <Text style={styles.locationValue}>{selectedSitio.municipio}</Text>
                </View>
                {selectedSitio.cp && (
                  <View style={styles.locationItem}>
                    <Text style={styles.locationLabel}>C.P.:</Text>
                    <Text style={styles.locationValue}>{selectedSitio.cp}</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.placeholder}>
              <MaterialCommunityIcons name="map-marker-question" size={48} color="#ccc" />
              <Text style={styles.placeholderText}>Selecciona un marcador para ver la información de contacto</Text>
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative'
  },
  map: {
    width: "100%",
    height: "100%"
  },
  bottomSheetBackground: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
  },
  bottomSheetContent: {
    padding: 16,
  },
  contactCard: {
    gap: 16,
  },
  contactImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  placeholderImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0d0575ff',
    textAlign: 'center',
  },
  contactField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0d0575ff',
  },
  contactText: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  addressText: {
    flex: 1,
    gap: 4,
  },
  addressLine: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  locationInfo: {
    gap: 8,
    padding: 12,
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  locationValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});