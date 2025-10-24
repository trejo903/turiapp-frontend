// app/mapa/mapa.tsx
import { addFavorito, getFavoritosIds, getSitiosByCategoria, removeFavorito, Sitio } from "@/src/lib/api";
import { ANARANJADOS_CIMA_KML, KMLRoute, parseKML } from '@/src/lib/kmlParser';
import { useAuth } from "@/src/state/auth";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as Location from "expo-location";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
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
    const t = setTimeout(() => setTracks(false), 300);
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

//  Marker para el camión en la ruta
const TruckMarker = React.memo(function TruckMarker({
  coordinate,
  onPress,
}: {
  coordinate: { latitude: number; longitude: number };
  onPress: () => void;
}) {
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTracks(false), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <Marker
      coordinate={coordinate}
      title="Ruta Anaranjados CIMA"
      description="Camión en ruta"
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={onPress}
      tracksViewChanges={tracks}
    >
      <MaterialCommunityIcons name="truck" size={32} color="#F9A825" />
    </Marker>
  );
}); 

type TravelMode = 'DRIVING' | 'WALKING';

export default function Mapa() {
  const { user, token } = useAuth(); // user?.id
const userId = user?.id ?? null;

useEffect(() => {
  let mounted = true;
  (async () => {
    try {
      if (!userId) return; // no logueado
      const ids = await getFavoritosIds(userId, token!);
      if (!mounted) return;
      setFavIds(new Set(ids));
    } catch (e) {
      console.log('No se pudieron cargar favoritos', e);
    }
  })();
  return () => { mounted = false; };
}, [userId, token]);




const [favIds, setFavIds] = useState<Set<number>>(new Set()); // ids de sitios favoritos
const isFav = useCallback((sitioId: number) => favIds.has(sitioId), [favIds]);

  const { nombre, catId } = useLocalSearchParams<{ nombre?: string, catId: string }>();
  const categoriaId = Number(catId);
  const [sitios, setSitios] = useState<Sitio[]>([]);
  const [selectedSitio, setSelectedSitio] = useState<Sitio | null>(null);
  const [loading, setLoading] = useState(true);

  // Ubicación del usuario
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Ruta KML y estado del camión
  const [kmlRoute, setKmlRoute] = useState<KMLRoute | null>(null);
  const [truckPosition, setTruckPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showRoute, setShowRoute] = useState(true);

  // Modo de viaje para la ruta interna
  const [travelMode, setTravelMode] = useState<TravelMode>('DRIVING');

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const truckAnimationRef = useRef<NodeJS.Timeout | null>(null);

  const snapPoints = useMemo(() => ['40%', '75%', '90%'], []);
  const initialRegion = useMemo(() => ({
    latitude: 24.022,
    longitude: -104.653,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
  }), []);
const toggleFavorito = useCallback(async (sitio: Sitio) => {
  if (!userId) {
    Alert.alert('Favoritos', 'Inicia sesión para guardar lugares.');
    return;
  }
  const id = Number(sitio.id);
  const wasFav = favIds.has(id);

  // Optimista
  setFavIds(prev => {
    const next = new Set(prev);
    wasFav ? next.delete(id) : next.add(id);
    return next;
  });

  try {
    if (wasFav) {
      await removeFavorito(userId, id, token!);
    } else {
      await addFavorito(userId, id, token!);
    }
  } catch (e) {
    // Revertir si falla
    setFavIds(prev => {
      const next = new Set(prev);
      wasFav ? next.add(id) : next.delete(id);
      return next;
    });
    Alert.alert('Favoritos', wasFav ? 'No se pudo quitar de favoritos.' : 'No se pudo guardar en favoritos.');
  }
}, [userId, token, favIds]);

  // Cargar ruta KML al montar el componente
  useEffect(() => {
    const route = parseKML(ANARANJADOS_CIMA_KML);
    setKmlRoute(route);
    
    // Posicionar camión en el primer punto de la ruta
    if (route && route.coordinates.length > 0) {
      const firstCoord = route.coordinates[0];
      setTruckPosition({ latitude: firstCoord.latitude, longitude: firstCoord.longitude });
    }
  }, []);

  /** Animación del camión a lo largo de la ruta
  useEffect(() => {
    if (!kmlRoute || !showRoute) return;

    let currentIndex = 0;
    const coordinates = kmlRoute.coordinates;

    const animateTruck = () => {
      if (currentIndex < coordinates.length - 1) {
        currentIndex++;
        setTruckPosition({
          latitude: coordinates[currentIndex].latitude,
          longitude: coordinates[currentIndex].longitude
        });
        
        truckAnimationRef.current = setTimeout(animateTruck, 2000); // Mover cada 2 segundos
      } else {
        // Reiniciar animación cuando llega al final
        currentIndex = 0;
        setTruckPosition({
          latitude: coordinates[0].latitude,
          longitude: coordinates[0].longitude
        });
        truckAnimationRef.current = setTimeout(animateTruck, 2000);
      }
    };

    truckAnimationRef.current = setTimeout(animateTruck, 2000);

    return () => {
      if (truckAnimationRef.current) {
        clearTimeout(truckAnimationRef.current);
      }
    };
  }, [kmlRoute, showRoute]); */

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

      // Ajustar región para incluir ruta KML si existe
      if (kmlRoute && kmlRoute.coordinates.length > 0) {
        const allCoords = [
          ...kmlRoute.coordinates.map(c => ({ latitude: c.latitude, longitude: c.longitude })),
          cur
        ];
        mapRef.current?.fitToCoordinates(allCoords, {
          edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
          animated: true
        });
      } else {
        mapRef.current?.animateToRegion({ ...cur, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 600);
      }

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
      if (truckAnimationRef.current) {
        clearTimeout(truckAnimationRef.current);
      }
    };
  }, [kmlRoute]);

  // Cargar sitios por categoría
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getSitiosByCategoria(categoriaId);
        if (!mounted) return;
        setSitios(data);

        console.log('Sitios cargados con categoría:', data);
        if (data.length > 0 && mapRef.current) {
          console.log('Primer sitio - tiene categoría?:', data[0].categoria);
          console.log('Es reservable?:', data[0].categoria?.reservable);
          const coords = data.map(s => ({ latitude: s.latitude as number, longitude: s.longitude as number }));
          if (userLocation) coords.push(userLocation);
          
          // Incluir coordenadas de la ruta KML si existe
          if (kmlRoute) {
            coords.push(...kmlRoute.coordinates.map(c => ({ latitude: c.latitude, longitude: c.longitude })));
          }
          
          mapRef.current.fitToCoordinates(coords, { 
            edgePadding: { top: 80, right: 40, bottom: 40, left: 40 }, 
            animated: true 
          });
        }
      } catch {
        console.log("Error al mostrar los sitios");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [categoriaId, kmlRoute]);

  const handleMarkerPress = useCallback((sitio: Sitio) => {
    setSelectedSitio(sitio);
    bottomSheetRef.current?.expand();
  }, []);

  const handleTruckPress = useCallback(() => {
    Alert.alert(
      "Ruta Anaranjados CIMA",
      "Ruta de camión en servicio. Toca para centrar en la ruta.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Centrar en ruta", 
          onPress: () => {
            if (kmlRoute && mapRef.current) {
              mapRef.current.fitToCoordinates(
                kmlRoute.coordinates.map(c => ({ latitude: c.latitude, longitude: c.longitude })),
                { edgePadding: { top: 80, right: 40, bottom: 40, left: 40 }, animated: true }
              );
            }
          }
        }
      ]
    );
  }, [kmlRoute]);

  const handleCallPress = (telefono: string) => {
    const phoneNumber = `tel:${telefono.replace(/\s/g, '')}`;
    Linking.openURL(phoneNumber);
  };

  const formatImageUrl = (imgPath?: string | null) => {
    if (!imgPath) return null;
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
    return `https://res.cloudinary.com/${imgPath}`;
  };

  const recenterOnUser = () => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({ ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
  };

  const toggleRoute = () => {
    setShowRoute(!showRoute);
  };

  // ======= DIRECCIONES EXTERNAS =======
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

        {/* Ruta KML */}
        {showRoute && kmlRoute && (
          <Polyline
            coordinates={kmlRoute.coordinates}
            strokeColor="#F9A825"
            strokeWidth={4}
            lineDashPattern={[1, 0]} // Línea sólida
          />
        )}

        {/* Marcador del camión */}
        {/* {showRoute && truckPosition && (
          <TruckMarker coordinate={truckPosition} onPress={handleTruckPress} />
        )} */}

        {userLocation && (
          <Marker coordinate={userLocation} title="Tú estás aquí" tracksViewChanges>
            <MaterialCommunityIcons name="crosshairs-gps" size={30} />
          </Marker>
        )}

        {/* Ruta interna a sitios seleccionados */}
        {userLocation && selectedSitio && (
          <MapViewDirections
            origin={userLocation}
            destination={{ latitude: Number(selectedSitio.latitude), longitude: Number(selectedSitio.longitude) }}
            mode={travelMode}
            apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
            strokeWidth={4}
            onReady={onDirectionsReady}
            onError={(e) => console.log('Directions error', e)}
            resetOnChange={false}
          />
        )}
      </MapView>

      {/* FABs */}
      <TouchableOpacity style={styles.fab} onPress={recenterOnUser}>
        <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.fab, styles.fabRoute]} onPress={toggleRoute}>
        <MaterialCommunityIcons 
          name={showRoute ? "eye-off" : "eye"} 
          size={22} 
          color="#fff" 
        />
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

                  {/* ✅ NUEVO: Guardar/Quitar favorito */}
  <TouchableOpacity
    style={[styles.favButton, isFav(selectedSitio.id) && styles.favButtonActive]}
    onPress={() => toggleFavorito(selectedSitio)}
  >
    <MaterialCommunityIcons
      name={isFav(selectedSitio.id) ? "heart" : "heart-outline"}
      size={18}
      color={isFav(selectedSitio.id) ? "#fff" : "#0d0575ff"}
    />
    <Text style={[styles.favText, isFav(selectedSitio.id) && styles.favTextActive]}>
      {isFav(selectedSitio.id) ? "Quitar de favoritos" : "Guardar lugar"}
    </Text>
  </TouchableOpacity>
                </View>

                {/* En mapa.tsx, actualiza el Link del botón de reserva: */}
                {selectedSitio.categoria?.reservable && (
                  <Link
                    href={{
                      pathname: selectedSitio.categoria.nombre.toLowerCase().includes('hotel')
                        ? "/categorias/reserva-hotel"
                        : "/categorias/reserva",
                      params: { sitioId: selectedSitio.id.toString() }
                    }}
                    asChild
                  >
                    <TouchableOpacity style={styles.reservaButton}>
                      <MaterialCommunityIcons name="calendar-check" size={18} color="#fff" />
                      <Text style={styles.reservaText}>
                        {selectedSitio.categoria.nombre.toLowerCase().includes('hotel')
                          ? "Reservar Hotel"
                          : "Reservar Mesa"}
                      </Text>
                    </TouchableOpacity>
                  </Link>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.placeholder}>
              <MaterialCommunityIcons name="map-marker-question" size={48} color="#ccc" />
              <Text style={styles.placeholderText}>Selecciona un marcador para ver la información y la ruta</Text>
              {kmlRoute && (
                <View style={styles.routeInfo}>
                  <MaterialCommunityIcons name="truck" size={24} color="#F9A825" />
                  <Text style={styles.routeInfoText}>Ruta activa: {kmlRoute.name}</Text>
                </View>
              )}
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

  fabRoute: {
    bottom: 180,
    backgroundColor: '#F9A825',
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

  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    marginTop: 8
  },
  routeInfoText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500'
  },

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
  reservaButton: {
  flex: 1,
  backgroundColor: "#007AFF",
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 8,
  marginTop: 8
},
reservaText: { 
  color: "#fff", 
  fontSize: 16, 
  fontWeight: "600" 
},

favButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#0d0575ff',
  borderRadius: 8,
  paddingVertical: 12,
  marginTop: 8,
},
favButtonActive: {
  backgroundColor: '#0d0575ff',
  borderColor: '#0d0575ff',
},
favText: { color: '#0d0575ff', fontSize: 16, fontWeight: '600' },
favTextActive: { color: '#fff' },


});