// app/mapa/mapa.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSitiosByCategoria, Sitio } from "@/src/lib/api";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Link, Stack, useLocalSearchParams } from "expo-router";
import {
  Alert,
  ActionSheetIOS,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from "expo-location";
import CLEAN_STYLE from '../../assets/map-style-clean.json';

// ===== Helpers anti-flicker =====
const movedEnough = (
  a: { latitude: number; longitude: number } | null,
  b: { latitude: number; longitude: number }
) => {
  if (!a) return true;
  const dLat = a.latitude - b.latitude;
  const dLon = a.longitude - b.longitude;
  const meters = Math.sqrt(dLat * dLat + dLon * dLon) * 111_139;
  return meters > 3;
};

// Marker memorizado para sitios con "warm-up" de tracksViewChanges
const SiteMarker = React.memo(function SiteMarker({
  sitio,
  onPress,
}: {
  sitio: Sitio;
  onPress: (s: Sitio) => void;
}) {
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTracks(false), 300); // tras primer render se apaga
    return () => clearTimeout(t);
  }, []);

  return (
    <Marker
      coordinate={{ latitude: sitio.latitude as number, longitude: sitio.longitude as number }}
      title={sitio.nombre}
      anchor={{ x: 0.5, y: 1 }}
      onPress={() => onPress(sitio)}
      tracksViewChanges={tracks}
    >
      <MaterialCommunityIcons name="map-marker" size={36} color="#0d0575ff" />
    </Marker>
  );
});

type TravelMode = 'DRIVING' | 'WALKING';

export default function Mapa() {
  const { nombre, catId } = useLocalSearchParams<{ nombre?: string, catId: string }>();
  const categoriaId = Number(catId);
  const [sitios, setSitios] = useState<Sitio[]>([]);
  const [selectedSitio, setSelectedSitio] = useState<Sitio | null>(null);
  const [loading, setLoading] = useState(true);

  // Ubicación del usuario
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Modo de viaje para la ruta interna
  const [travelMode, setTravelMode] = useState<TravelMode>('DRIVING');

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  const snapPoints = useMemo(() => ['40%', '75%', '90%'], []);
  const initialRegion = useMemo(() => ({
    latitude: 24.022,
    longitude: -104.653,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
  }), []);

  // Permisos + ubicación actual + watcher
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Ubicación", "Sin permiso de ubicación. Puedes activarlo en Ajustes.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!mounted) return;

      const cur = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setUserLocation(cur);

      mapRef.current?.animateToRegion({ ...cur, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 600);

      locationSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 4000, distanceInterval: 5 },
        (loc) => {
          const u = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserLocation(prev => (movedEnough(prev, u) ? u : prev));
        }
      );
    })();

    return () => {
      mounted = false;
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    };
  }, []);

  // Cargar sitios por categoría (una sola vez por categoría)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getSitiosByCategoria(categoriaId);
        if (!mounted) return;
        setSitios(data);

        if (data.length > 0 && mapRef.current) {
          const coords = data.map(s => ({ latitude: s.latitude as number, longitude: s.longitude as number }));
          if (userLocation) coords.push(userLocation);
          mapRef.current.fitToCoordinates(coords, { edgePadding: { top: 80, right: 40, bottom: 40, left: 40 }, animated: true });
        }
      } catch {
        console.log("Error al mostrar los sitios");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [categoriaId]); // no dependas de userLocation para evitar re-fit continuo

  // handler de marker estable (no cambia identidad entre renders)
  const handleMarkerPress = useCallback((sitio: Sitio) => {
    setSelectedSitio(sitio);
    bottomSheetRef.current?.expand();
  }, []);

  const handleCallPress = (telefono: string) => {
    const phoneNumber = `tel:${telefono.replace(/\s/g, '')}`;
    Linking.openURL(phoneNumber);
  };

  // Normaliza la URL de imagen
  const formatImageUrl = (imgPath?: string | null) => {
    if (!imgPath) return null;
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
    return `https://res.cloudinary.com/${imgPath}`;
  };

  const recenterOnUser = () => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({ ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
  };

  // ======= DIRECCIONES EXTERNAS (fallback) =======
  const openDirectionsExternal = async (destLat: number, destLng: number, mode: 'driving' | 'walking' = 'driving') => {
    const origin = userLocation ? `${userLocation.latitude},${userLocation.longitude}` : null;
    const googleApp = `comgooglemaps://?${origin ? `saddr=${origin}&` : ''}daddr=${destLat},${destLng}&directionsmode=${mode}`;
    const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}${origin ? `&origin=${origin}` : ''}&travelmode=${mode}`;
    const appleApp = `maps://?${origin ? `saddr=${origin}&` : ''}daddr=${destLat},${destLng}&dirflg=${mode === 'walking' ? 'w' : 'd'}`;
    const appleWeb = `http://maps.apple.com/?${origin ? `saddr=${origin}&` : ''}daddr=${destLat},${destLng}&dirflg=${mode === 'walking' ? 'w' : 'd'}`;

    if (Platform.OS === 'ios') {
      const canApple = await Linking.canOpenURL('maps://');
      if (canApple) return Linking.openURL(appleApp);
      const canGoogle = await Linking.canOpenURL('comgooglemaps://');
      if (canGoogle) return Linking.openURL(googleApp);
      return Linking.openURL(appleWeb);
    } else {
      const canGoogle = await Linking.canOpenURL('comgooglemaps://');
      if (canGoogle) return Linking.openURL(googleApp);
      return Linking.openURL(googleWeb);
    }
  };

  const handleDirectionsPressExternal = (sitio: Sitio) => {
    const destLat = Number(sitio.latitude);
    const destLng = Number(sitio.longitude);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: 'Abrir en mapas', options: ['Cancelar', 'En carro', 'Caminando'], cancelButtonIndex: 0 },
        (i) => { if (i === 1) openDirectionsExternal(destLat, destLng, 'driving'); if (i === 2) openDirectionsExternal(destLat, destLng, 'walking'); }
      );
    } else {
      Alert.alert('Abrir en mapas', 'Elige un modo de viaje', [
        { text: 'Caminando', onPress: () => openDirectionsExternal(destLat, destLng, 'walking') },
        { text: 'En carro', onPress: () => openDirectionsExternal(destLat, destLng, 'driving') },
        { text: 'Cancelar', style: 'cancel' }
      ]);
    }
  };

  // Ajusta cámara a la polilínea
  const onDirectionsReady = (result: { coordinates: { latitude: number; longitude: number }[] }) => {
    if (!mapRef.current) return;
    if (result?.coordinates?.length) {
      mapRef.current.fitToCoordinates(result.coordinates, {
        edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    }
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
        showsUserLocation
        showsMyLocationButton
      >
        {sitios.map(s => (
          <SiteMarker key={s.id} sitio={s} onPress={handleMarkerPress} />
        ))}

        {userLocation && (
          <Marker coordinate={userLocation} title="Tú estás aquí" tracksViewChanges>
            <MaterialCommunityIcons name="crosshairs-gps" size={30} />
          </Marker>
        )}

        {/* Ruta interna */}
        {userLocation && selectedSitio && (
          <MapViewDirections
            origin={userLocation}
            destination={{ latitude: Number(selectedSitio.latitude), longitude: Number(selectedSitio.longitude) }}
            mode={travelMode}
            apikey={"AIzaSyCyOStS0RVh1xJ2kX0N-l3ejlA_Hym1-1k"}
            strokeWidth={4}
            onReady={onDirectionsReady}
            onError={(e) => console.log('Directions error', e)}
            resetOnChange={false}
          />
        )}
      </MapView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={recenterOnUser}>
        <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#fff" />
      </TouchableOpacity>

      {/* BottomSheet */}
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
              {(() => {
                const uri = formatImageUrl(selectedSitio.img);
                return uri ? (
                  <Image source={{ uri }} style={styles.contactImage} resizeMode="cover" />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="business" size={40} color="#666" />
                  </View>
                );
              })()}

              {/* Nombre */}
              <Text style={styles.contactName}>{selectedSitio.nombre}</Text>

              {/* Teléfono */}
              {selectedSitio.telefono && (
                <TouchableOpacity style={styles.contactField} onPress={() => handleCallPress(selectedSitio.telefono!)}>
                  <FontAwesome5 name="phone" size={16} color="#0d0575ff" />
                  <Text style={styles.contactText}>{selectedSitio.telefono}</Text>
                  <MaterialCommunityIcons name="phone-outgoing" size={16} color="#0d0575ff" />
                </TouchableOpacity>
              )}

              {/* Dirección */}
              <View style={styles.addressSection}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#0d0575ff" />
                <View style={styles.addressText}>
                  {selectedSitio.calle && <Text style={styles.addressLine}>{selectedSitio.calle}</Text>}
                  {selectedSitio.fraccionamiento && <Text style={styles.addressLine}>{selectedSitio.fraccionamiento}</Text>}
                  <Text style={styles.addressLine}>
                    {selectedSitio.municipio}, {selectedSitio.estado}
                    {selectedSitio.cp && `, C.P. ${selectedSitio.cp}`}
                  </Text>
                </View>
              </View>

              {/* Estado/Municipio/CP */}
              <View style={styles.locationInfo}>
                <View style={styles.locationItem}><Text style={styles.locationLabel}>Estado:</Text><Text style={styles.locationValue}>{selectedSitio.estado}</Text></View>
                <View style={styles.locationItem}><Text style={styles.locationLabel}>Municipio:</Text><Text style={styles.locationValue}>{selectedSitio.municipio}</Text></View>
                {selectedSitio.cp && (<View style={styles.locationItem}><Text style={styles.locationLabel}>C.P.:</Text><Text style={styles.locationValue}>{selectedSitio.cp}</Text></View>)}
              </View>

              {/* Acciones */}
              <View style={styles.actionsRowWrap}>
                <View style={styles.modeRow}>
                  <TouchableOpacity
                    style={[styles.modeBtn, travelMode === 'DRIVING' && styles.modeBtnActive]}
                    onPress={() => setTravelMode('DRIVING')}
                  >
                    <MaterialCommunityIcons name="car" size={16} color={travelMode === 'DRIVING' ? '#fff' : '#0d0575ff'} />
                    <Text style={[styles.modeText, travelMode === 'DRIVING' && styles.modeTextActive]}>En carro</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeBtn, travelMode === 'WALKING' && styles.modeBtnActive]}
                    onPress={() => setTravelMode('WALKING')}
                  >
                    <MaterialCommunityIcons name="walk" size={16} color={travelMode === 'WALKING' ? '#fff' : '#0d0575ff'} />
                    <Text style={[styles.modeText, travelMode === 'WALKING' && styles.modeTextActive]}>Caminando</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.actionsRow}>
                  <Link href={`/sitios/${selectedSitio.id}`} asChild>
                    <TouchableOpacity style={styles.moreInfoButton}>
                      <Text style={styles.moreInfoText}>Más información</Text>
                    </TouchableOpacity>
                  </Link>

                  <TouchableOpacity style={styles.dirButton} onPress={() => handleDirectionsPressExternal(selectedSitio)}>
                    <MaterialCommunityIcons name="navigation" size={18} color="#fff" />
                    <Text style={styles.dirText}>Abrir en mapas</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.placeholder}>
              <MaterialCommunityIcons name="map-marker-question" size={48} color="#ccc" />
              <Text style={styles.placeholderText}>Selecciona un marcador para ver la información y la ruta</Text>
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  map: { width: "100%", height: "100%" },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    backgroundColor: '#0d0575ff',
    borderRadius: 24,
    padding: 12,
    elevation: 4
  },

  bottomSheetBackground: { backgroundColor: '#ffffff', borderRadius: 20 },
  bottomSheetContent: { padding: 16 },

  contactCard: { gap: 16 },
  contactImage: { width: '100%', height: 150, borderRadius: 12 },
  placeholderImage: {
    width: '100%', height: 100, backgroundColor: '#f5f5f5',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center'
  },
  contactName: { fontSize: 24, fontWeight: 'bold', color: '#0d0575ff', textAlign: 'center' },
  contactField: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8,
    borderLeftWidth: 4, borderLeftColor: '#0d0575ff'
  },
  contactText: { fontSize: 16, flex: 1, color: '#333' },

  addressSection: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8
  },
  addressText: { flex: 1, gap: 4 },
  addressLine: { fontSize: 14, color: '#333', lineHeight: 18 },

  locationInfo: { gap: 8, padding: 12, backgroundColor: '#f0f2f5', borderRadius: 8 },
  locationItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationLabel: { fontSize: 14, fontWeight: '600', color: '#666' },
  locationValue: { fontSize: 14, color: '#333', fontWeight: '500' },

  placeholder: { alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 },
  placeholderText: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 22 },

  actionsRowWrap: { gap: 10 },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#0d0575ff',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fff'
  },
  modeBtnActive: { backgroundColor: '#0d0575ff', borderColor: '#0d0575ff' },
  modeText: { color: '#0d0575ff', fontWeight: '600' },
  modeTextActive: { color: '#fff' },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  moreInfoButton: {
    flex: 1,
    backgroundColor: "#0d0575ff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  moreInfoText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  dirButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  dirText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
