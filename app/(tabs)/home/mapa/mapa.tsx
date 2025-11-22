// app/mapa/mapa.tsx
import {
  addFavorito,
  getFavoritosIds,
  getSitioById,
  getSitiosByCategoria,
  removeFavorito,
  Sitio,
} from "@/src/lib/api";
import { ANARANJADOS_CIMA_KML, KMLRoute, parseKML } from "@/src/lib/kmlParser";
import { useAuth } from "@/src/state/auth";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import CLEAN_STYLE from "../../../../assets/map-style-clean.json";
import Categoriafiltro from "./categoriaFiltro";

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

// ===== Helper para formatear ETA =====
const formatEta = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  } else if (minutes < 1440) { // menos de 24 horas
    const hours = minutes / 60;
    return `${hours.toFixed(1)} h`;
  } else {
    const days = minutes / 1440; // 1440 minutos en un día
    return `${days.toFixed(1)} día${days >= 2 ? 's' : ''}`;
  }
};

// Marker memorizado
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
      coordinate={{
        latitude: sitio.latitude as number,
        longitude: sitio.longitude as number,
      }}
      title={sitio.nombre}
      anchor={{ x: 0.5, y: 1 }}
      onPress={() => onPress(sitio)}
      tracksViewChanges={tracks}
    >
      <MaterialCommunityIcons name="map-marker" size={36} color="#0d0575ff" />
    </Marker>
  );
});

type TravelMode = "DRIVING" | "WALKING";

export default function Mapa() {
  const { user, token } = useAuth();
  const userId = user?.id ?? null;
  const lastFittedCategoryRef = useRef<number | null>(null);

  // Ahora también recibimos estado y municipio
  const {
    id,
    nombre,
    latitude,
    longitude,
    catId,
    sitioId,
    estado,
    municipio,
  } = useLocalSearchParams<{
    id?: string;
    nombre?: string;
    latitude?: string;
    longitude?: string;
    catId?: string;
    sitioId?: string;
    estado?: string;
    municipio?: string;
  }>();

  const selectedEstado = estado ? String(estado) : undefined;
  const selectedMunicipio = municipio ? String(municipio) : undefined;

  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const isFav = useCallback(
    (sitioId: number) => favIds.has(sitioId),
    [favIds]
  );

  const categoriaIdInicial = Number(catId);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [cargandoSitios, setCargandoSitios] = useState(false);
  const [sitios, setSitios] = useState<Sitio[]>([]);
  const [selectedSitio, setSelectedSitio] = useState<Sitio | null>(null);
  const [loading, setLoading] = useState(true);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [kmlRoute, setKmlRoute] = useState<KMLRoute | null>(null);
  const [showRoute, setShowRoute] = useState(true);
  const [travelMode, setTravelMode] = useState<TravelMode>("DRIVING");

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  const snapPoints = useMemo(() => ["40%", "75%", "80%"], []);
  const initialRegion = useMemo(
    () => ({
      latitude: 24.022,
      longitude: -104.653,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }),
    []
  );

  const [eta, setEta] = useState<number | null>(null);
  const [directionsError, setDirectionsError] = useState<string | null>(null);

  // Favoritos
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!userId) return;
        const ids = await getFavoritosIds(userId, token!);
        if (!mounted) return;
        setFavIds(new Set(ids));
      } catch (e) {
        console.log("No se pudieron cargar favoritos", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId, token]);

  // Sitio específico desde Recomendaciones
  useEffect(() => {
  const fetchSitioFromRecomendaciones = async () => {
    try {
      if (!sitioId) return;

      const sitio = await getSitioById(Number(sitioId));
      if (!sitio) return;

      // 1️⃣ Seleccionar categoría del sitio antes de centrar
      if (sitio.categoria?.id) {
        setCategoriaActiva(sitio.categoria.id);
        
      }

      // 2️⃣ Abrir bottomSheet del sitio seleccionado
      openSheet(sitio);

      // 3️⃣ Centrar el mapa en ese sitio
      if (mapRef.current && sitio.latitude && sitio.longitude) {
        mapRef.current.animateToRegion(
          {
            latitude: Number(sitio.latitude),
            longitude: Number(sitio.longitude),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          800
        );
      }

    } catch (e) {
      console.error("❌ Error cargando sitio desde BD:", e);
    }
  };

  fetchSitioFromRecomendaciones();
}, [sitioId]);

  // Manejar parámetros legacy (lat/long directo)
  useEffect(() => {
    if (latitude && longitude && mapRef.current && !sitioId) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      mapRef.current.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );

      if (nombre && !selectedSitio) {
        const tempSitio: Sitio = {
          id: Number(id) || 0,
          nombre: nombre,
          latitude: lat,
          longitude: lng,
          estado: "",
          municipio: "",
          calle: "",
          fraccionamiento: "",
          categoria: undefined,
        };
        setSelectedSitio(tempSitio);
        setTimeout(() => bottomSheetRef.current?.expand(), 600);
      }
    }
  }, [latitude, longitude, nombre, id, sitioId, selectedSitio]);

  // Establecer categoría inicial desde parámetros
  useEffect(() => {
    if (catId) {
      const idNum = Number(catId);
      if (!isNaN(idNum)) {
        setCategoriaActiva(idNum);
      }
    }
  }, [catId]);

  // 🔥 USEFFECT PRINCIPAL - Cargar sitios por categoría y filtrar por región (CORREGIDO)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        let categoriaACargar = categoriaActiva;
        let sitiosACargar: Sitio[] = [];

        // CASO 1: Viene de Recomendaciones (sitioId) - Primero obtener el sitio para saber su categoría
        if (sitioId && !categoriaActiva) {
          console.log("🔄 Cargando sitio desde Recomendaciones:", sitioId);
          const sitioFromRecomendaciones = await getSitioById(Number(sitioId));

          if (!mounted) return;

          if (sitioFromRecomendaciones?.categoria?.id) {
            categoriaACargar = sitioFromRecomendaciones.categoria.id;
            setCategoriaActiva(categoriaACargar); // Establecer la categoría activa

            // Agregar el sitio seleccionado a la lista
            sitiosACargar.push(sitioFromRecomendaciones);
          }
        }

        // CASO 2: Cargar todos los sitios de la categoría activa
        if (categoriaACargar) {
          console.log("🔄 Cargando sitios para categoría:", categoriaACargar);
          const allSitios = await getSitiosByCategoria(categoriaACargar);

          if (!mounted) return;

          console.log("✅ Sitios obtenidos de API:", allSitios.length);

          // ----- FILTRAR POR REGIÓN (estado / municipio) -----
          let sitiosFiltrados = allSitios;

          if (selectedEstado || selectedMunicipio) {
            const estadoLower = (selectedEstado ?? "").toLowerCase().trim();
            const municipioLower = (selectedMunicipio ?? "").toLowerCase().trim();

            sitiosFiltrados = allSitios.filter((sitio) => {
              const sitioEstado = (sitio.estado ?? "").toLowerCase().trim();
              const sitioMunicipio = (sitio.municipio ?? "").toLowerCase().trim();

              if (estadoLower && municipioLower) {
                return sitioEstado === estadoLower && sitioMunicipio === municipioLower;
              }
              if (estadoLower) return sitioEstado === estadoLower;
              if (municipioLower) return sitioMunicipio === municipioLower;
              return true;
            });

            console.log("📍 Sitios después de filtro región:", sitiosFiltrados.length);
          }

          // Si veníamos de Recomendaciones, usar todos los sitios filtrados
          // No solo el sitio específico
          sitiosACargar = sitioId ? sitiosFiltrados : sitiosFiltrados;
        }

        setSitios(sitiosACargar);

        if (
  categoriaACargar &&                        // hay categoría
  lastFittedCategoryRef.current !== categoriaACargar && // aún no se ha centrado para esta cat
  sitiosACargar.length > 0 &&
  mapRef.current
) {
  console.log("🗺️ Ajustando mapa a sitios visibles (cat:", categoriaACargar, ")");

  const coordsParaMapa = sitiosACargar.map((sitio) => ({
    latitude: sitio.latitude as number,
    longitude: sitio.longitude as number,
  }));

  if (userLocation) {
    coordsParaMapa.push(userLocation);
  }

  if (kmlRoute && showRoute) {
    coordsParaMapa.push(
      ...kmlRoute.coordinates.map((coord) => ({
        latitude: coord.latitude,
        longitude: coord.longitude,
      }))
    );
  }

  mapRef.current.fitToCoordinates(coordsParaMapa, {
    edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
    animated: true,
  });

  // ✅ Guardar que ya hicimos fit para esta categoría
  lastFittedCategoryRef.current = categoriaACargar;
}

      } catch (error) {
        console.error("❌ Error cargando sitios:", error);
        if (mounted) {
          setSitios([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    categoriaActiva,
    selectedEstado,
    selectedMunicipio,
    sitioId, // ✅ Ahora sitioId dispara la carga pero no la bloquea
    userLocation,
    kmlRoute,
    showRoute
  ]);

  

  const toggleFavorito = useCallback(
    async (sitio: Sitio) => {
      if (!userId) {
        Alert.alert("Favoritos", "Inicia sesión para guardar lugares.");
        return;
      }
      const id = Number(sitio.id);
      const wasFav = favIds.has(id);

      setFavIds((prev) => {
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
        setFavIds((prev) => {
          const next = new Set(prev);
          wasFav ? next.add(id) : next.delete(id);
          return next;
        });
        Alert.alert(
          "Favoritos",
          wasFav
            ? "No se pudo quitar de favoritos."
            : "No se pudo guardar en favoritos."
        );
      }
    },
    [userId, token, favIds]
  );

  // Ruta KML
  useEffect(() => {
    const route = parseKML(ANARANJADOS_CIMA_KML);
    setKmlRoute(route);
  }, []);

  // Ubicación del usuario
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Ubicación",
          "Sin permiso de ubicación. Puedes activarlo en Ajustes."
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!mounted) return;

      const cur = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setUserLocation(cur);

      if (kmlRoute && kmlRoute.coordinates.length > 0) {
        const allCoords = [
          ...kmlRoute.coordinates.map((c) => ({
            latitude: c.latitude,
            longitude: c.longitude,
          })),
          cur,
        ];
        mapRef.current?.fitToCoordinates(allCoords, {
          edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
          animated: true,
        });
      } else {
        mapRef.current?.animateToRegion(
          { ...cur, latitudeDelta: 0.03, longitudeDelta: 0.03 },
          600
        );
      }

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 4000,
          distanceInterval: 5,
        },
        (loc) => {
          const u = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setUserLocation((prev) => (movedEnough(prev, u) ? u : prev));
        }
      );
    })();

    return () => {
      mounted = false;
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    };
  }, [kmlRoute]);

  const handleMarkerPress = useCallback((sitio: Sitio) => {
    setEta(null); // reset para cambiar de sitio
    setDirectionsError(null); // reset error al cambiar sitio
    setSelectedSitio(sitio);
    setTimeout(() => bottomSheetRef.current?.expand(), 150);
  }, []);

  const handleCallPress = (telefono: string) => {
    const phoneNumber = `tel:${telefono.replace(/\s/g, "")}`;
    Linking.openURL(phoneNumber);
  };

  const formatImageUrl = (imgPath?: string | null) => {
    if (!imgPath) return null;
    if (imgPath.startsWith("http://") || imgPath.startsWith("https://"))
      return imgPath;
    return `https://res.cloudinary.com/${imgPath}`;
  };

  const recenterOnUser = () => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion(
      { ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      600
    );
  };

  const toggleRoute = () => {
    setShowRoute(!showRoute);
  };

  // ======= DIRECCIONES EXTERNAS =======
  const openDirectionsExternal = async (
    destLat: number,
    destLng: number,
    mode: "driving" | "walking" = "driving"
  ) => {
    const origin = userLocation
      ? `${userLocation.latitude},${userLocation.longitude}`
      : null;
    const googleApp = `comgooglemaps://?${
      origin ? `saddr=${origin}&` : ""
    }daddr=${destLat},${destLng}&directionsmode=${mode}`;
    const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}${
      origin ? `&origin=${origin}` : ""
    }&travelmode=${mode}`;
    const appleApp = `maps://?${
      origin ? `saddr=${origin}&` : ""
    }daddr=${destLat},${destLng}&dirflg=${mode === "walking" ? "w" : "d"}`;
    const appleWeb = `http://maps.apple.com/?${
      origin ? `saddr=${origin}&` : ""
    }daddr=${destLat},${destLng}&dirflg=${mode === "walking" ? "w" : "d"}`;

    if (Platform.OS === "ios") {
      const canApple = await Linking.canOpenURL("maps://");
      if (canApple) return Linking.openURL(appleApp);
      const canGoogle = await Linking.canOpenURL("comgooglemaps://");
      if (canGoogle) return Linking.openURL(googleApp);
      return Linking.openURL(appleWeb);
    } else {
      const canGoogle = await Linking.canOpenURL("comgooglemaps://");
      if (canGoogle) return Linking.openURL(googleApp);
      return Linking.openURL(googleWeb);
    }
  };

  const handleDirectionsPressExternal = (sitio: Sitio) => {
    const destLat = Number(sitio.latitude);
    const destLng = Number(sitio.longitude);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Abrir en mapas",
          options: ["Cancelar", "En carro", "Caminando"],
          cancelButtonIndex: 0,
        },
        (i) => {
          if (i === 1) openDirectionsExternal(destLat, destLng, "driving");
          if (i === 2) openDirectionsExternal(destLat, destLng, "walking");
        }
      );
    } else {
      Alert.alert("Abrir en mapas", "Elige un modo de viaje", [
        {
          text: "Caminando",
          onPress: () => openDirectionsExternal(destLat, destLng, "walking"),
        },
        {
          text: "En carro",
          onPress: () => openDirectionsExternal(destLat, destLng, "driving"),
        },
        { text: "Cancelar", style: "cancel" },
      ]);
    }
  };

  const onDirectionsReady = (result: any) => {
    if (!mapRef.current) return;

    // Resetear error si hay resultado exitoso
    setDirectionsError(null);

    // 🆕 Guardar ETA
    if (result.duration) {
      setEta(Math.round(result.duration)); // minutos
    }

    if (result?.coordinates?.length) {
      mapRef.current.fitToCoordinates(result.coordinates, {
        edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    }
  };

  const onDirectionsError = (error: any) => {
    console.log("Directions error", error);
    
    // Detectar si es error de "no route found"
    if (error?.message?.includes("ZERO_RESULTS") || 
        error?.status === "ZERO_RESULTS" ||
        error?.code === "NOT_FOUND") {
      setDirectionsError("NO_ROUTE");
      setEta(null);
    } else {
      // Otros errores (API key, network, etc.)
      setDirectionsError("OTHER");
      setEta(null);
    }
  };

  const openSheet = (sitio: Sitio) => {
    setEta(null); // resetear ETA al abrir de recomendaciones
    setDirectionsError(null); // resetear error al abrir nuevo sitio
    setSelectedSitio(sitio);
    setTimeout(() => bottomSheetRef.current?.expand(), 200);
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: nombre ? String(nombre) : "Mapa",
        }}
      />

      {/* 🔥 FILTRO DE CATEGORÍAS - MEJORADO */}
      <Categoriafiltro
        categoriaSeleccionada={categoriaActiva}
        onCategoriaChange={async (nuevaCategoriaId) => {
          // Si es la misma categoría, no hacer nada
          if (categoriaActiva === nuevaCategoriaId) return;

          console.log("🔄 Cambiando a categoría:", nuevaCategoriaId);
          
          // Resetear flags y estados
          setCargandoSitios(true);
          setSitios([]); // Limpiar sitios mientras carga
          setSelectedSitio(null); // Cerrar bottom sheet

          try {
            // Obtener sitios de la nueva categoría
            const sitiosNuevaCategoria = await getSitiosByCategoria(nuevaCategoriaId);
            
            // Aplicar filtros de región si existen
            let sitiosFiltrados = sitiosNuevaCategoria;
            if (selectedEstado || selectedMunicipio) {
              const estadoLower = (selectedEstado ?? "").toLowerCase().trim();
              const municipioLower = (selectedMunicipio ?? "").toLowerCase().trim();
              
              sitiosFiltrados = sitiosNuevaCategoria.filter((sitio) => {
                const sitioEstado = (sitio.estado ?? "").toLowerCase().trim();
                const sitioMunicipio = (sitio.municipio ?? "").toLowerCase().trim();
                
                if (estadoLower && municipioLower) {
                  return sitioEstado === estadoLower && sitioMunicipio === municipioLower;
                }
                if (estadoLower) return sitioEstado === estadoLower;
                if (municipioLower) return sitioMunicipio === municipioLower;
                return true;
              });
            }

            setSitios(sitiosFiltrados);
            setCategoriaActiva(nuevaCategoriaId);
            
            console.log("✅ Sitios cargados para nueva categoría:", sitiosFiltrados.length);

          } catch (error) {
            console.error("❌ Error cambiando categoría:", error);
            Alert.alert("Error", "No se pudieron cargar los sitios de esta categoría");
          } finally {
            setCargandoSitios(false);
          }
        }}
      />

      <MapView
        customMapStyle={CLEAN_STYLE}
        style={styles.map}
        initialRegion={initialRegion}
        ref={mapRef}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Mostrar todos los sitios siempre, incluso cuando viene de Recomendaciones */}
        {sitios.map((s) => (
          <SiteMarker key={s.id} sitio={s} onPress={handleMarkerPress} />
        ))}

        {showRoute && kmlRoute && (
          <Polyline
            coordinates={kmlRoute.coordinates}
            strokeColor="#F9A825"
            strokeWidth={4}
            lineDashPattern={[1, 0]}
          />
        )}

        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Tú estás aquí"
            tracksViewChanges
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={30} />
          </Marker>
        )}

        {userLocation && selectedSitio && (
          <MapViewDirections
            origin={userLocation}
            destination={{
              latitude: Number(selectedSitio.latitude),
              longitude: Number(selectedSitio.longitude),
            }}
            mode={travelMode}
            apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}
            strokeWidth={4}
            onReady={onDirectionsReady}
            onError={onDirectionsError}
            resetOnChange={false}
          />
        )}

        {selectedSitio && (
          <Marker
            coordinate={{
              latitude: Number(selectedSitio.latitude),
              longitude: Number(selectedSitio.longitude),
            }}
            title={selectedSitio.nombre}
            onPress={() => handleMarkerPress(selectedSitio)}
          >
            <MaterialCommunityIcons
              name="map-marker"
              size={40}
              color="#0d0575ff"
            />
          </Marker>
        )}
      </MapView>

      {/* FABs */}
      <TouchableOpacity style={styles.fab} onPress={recenterOnUser}>
        <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.fab, styles.fabRoute]}
        onPress={toggleRoute}
      >
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
        onClose={closeSheet}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          {selectedSitio ? (
            <View style={styles.contactCard}>
              {/* Imagen */}
              {(() => {
                const uri = formatImageUrl(selectedSitio.img);
                return uri ? (
                  <Image
                    source={{ uri }}
                    style={styles.contactImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="business" size={40} color="#666" />
                  </View>
                );
              })()}

              {/* Nombre */}
              <Text style={styles.contactName}>{selectedSitio.nombre}</Text>

              {/* ETA y mensajes de error */}
              {eta !== null && (
                <View
                  style={{
                    backgroundColor: "#E8EAF6",
                    padding: 12,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    marginTop: -4,
                  }}
                >
                  <MaterialCommunityIcons
                    name={travelMode === "WALKING" ? "walk" : "car"}
                    size={20}
                    color="#0d0575ff"
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#0d0575ff",
                    }}
                  >
                    Llegas en {formatEta(eta)} • {travelMode === "WALKING" ? "caminando" : "en carro"}
                  </Text>
                </View>
              )}

              {directionsError === "NO_ROUTE" && (
                <View
                  style={{
                    backgroundColor: "#FFEBEE",
                    padding: 12,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    marginTop: -4,
                    borderLeftWidth: 4,
                    borderLeftColor: "#F44336",
                  }}
                >
                  <MaterialCommunityIcons
                    name="swim"
                    size={20}
                    color="#F44336"
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#F44336",
                      textAlign: "center",
                    }}
                  >
                    ¿Planeas llegar nadando?
                  </Text>
                </View>
              )}

              {directionsError === "OTHER" && (
                <View
                  style={{
                    backgroundColor: "#FFF3E0",
                    padding: 12,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    marginTop: -4,
                    borderLeftWidth: 4,
                    borderLeftColor: "#FF9800",
                  }}
                >
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={20}
                    color="#FF9800"
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#FF9800",
                      textAlign: "center",
                    }}
                  >
                    ¿Planeas llegar nadando?
                  </Text>
                </View>
              )}

              {/* Teléfono */}
              {selectedSitio.telefono && (
                <TouchableOpacity
                  style={styles.contactField}
                  onPress={() => handleCallPress(selectedSitio.telefono!)}
                >
                  <FontAwesome5 name="phone" size={16} color="#0d0575ff" />
                  <Text style={styles.contactText}>
                    {selectedSitio.telefono}
                  </Text>
                  <MaterialCommunityIcons
                    name="phone-outgoing"
                    size={16}
                    color="#0d0575ff"
                  />
                </TouchableOpacity>
              )}

              {/* Dirección */}
              <View style={styles.addressSection}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={20}
                  color="#0d0575ff"
                />
                <View style={styles.addressText}>
                  {selectedSitio.calle && (
                    <Text style={styles.addressLine}>
                      {selectedSitio.calle}
                    </Text>
                  )}
                  {selectedSitio.fraccionamiento && (
                    <Text style={styles.addressLine}>
                      {selectedSitio.fraccionamiento}
                    </Text>
                  )}
                  <Text style={styles.addressLine}>
                    {selectedSitio.municipio}, {selectedSitio.estado}
                    {selectedSitio.cp && `, C.P. ${selectedSitio.cp}`}
                  </Text>
                </View>
              </View>

              {/* Acciones */}
              <View style={styles.actionsRowWrap}>
                <View style={styles.modeRow}>
                  <TouchableOpacity
                    style={[
                      styles.modeBtn,
                      travelMode === "DRIVING" && styles.modeBtnActive,
                      directionsError === "NO_ROUTE" && styles.modeBtnDisabled,
                    ]}
                    onPress={() => {
                      setDirectionsError(null); // Resetear error al cambiar modo
                      setTravelMode("DRIVING");
                    }}
                    disabled={directionsError === "NO_ROUTE"}
                  >
                    <MaterialCommunityIcons
                      name="car"
                      size={16}
                      color={
                        travelMode === "DRIVING" ? "#fff" : 
                        directionsError === "NO_ROUTE" ? "#ccc" : "#0d0575ff"
                      }
                    />
                    <Text
                      style={[
                        styles.modeText,
                        travelMode === "DRIVING" && styles.modeTextActive,
                        directionsError === "NO_ROUTE" && styles.modeTextDisabled,
                      ]}
                    >
                      En carro
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modeBtn,
                      travelMode === "WALKING" && styles.modeBtnActive,
                      directionsError === "NO_ROUTE" && styles.modeBtnDisabled,
                    ]}
                    onPress={() => {
                      setDirectionsError(null); // Resetear error al cambiar modo
                      setTravelMode("WALKING");
                    }}
                    disabled={directionsError === "NO_ROUTE"}
                  >
                    <MaterialCommunityIcons
                      name="walk"
                      size={16}
                      color={
                        travelMode === "WALKING" ? "#fff" : 
                        directionsError === "NO_ROUTE" ? "#ccc" : "#0d0575ff"
                      }
                    />
                    <Text
                      style={[
                        styles.modeText,
                        travelMode === "WALKING" && styles.modeTextActive,
                        directionsError === "NO_ROUTE" && styles.modeTextDisabled,
                      ]}
                    >
                      Caminando
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.actionsRow}>
                  <Link
                    href={`/(tabs)/home/sitios/${selectedSitio.id}`}
                    asChild
                  >
                    <TouchableOpacity style={styles.moreInfoButton}>
                      <Text style={styles.moreInfoText}>Más información</Text>
                    </TouchableOpacity>
                  </Link>

                  <TouchableOpacity
                    style={[
                      styles.favButton,
                      isFav(selectedSitio.id) && styles.favButtonActive,
                    ]}
                    onPress={() => toggleFavorito(selectedSitio)}
                  >
                    <MaterialCommunityIcons
                      name={isFav(selectedSitio.id) ? "heart" : "heart-outline"}
                      size={18}
                      color={isFav(selectedSitio.id) ? "#fff" : "#0d0575ff"}
                    />
                    <Text
                      style={[
                        styles.favText,
                        isFav(selectedSitio.id) && styles.favTextActive,
                      ]}
                    >
                      {isFav(selectedSitio.id)
                        ? "Quitar de favoritos"
                        : "Guardar lugar"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {selectedSitio.categoria?.reservable && (
                  <Link
                    href={{
                      pathname: selectedSitio.categoria.nombre
                        .toLowerCase()
                        .includes("hotel")
                        ? "/(tabs)/home/categorias/reserva-hotel"
                        : "/(tabs)/home/categorias/reserva",
                      params: { sitioId: selectedSitio.id.toString() },
                    }}
                    asChild
                  >
                    <TouchableOpacity style={styles.reservaButton}>
                      <MaterialCommunityIcons
                        name="calendar-check"
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.reservaText}>
                        {selectedSitio.categoria.nombre
                          .toLowerCase()
                          .includes("hotel")
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
              <MaterialCommunityIcons
                name="map-marker-question"
                size={48}
                color="#ccc"
              />
              <Text style={styles.placeholderText}>
                Selecciona un marcador para ver la información y la ruta
              </Text>
              {kmlRoute && (
                <View style={styles.routeInfo}>
                  <MaterialCommunityIcons
                    name="truck"
                    size={24}
                    color="#F9A825"
                  />
                  <Text style={styles.routeInfoText}>
                    Ruta activa: {kmlRoute.name}
                  </Text>
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
  container: { flex: 1, position: "relative" },
  map: { width: "100%", height: "100%" },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 120,
    backgroundColor: "#0d0575ff",
    borderRadius: 24,
    padding: 12,
    elevation: 4,
  },

  fabRoute: {
    bottom: 180,
    backgroundColor: "#F9A825",
  },

  bottomSheetBackground: { backgroundColor: "#ffffff", borderRadius: 20 },
  bottomSheetContent: { padding: 16 },

  contactCard: { gap: 16 },
  contactImage: { width: "100%", height: 150, borderRadius: 12 },
  placeholderImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  contactName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0d0575ff",
    textAlign: "center",
  },
  contactField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#0d0575ff",
  },
  contactText: { fontSize: 16, flex: 1, color: "#333" },

  addressSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  addressText: { flex: 1, gap: 4 },
  addressLine: { fontSize: 14, color: "#333", lineHeight: 18 },

  locationInfo: {
    gap: 8,
    padding: 12,
    backgroundColor: "#f0f2f5",
    borderRadius: 8,
  },
  locationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationLabel: { fontSize: 14, fontWeight: "600", color: "#666" },
  locationValue: { fontSize: 14, color: "#333", fontWeight: "500" },

  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },

  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    marginTop: 8,
  },
  routeInfoText: {
    fontSize: 14,
    color: "#E65100",
    fontWeight: "500",
  },

  actionsRowWrap: { gap: 10 },
  modeRow: { flexDirection: "row", gap: 10 },
  modeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#0d0575ff",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#fff",
  },
  modeBtnActive: { backgroundColor: "#0d0575ff", borderColor: "#0d0575ff" },
  modeBtnDisabled: {
    opacity: 0.5,
    backgroundColor: "#f5f5f5",
    borderColor: "#ccc",
  },
  modeText: { color: "#0d0575ff", fontWeight: "600" },
  modeTextActive: { color: "#fff" },
  modeTextDisabled: { color: "#ccc" },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  moreInfoButton: {
    flex: 1,
    backgroundColor: "#0d0575ff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  moreInfoText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dirButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dirText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  reservaButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  reservaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  favButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#0d0575ff",
    borderRadius: 8,
    paddingVertical: 12,
  },
  favButtonActive: {
    backgroundColor: "#0d0575ff",
    borderColor: "#0d0575ff",
  },
  favText: { color: "#0d0575ff", fontSize: 16, fontWeight: "600" },
  favTextActive: { color: "#fff" },
});