// app/(tabs)/home/mapa/categoriaFiltro.tsx

import { getCategorias } from "@/src/lib/api";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Categoria {
  id: number;
  nombre: string;
}

interface Props {
  categoriaSeleccionada: number | null;
  onCategoriaChange: (categoriaId: number) => void;
}

export default function CategoriaFiltro({
  categoriaSeleccionada,
  onCategoriaChange,
}: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargandoCategoria, setCargandoCategoria] = useState<number | null>(null);

  // Animación para el botón activo
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      try {
        const data = await getCategorias();
        setCategorias(data);
      } catch (e) {
        console.error("❌ Error cargando categorías:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Efecto visual cuando cambia la categoría seleccionada
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [categoriaSeleccionada]);

  const handleCategoriaPress = async (catId: number) => {
    if (categoriaSeleccionada === catId) return;
    setCargandoCategoria(catId);
    try {
      await onCategoriaChange(catId);
    } catch (error) {
      console.error("Error cambiando categoría:", error);
    } finally {
      setCargandoCategoria(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0d0575ff" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categorias.map((cat) => {
          const isActive = categoriaSeleccionada === cat.id;
          const isLoading = cargandoCategoria === cat.id;

          const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

          return (
            <AnimatedTouchable
              key={cat.id}
              onPress={() => handleCategoriaPress(cat.id)}
              style={[
                styles.btnCategoria,
                isActive && styles.btnActivo,
                isLoading && styles.btnCargando,
                isActive && { transform: [{ scale: scaleAnim }] },
              ]}
              disabled={cargandoCategoria !== null}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.textoCategoria,
                    isActive && styles.textoActivo,
                  ]}
                >
                  {cat.nombre}
                </Text>
              )}
            </AnimatedTouchable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 6, // 👈 añade respiración lateral
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: "90%", // 👈 Limita el ancho máximo al 90% de la pantalla
    width: "auto", // 👈 Se ajusta al contenido hasta el máximo
  },
  scrollContent: {
    paddingHorizontal: 6,
    alignItems: "center",
  },
  btnCategoria: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1.1,
    borderColor: "#0d0575ff",
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  btnActivo: {
    backgroundColor: "#0d0575ff",
    borderColor: "#0d0575ff",
    shadowColor: "#0d0575ff",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 3,
  },
  btnCargando: {
    backgroundColor: "#0d0575ff",
    opacity: 0.8,
  },
  textoCategoria: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0d0575ff",
  },
  textoActivo: {
    color: "#fff",
    fontWeight: "700",
  },
  loadingContainer: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
  },
});
