import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { BASE_URL } from "@/src/lib/api";
import { useAuth } from "@/src/state/auth";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

type Usuario = {
  id: string;
  correo: string;
  nombre?: string | null;
  apellido?: string | null;
  validado?: boolean | null;
};

export default function Perfil() {
  useAuthGuard(); // 🔒 redirige a /login si no hay token válido
  const router = useRouter();
  const { user, token, logout } = useAuth(); // ← lee sesión desde Zustand

  const [profile, setProfile] = useState<Usuario | null>(
    user
      ? { id: String(user.id), correo: user.correo, nombre: user.nombre ?? "", apellido: user.apellido ?? "", validado: null }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

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

  const fetchProfile = useCallback(async () => {
    if (!token || !user?.id) return;

    try {
      setLoading(true);
      setStatusText(null);

      const res = await fetch(`${BASE_URL}/usuarios/${user.id}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`, // ← usa JWT
        },
        credentials: "include",
      });

      if (!res.ok) {
        setStatusText(`No se pudo actualizar el perfil (HTTP ${res.status})`);
        return;
      }

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;
      if (!data) { setStatusText("Mostrando datos locales"); return; }

      setProfile({
        id: String(data.id),
        correo: data.correo,
        nombre: data.nombre ?? "",
        apellido: data.apellido ?? "",
        validado: data.validado ?? null,
      });
    } catch {
      setStatusText("Sin conexión");
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile().catch(() => {});
    setRefreshing(false);
  }, [fetchProfile]);

  const handleEditProfile = () => {
    if (!profile?.id) { setStatusText("Inicia sesión de nuevo para editar"); return; }
    router.push({ pathname: "/(tabs)/usuario/opciones/editarperfil", params: { userId: profile.id } });
  };

  const handleChangePassword = () => {
    if (!profile?.correo) { setStatusText("Inicia sesión de nuevo para cambiar contraseña"); return; }
    router.push({ pathname: "/(tabs)/usuario/opciones/cambiarpassword", params: { email: profile.correo } });
  };

  const handleLogout = async () => {
    try { await fetch(`${BASE_URL}/usuarios/logout`, { method: "POST", credentials: "include" }); } catch {}
    logout(); // ← limpia el store persistido
    router.replace("/(tabs)/usuario/login");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Mi perfil</Text>

      <View style={{ backgroundColor: "#F3F4F6", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ width: 64, height: 64, borderRadius: 9999, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>{initials}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>{fullName}</Text>
          {!!profile?.correo && <Text style={{ color: "#6b7280" }}>{profile.correo}</Text>}

          {!!(profile?.validado !== null) && (
            <View style={{ alignSelf: "flex-start", marginTop: 6, backgroundColor: profile?.validado ? "#D1FAE5" : "#FEE2E2",
                           paddingVertical: 4, paddingHorizontal: 10, borderRadius: 9999 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: profile?.validado ? "#065F46" : "#991B1B" }}>
                {profile?.validado ? "Cuenta validada" : "Cuenta no validada"}
              </Text>
            </View>
          )}

          {!!statusText && (
            <View style={{ alignSelf: "flex-start", marginTop: 6, backgroundColor: "#FEF3C7",
                           paddingVertical: 4, paddingHorizontal: 10, borderRadius: 9999 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#92400E" }}>{statusText}</Text>
            </View>
          )}
        </View>

        {loading && <ActivityIndicator />}
      </View>

      <View style={{ marginTop: 18, gap: 10 }}>
        <Pressable onPress={handleEditProfile} style={{ backgroundColor: "#111827", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
          <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Editar perfil</Text>
        </Pressable>

        <Pressable onPress={handleChangePassword} style={{ backgroundColor: "#374151", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
          <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Cambiar contraseña</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 20, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <Tile label="Mis Lugares" onPress={() => router.push({ pathname: "/(tabs)/usuario/opciones/mislugares", params: { userId: profile?.id } })}>
          <Ionicons name="location-sharp" size={28} />
        </Tile>
        <Tile label="Mis Comentarios" onPress={() => router.push({ pathname: "/(tabs)/usuario/opciones/miscomentarios", params: { userId: profile?.id } })}>
          <Ionicons name="chatbubbles" size={28} />
        </Tile>
        <Tile label="Mis Compras" onPress={() => router.push({ pathname: "/(tabs)/usuario/opciones/miscompras", params: { userId: profile?.id } })}>
          <MaterialIcons name="shopping-bag" size={28} />
        </Tile>
        <Tile label="Idioma" onPress={() => router.push("/(tabs)/usuario/opciones/idioma")}>
          <Ionicons name="language-outline" size={28} />
        </Tile>
        <Tile label="Mis Reservas" onPress={() => router.push({ pathname: "/(tabs)/usuario/opciones/misreservas", params: { userId: profile?.id } })}>
          <Ionicons name="calendar" size={28} />
        </Tile>
      </View>

      <Pressable onPress={handleLogout} style={{ marginTop: 24, backgroundColor: "#EF4444", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
        <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

function Tile({ children, label, onPress }: { children: React.ReactNode; label: string; onPress: () => void; }) {
  return (
    <Pressable onPress={onPress} android_ripple={{ color: "#e5e7eb" }}
      style={{ width: "48%", backgroundColor: "#F9FAFB", borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16,
               shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}>
      <View style={{ alignItems: "center", gap: 8 }}>
        <View style={{ width: 52, height: 52, borderRadius: 9999, backgroundColor: "#E5E7EB", alignItems: "center", justifyContent: "center" }}>
          {children}
        </View>
        <Text style={{ fontWeight: "700", color: "#111827", textAlign: "center" }}>{label}</Text>
      </View>
    </Pressable>
  );
}
