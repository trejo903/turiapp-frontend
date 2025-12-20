import React from "react";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { Link } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { KMLRoute } from "@/src/lib/kmlParser";

import { formatEta, formatImageUrl } from "@/src/features/mapa/utils";
import { SitioWithImgs, TravelMode } from "@/src/features/mapa/types";

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetMethods | null>;
  snapPoints: string[];
  selectedSitio: SitioWithImgs | null;
  closeSheet: () => void;
  activeImage: string | null;
  mainImageUri: string | null;
  onSelectImage: (url: string) => void;
  eta: number | null;
  travelMode: TravelMode;
  directionsError: string | null;
  onModeChange: (mode: TravelMode) => void;
  isFavorite: (id: number) => boolean;
  onToggleFavorite: (sitio: SitioWithImgs) => void;
  kmlRoute: KMLRoute | null;
  onCallPress: (telefono: string) => void;
};

const SiteBottomSheet = ({
  bottomSheetRef,
  snapPoints,
  selectedSitio,
  closeSheet,
  activeImage,
  mainImageUri,
  onSelectImage,
  eta,
  travelMode,
  directionsError,
  onModeChange,
  isFavorite,
  onToggleFavorite,
  kmlRoute,
  onCallPress,
}: Props) => {
  const renderGallery = () => {
    if (!selectedSitio?.imagenes || selectedSitio.imagenes.length <= 1) {
      return null;
    }

    return (
      <ScrollView
        horizontal
        nestedScrollEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 8 }}
        contentContainerStyle={styles.galleryScroll}
      >
        {selectedSitio.imagenes.map((img) => {
          const uri = formatImageUrl(img.url);
          if (!uri) return null;
          const isActive = img.url === activeImage;
          return (
            <TouchableOpacity key={img.id} onPress={() => onSelectImage(img.url)}>
              <Image
                source={{ uri }}
                style={[styles.galleryThumb, isActive && styles.galleryThumbActive]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderEta = () => {
    if (eta === null) return null;

    return (
      <View style={styles.etaContainer}>
        <MaterialCommunityIcons
          name={travelMode === "WALKING" ? "walk" : "car"}
          size={20}
          color="#0d0575ff"
        />
        <Text style={styles.etaText}>
          Llegas en {formatEta(eta)} • {travelMode === "WALKING" ? "caminando" : "en carro"}
        </Text>
      </View>
    );
  };

  const renderDirectionsError = () => {
    if (!directionsError) return null;

    const isNoRoute = directionsError === "NO_ROUTE";

    return (
      <View style={[styles.errorContainer, isNoRoute ? styles.errorNoRoute : styles.errorOther]}>
        <MaterialCommunityIcons
          name={isNoRoute ? "swim" : "alert-circle"}
          size={20}
          color={isNoRoute ? "#F44336" : "#FF9800"}
        />
        <Text style={[styles.errorText, isNoRoute ? styles.errorTextNoRoute : styles.errorTextOther]}>
          ¿Planeas llegar nadando?
        </Text>
      </View>
    );
  };

  const renderActions = () => {
    if (!selectedSitio) return null;

    const disabled = directionsError === "NO_ROUTE";

    return (
      <View style={styles.actionsRowWrap}>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              travelMode === "DRIVING" && styles.modeBtnActive,
              disabled && styles.modeBtnDisabled,
            ]}
            onPress={() => onModeChange("DRIVING")}
            disabled={disabled}
          >
            <MaterialCommunityIcons
              name="car"
              size={16}
              color={travelMode === "DRIVING" ? "#fff" : disabled ? "#ccc" : "#0d0575ff"}
            />
            <Text
              style={[
                styles.modeText,
                travelMode === "DRIVING" && styles.modeTextActive,
                disabled && styles.modeTextDisabled,
              ]}
            >
              En carro
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              travelMode === "WALKING" && styles.modeBtnActive,
              disabled && styles.modeBtnDisabled,
            ]}
            onPress={() => onModeChange("WALKING")}
            disabled={disabled}
          >
            <MaterialCommunityIcons
              name="walk"
              size={16}
              color={travelMode === "WALKING" ? "#fff" : disabled ? "#ccc" : "#0d0575ff"}
            />
            <Text
              style={[
                styles.modeText,
                travelMode === "WALKING" && styles.modeTextActive,
                disabled && styles.modeTextDisabled,
              ]}
            >
              Caminando
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <Link href={`/(tabs)/home/sitios/${selectedSitio.id}`} asChild>
            <TouchableOpacity style={styles.moreInfoButton}>
              <Text style={styles.moreInfoText}>Más información</Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity
            style={[styles.favButton, isFavorite(selectedSitio.id) && styles.favButtonActive]}
            onPress={() => onToggleFavorite(selectedSitio)}
          >
            <MaterialCommunityIcons
              name={isFavorite(selectedSitio.id) ? "heart" : "heart-outline"}
              size={18}
              color={isFavorite(selectedSitio.id) ? "#fff" : "#0d0575ff"}
            />
            <Text
              style={[styles.favText, isFavorite(selectedSitio.id) && styles.favTextActive]}
            >
              {isFavorite(selectedSitio.id) ? "Quitar de favoritos" : "Guardar lugar"}
            </Text>
          </TouchableOpacity>
        </View>

        {selectedSitio.categoria?.reservable && (
          <Link
            href={{
              pathname: selectedSitio.categoria.nombre.toLowerCase().includes("hotel")
                ? "/(tabs)/home/categorias/reserva-hotel"
                : "/(tabs)/home/categorias/reserva",
              params: { sitioId: selectedSitio.id.toString() },
            }}
            asChild
          >
            <TouchableOpacity style={styles.reservaButton}>
              <MaterialCommunityIcons name="calendar-check" size={18} color="#fff" />
              <Text style={styles.reservaText}>
                {selectedSitio.categoria.nombre.toLowerCase().includes("hotel")
                  ? "Reservar Hotel"
                  : "Reservar Mesa"}
              </Text>
            </TouchableOpacity>
          </Link>
        )}
      </View>
    );
  };

  const renderPlaceholder = () => (
    <View style={styles.placeholder}>
      <MaterialCommunityIcons name="map-marker-question" size={48} color="#ccc" />
      <Text style={styles.placeholderText}>
        Selecciona un marcador para ver la información y la ruta
      </Text>
      {kmlRoute && (
        <View style={styles.routeInfo}>
          <MaterialCommunityIcons name="truck" size={24} color="#F9A825" />
          <Text style={styles.routeInfoText}>Ruta activa: {kmlRoute.name}</Text>
        </View>
      )}
    </View>
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={-1}
      enablePanDownToClose
      onClose={closeSheet}
      backgroundStyle={styles.bottomSheetBackground}
    >
      <BottomSheetScrollView
        style={styles.bottomSheetContent}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {selectedSitio ? (
          <View style={styles.contactCard}>
            {mainImageUri ? (
              <Image source={{ uri: mainImageUri }} style={styles.contactImage} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="business" size={40} color="#666" />
              </View>
            )}

            {renderGallery()}

            <Text style={styles.contactName}>{selectedSitio.nombre}</Text>

            {renderEta()}
            {renderDirectionsError()}

            {selectedSitio.telefono && (
              <TouchableOpacity style={styles.contactField} onPress={() => onCallPress(selectedSitio.telefono!)}>
                <FontAwesome5 name="phone" size={16} color="#0d0575ff" />
                <Text style={styles.contactText}>{selectedSitio.telefono}</Text>
                <MaterialCommunityIcons name="phone-outgoing" size={16} color="#0d0575ff" />
              </TouchableOpacity>
            )}

            <View style={styles.addressSection}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#0d0575ff" />
              <View style={styles.addressText}>
                {selectedSitio.calle && <Text style={styles.addressLine}>{selectedSitio.calle}</Text>}
                {selectedSitio.fraccionamiento && (
                  <Text style={styles.addressLine}>{selectedSitio.fraccionamiento}</Text>
                )}
                <Text style={styles.addressLine}>
                  {selectedSitio.municipio}, {selectedSitio.estado}
                  {selectedSitio.cp && `, C.P. ${selectedSitio.cp}`}
                </Text>
              </View>
            </View>

            {renderActions()}
          </View>
        ) : (
          renderPlaceholder()
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
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

  galleryScroll: {
    marginTop: 8,
    gap: 8,
  },
  galleryThumb: {
    width: 70,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  galleryThumbActive: {
    borderColor: "#0d0575ff",
    borderWidth: 2,
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

  etaContainer: {
    backgroundColor: "#E8EAF6",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: -4,
  },
  etaText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0d0575ff",
  },

  errorContainer: {
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: -4,
    borderLeftWidth: 4,
  },
  errorNoRoute: {
    backgroundColor: "#FFEBEE",
    borderLeftColor: "#F44336",
  },
  errorOther: {
    backgroundColor: "#FFF3E0",
    borderLeftColor: "#FF9800",
  },
  errorText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  errorTextNoRoute: { color: "#F44336" },
  errorTextOther: { color: "#FF9800" },

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
});

export default SiteBottomSheet;
