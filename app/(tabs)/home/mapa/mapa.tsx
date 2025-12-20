// app/mapa/mapa.tsx
import {
  addFavorito,
  getFavoritosIds,
  getSitioById,
  getSitiosByCategoria,
  removeFavorito,
} from "@/src/lib/api";
import { ANARANJADOS_CIMA_KML, KMLRoute, parseKML } from "@/src/lib/kmlParser";

import { useAuth } from "@/src/state/auth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import * as Location from "expo-location";
import { Stack, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import CLEAN_STYLE from "../../../../assets/map-style-clean.json";
import Categoriafiltro from "./categoriaFiltro";
import SiteBottomSheet from "./components/SiteBottomSheet";
import SiteMarker from "./components/SiteMarker";
import { formatImageUrl } from "./utils";
import { SitioWithImgs, TravelMode } from "./types";

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

  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [sitios, setSitios] = useState<SitioWithImgs[]>([]);
  const [selectedSitio, setSelectedSitio] = useState<SitioWithImgs | null>(
    null
  );
  const [activeImage, setActiveImage] = useState<string | null>(null); // 👈 imagen actual

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [kmlRoute, setKmlRoute] = useState<KMLRoute | null>(null);
  const [showRoute, setShowRoute] = useState(true);
  const [travelMode, setTravelMode] = useState<TravelMode>("DRIVING");

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheetMethods | null>(null);
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

        const sitio = (await getSitioById(
          Number(sitioId)
        )) as SitioWithImgs | null;
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
        const tempSitio: SitioWithImgs = {
          id: Number(id) || 0,
          nombre: nombre,
          latitude: lat,
          longitude: lng,
          estado: "",
          municipio: "",
          calle: "",
          fraccionamiento: "",
          categoria: undefined,
          img: "",
        } as any;
        setSelectedSitio(tempSitio);
        setActiveImage(tempSitio.img || null);
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

  // 🔥 USEFFECT PRINCIPAL - Cargar sitios por categoría y filtrar por región
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        let categoriaACargar = categoriaActiva;
        let sitiosACargar: SitioWithImgs[] = [];

        // CASO 1: Viene de Recomendaciones
        if (sitioId && !categoriaActiva) {
          console.log("🔄 Cargando sitio desde Recomendaciones:", sitioId);
          const sitioFromRecomendaciones = (await getSitioById(
            Number(sitioId)
          )) as SitioWithImgs | null;

          if (!mounted) return;

          if (sitioFromRecomendaciones?.categoria?.id) {
            categoriaACargar = sitioFromRecomendaciones.categoria.id;
            setCategoriaActiva(categoriaACargar);
            sitiosACargar.push(sitioFromRecomendaciones);
          }
        }

        // CASO 2: Cargar todos los sitios de la categoría activa
        if (categoriaACargar) {
          console.log("🔄 Cargando sitios para categoría:", categoriaACargar);
          const allSitios = (await getSitiosByCategoria(
            categoriaACargar
          )) as SitioWithImgs[];

          if (!mounted) return;

          console.log("✅ Sitios obtenidos de API:", allSitios.length);

          let sitiosFiltrados = allSitios;

          if (selectedEstado || selectedMunicipio) {
            const estadoLower = (selectedEstado ?? "").toLowerCase().trim();
            const municipioLower = (selectedMunicipio ?? "")
              .toLowerCase()
              .trim();

            sitiosFiltrados = allSitios.filter((sitio) => {
              const sitioEstado = (sitio.estado ?? "")
                .toLowerCase()
                .trim();
              const sitioMunicipio = (sitio.municipio ?? "")
                .toLowerCase()
                .trim();

              if (estadoLower && municipioLower) {
                return (
                  sitioEstado === estadoLower &&
                  sitioMunicipio === municipioLower
                );
              }
              if (estadoLower) return sitioEstado === estadoLower;
              if (municipioLower) return sitioMunicipio === municipioLower;
              return true;
            });

            console.log(
              "📍 Sitios después de filtro región:",
              sitiosFiltrados.length
            );
          }

          sitiosACargar = sitiosFiltrados;
        }

        setSitios(sitiosACargar);

        if (
          categoriaACargar &&
          lastFittedCategoryRef.current !== categoriaACargar &&
          sitiosACargar.length > 0 &&
          mapRef.current
        ) {
          console.log(
            "🗺️ Ajustando mapa a sitios visibles (cat:",
            categoriaACargar,
            ")"
          );

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

          lastFittedCategoryRef.current = categoriaACargar;
        }
      } catch (error) {
        console.error("❌ Error cargando sitios:", error);
        if (mounted) {
          setSitios([]);
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
    sitioId,
    userLocation,
    kmlRoute,
    showRoute,
  ]);

  const toggleFavorito = useCallback(
    async (sitio: SitioWithImgs) => {
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

  const handleMarkerPress = useCallback((sitio: SitioWithImgs) => {
    setEta(null);
    setDirectionsError(null);
    setSelectedSitio(sitio);
    const firstUrl = sitio.imagenes?.[0]?.url || sitio.img || null;
    setActiveImage(firstUrl);
    setTimeout(() => bottomSheetRef.current?.expand(), 150);
  }, []);

  const handleCallPress = (telefono: string) => {
    const phoneNumber = `tel:${telefono.replace(/\s/g, "")}`;
    Linking.openURL(phoneNumber);
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

  const onDirectionsReady = (result: any) => {
    if (!mapRef.current) return;

    setDirectionsError(null);

    if (result.duration) {
      setEta(Math.round(result.duration));
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

    if (
      error?.message?.includes("ZERO_RESULTS") ||
      error?.status === "ZERO_RESULTS" ||
      error?.code === "NOT_FOUND"
    ) {
      setDirectionsError("NO_ROUTE");
      setEta(null);
    } else {
      setDirectionsError("OTHER");
      setEta(null);
    }
  };

  const openSheet = (sitio: SitioWithImgs) => {
    setEta(null);
    setDirectionsError(null);
    setSelectedSitio(sitio);
    const firstUrl = sitio.imagenes?.[0]?.url || sitio.img || null;
    setActiveImage(firstUrl);
    setTimeout(() => bottomSheetRef.current?.expand(), 200);
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  // ====== Imagen principal calculada ======
  const mainImageUri = formatImageUrl(
    activeImage || selectedSitio?.img || null
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: nombre ? String(nombre) : "Mapa",
        }}
      />

      {/* 🔥 FILTRO DE CATEGORÍAS */}
      <Categoriafiltro
        categoriaSeleccionada={categoriaActiva}
        onCategoriaChange={async (nuevaCategoriaId) => {
          if (categoriaActiva === nuevaCategoriaId) return;

          console.log("🔄 Cambiando a categoría:", nuevaCategoriaId);

          setSitios([]);
          setSelectedSitio(null);
          setActiveImage(null);

          try {
            const sitiosNuevaCategoria = (await getSitiosByCategoria(
              nuevaCategoriaId
            )) as SitioWithImgs[];

            let sitiosFiltrados = sitiosNuevaCategoria;
            if (selectedEstado || selectedMunicipio) {
              const estadoLower = (selectedEstado ?? "")
                .toLowerCase()
                .trim();
              const municipioLower = (selectedMunicipio ?? "")
                .toLowerCase()
                .trim();

              sitiosFiltrados = sitiosNuevaCategoria.filter((sitio) => {
                const sitioEstado = (sitio.estado ?? "")
                  .toLowerCase()
                  .trim();
                const sitioMunicipio = (sitio.municipio ?? "")
                  .toLowerCase()
                  .trim();

                if (estadoLower && municipioLower) {
                  return (
                    sitioEstado === estadoLower &&
                    sitioMunicipio === municipioLower
                  );
                }
                if (estadoLower) return sitioEstado === estadoLower;
                if (municipioLower) return sitioMunicipio === municipioLower;
                return true;
              });
            }

            setSitios(sitiosFiltrados);
            setCategoriaActiva(nuevaCategoriaId);

            console.log(
              "✅ Sitios cargados para nueva categoría:",
              sitiosFiltrados.length
            );
          } catch (error) {
            console.error("❌ Error cambiando categoría:", error);
            Alert.alert(
              "Error",
              "No se pudieron cargar los sitios de esta categoría"
            );
          } finally {
            //
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

      <SiteBottomSheet
        bottomSheetRef={bottomSheetRef}
        snapPoints={snapPoints}
        selectedSitio={selectedSitio}
        closeSheet={closeSheet}
        activeImage={activeImage}
        mainImageUri={mainImageUri}
        onSelectImage={setActiveImage}
        eta={eta}
        travelMode={travelMode}
        directionsError={directionsError}
        onModeChange={(mode) => {
          setDirectionsError(null);
          setTravelMode(mode);
        }}
        isFavorite={isFav}
        onToggleFavorite={toggleFavorito}
        kmlRoute={kmlRoute}
        onCallPress={handleCallPress}
      />
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
});
