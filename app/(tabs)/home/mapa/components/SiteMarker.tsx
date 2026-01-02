import React, { useEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Marker } from "react-native-maps";
import { SitioWithImgs } from "@/src/features/mapa/types";


type Props = {
  sitio: SitioWithImgs;
  onPress: (sitio: SitioWithImgs) => void;
};

const SiteMarker = React.memo(function SiteMarker({ sitio, onPress }: Props) {
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

export default SiteMarker;
