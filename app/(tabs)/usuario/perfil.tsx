import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { BASE_URL } from "@/src/lib/api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import MisCompras from "./opciones/miscompras";

type Usuario = {
  id: string;
  correo: string;
  nombre?: string | null;
  apellido?: string | null;
  validado?: boolean | null;
};

export default function Perfil() {
  const { userId, email } = useLocalSearchParams<{ userId?: string; email?: string }>();
  const router = useRouter();

  const [profile, setProfile] = useState<Usuario | null>(
    userId || email
      ? { id: String(userId ?? ""), correo: String(email ?? ""), nombre: "", apellido: "", validado: null }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null); // pequeño chip en vez de Alert

  const initials = useMemo(() => {
    const n = (profile?.nombre ?? "").trim();
    const a = (profile?.apellido ?? "").trim();
    if (n || a) return `${n?.[0] ?? ""}${a?.[0] ?? ""}`.toUpperCase() || (profile?.correo?.[0] ?? "?").toUpperCase();
    const fromEmail = (profile?.correo ?? "").split("@")[0];
    return (fromEmail?.slice(0, 2) || "??").toUpperCase();
  }, [profile]);

  const fullName = useMemo(() => {
    const n = (profile?.nombre ?? "").trim();
    const a = (profile?.apellido ?? "").trim();
    return (n || a) ? `${n} ${a}`.trim() : "Sin nombre";
  }, [profile]);

  // No lanza error: devuelve JSON o null
  async function safeJsonOrNull(res: Response) {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  const fetchProfile = useCallback(async () => {
    const uid = String(userId ?? profile?.id ?? "").trim();
    if (!uid) return;

    try {
      setLoading(true);
      setStatusText(null);

      const res = await fetch(`${BASE_URL}/usuarios/${uid}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include", // por si usas cookies; si no, no afecta el UI
      });

      if (!res.ok) {
        // No alert: sólo mostramos un chip suave
        setStatusText(`No se pudo actualizar el perfil (HTTP ${res.status})`);
        return;
      }

      const data = await safeJsonOrNull(res);
      if (!data) {
        // El backend devolvió texto/HTML (ej. “This action returns a #1 usuario”)
        setStatusText("Mostrando datos locales");
        return; // dejamos el perfil como estaba (id/correo de la ruta)
      }

      setProfile((prev) => ({
        id: data?.id ?? prev?.id ?? uid,
        correo: data?.correo ?? prev?.correo ?? String(email ?? ""),
        nombre: data?.nombre ?? "",
        apellido: data?.apellido ?? "",
        validado: data?.validado ?? null,
      }));
    } catch (e) {
      // Nada de Alert: sólo chip
      setStatusText("Sin conexión");
    } finally {
      setLoading(false);
    }
  }, [userId, email, profile?.id]);

  useFocusEffect(
    useCallback(() => {
      if (userId && (!profile?.nombre || !profile?.apellido)) {
        fetchProfile();
      }
    }, [userId, profile?.nombre, profile?.apellido, fetchProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile().catch(() => {});
    setRefreshing(false);
  }, [fetchProfile]);

  const handleEditProfile = () => {
    if (!profile?.id) {
      // Nada intrusivo
      setStatusText("Inicia sesión de nuevo para editar");
      return;
    }
    router.push({ pathname: "/(tabs)/usuario/opciones/editarperfil", params: { userId: profile.id } });
  };

  const handleChangePassword = () => {
    if (!profile?.correo) {
      setStatusText("Inicia sesión de nuevo para cambiar contraseña");
      return;
    }
    router.push({ pathname: "/(tabs)/usuario/opciones/cambiarpassword", params: { email: profile.correo } });
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/usuarios/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    } finally {
      router.replace("/(tabs)/usuario/login");
    }
  };

  const goLugares = () => router.push({ pathname: "/(tabs)/usuario/opciones/mislugares", params: { userId: profile?.id } });
  const goComentarios = () => router.push({ pathname: "/(tabs)/usuario/opciones/miscomentarios", params: { userId: profile?.id } });
  const goCompras = () => router.push({ pathname: "/(tabs)/usuario/opciones/miscompras", params: { userId: profile?.id } });
  const goFavoritos = () => router.push({ pathname: "/(tabs)/usuario/opciones/favoritos", params: { userId: profile?.id } });

  if (!email && !userId) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Mi perfil</Text>
        <Text style={{ color: "#6b7280", textAlign: "center" }}>
          No hay sesión activa. Inicia sesión para ver tu perfil.
        </Text>
        <Pressable
          onPress={() => router.replace("/(tabs)/usuario/login")}
          style={{ marginTop: 16, backgroundColor: "#111827", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Ir a iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Mi perfil</Text>

      {/* Cabecera */}
      <View style={{ backgroundColor: "#F3F4F6", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 9999,
            backgroundColor: "#111827",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>{initials}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>{fullName}</Text>
          {!!profile?.correo && <Text style={{ color: "#6b7280" }}>{profile.correo}</Text>}

          {/* Chip de validación si el backend lo trae */}
          {!!(profile?.validado !== null) && (
            <View
              style={{
                alignSelf: "flex-start",
                marginTop: 6,
                backgroundColor: profile?.validado ? "#D1FAE5" : "#FEE2E2",
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: profile?.validado ? "#065F46" : "#991B1B" }}>
                {profile?.validado ? "Cuenta validada" : "Cuenta no validada"}
              </Text>
            </View>
          )}

          {/* Chip de estado suave (sin Alert) */}
          {!!statusText && (
            <View
              style={{
                alignSelf: "flex-start",
                marginTop: 6,
                backgroundColor: "#FEF3C7",
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#92400E" }}>{statusText}</Text>
            </View>
          )}
        </View>

        {loading && <ActivityIndicator />}
      </View>

      {/* Acciones rápidas */}
      <View style={{ marginTop: 18, gap: 10 }}>
        <Pressable
          onPress={handleEditProfile}
          style={{ backgroundColor: "#111827", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Editar perfil</Text>
        </Pressable>

        <Pressable
          onPress={handleChangePassword}
          style={{ backgroundColor: "#374151", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Cambiar contraseña</Text>
        </Pressable>
      </View>

      {/* Grid de accesos */}
      <View style={{ marginTop: 20, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <Tile label="Mis Lugares" onPress={() => goLugares()}>
          <Ionicons name="location-sharp" size={28} />
        </Tile>

        <Tile label="Mis Comentarios" onPress={() => goComentarios()}>
          <Ionicons name="chatbubbles" size={28} />
        </Tile>

        <Tile label="Mis Compras" onPress={() => goCompras()}>
          <MaterialIcons name="shopping-bag" size={28} />
        </Tile>

        <Tile label="Favoritos" onPress={() => goFavoritos()}>
          <Ionicons name="heart" size={28} />
        </Tile>
      </View>

      <Pressable
        onPress={handleLogout}
        style={{ marginTop: 24, backgroundColor: "#EF4444", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

function Tile({
  children,
  label,
  onPress,
}: {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#e5e7eb" }}
      style={{
        width: "48%",
        backgroundColor: "#F9FAFB",
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <View style={{ alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 9999,
            backgroundColor: "#E5E7EB",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </View>
        <Text style={{ fontWeight: "700", color: "#111827", textAlign: "center" }}>{label}</Text>
      </View>
    </Pressable>
  );
}
