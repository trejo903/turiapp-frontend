// app/sitios/chat.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  Linking,
} from "react-native";
import { Stack, Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "@/src/lib/api";

const BOT_NAME = "TuriBot";
const BRAND = "#0d0575ff";
const SURFACE = "#f5f6fa";
const BUBBLE_BOT = "#eef1f6";

// datos de sitio que manda el backend
type ChatSitio = {
  id: number;
  nombre: string;
  img: string | null;
  calle: string | null;
  fraccionamiento: string | null;
  municipio: string;
  estado: string;
  cp: string | null;
  latitude: number;
  longitude: number;
};

type Msg =
  | { id: string; role: "user"; kind: "text"; text: string; ts: number }
  | { id: string; role: "bot"; kind: "text"; text: string; ts: number }
  | { id: string; role: "bot"; kind: "sitio"; sitio: ChatSitio; ts: number };

// 👇 sugerencias rápidas ACTUALIZADAS
const QUICK_REPLIES = [
  {
    id: "q1",
    label: "Categorías que visitar",
    text: "Qué categorías me recomiendas para visitar",
  },
  {
    id: "q2",
    label: "Lugar mejor calificado",
    text: "Cuál es el lugar mejor calificado",
  },
  {
    id: "q3",
    label: "Lugar más opinado",
    text: "Cuál es el lugar mejor opinado, con más opiniones",
  },
];

export default function Chat() {
  const insets = useSafeAreaInsets();

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: "hello",
      role: "bot",
      kind: "text",
      text: `Hola, soy ${BOT_NAME} 👋 ¿En qué te ayudo?`,
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);

  useEffect(() => {
    const t = setTimeout(
      () => listRef.current?.scrollToEnd({ animated: true }),
      60
    );
    return () => clearTimeout(t);
  }, [msgs.length]);

  // función común para mandar mensajes (texto escrito o quick reply)
  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || thinking) return;

    const userMsg: Msg = {
      id: Math.random().toString(36),
      role: "user",
      kind: "text",
      text,
      ts: Date.now(),
    };

    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    try {
      const res = await backendReply(text);

      const botTextMsg: Msg = {
        id: Math.random().toString(36),
        role: "bot",
        kind: "text",
        text: res.reply,
        ts: Date.now(),
      };

      setMsgs((m) => {
        const next: Msg[] = [...m, botTextMsg];

        if (res.sitio) {
          const botCardMsg: Msg = {
            id: Math.random().toString(36),
            role: "bot",
            kind: "sitio",
            sitio: res.sitio,
            ts: Date.now(),
          };
          next.push(botCardMsg);
        }

        return next;
      });
    } catch (e) {
      console.error(e);
      const errMsg: Msg = {
        id: Math.random().toString(36),
        role: "bot",
        kind: "text",
        text: "Ups, hubo un problema hablando con el servidor 😢 Intenta de nuevo.",
        ts: Date.now(),
      };
      setMsgs((m) => [...m, errMsg]);
    } finally {
      setThinking(false);
    }
  };

  // desde el input
  const handleSend = () => sendMessage(input);

  // desde los botones rápidos
  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  // Llama al backend NestJS (POST /chat)
  const backendReply = async (
    text: string
  ): Promise<{ reply: string; sitio?: ChatSitio }> => {
    const token: string | null = null;

    const res = await apiFetch(
      "/chat",
      {
        method: "POST",
        body: JSON.stringify({ message: text }),
      },
      token
    );

    if (!res || typeof res.reply !== "string") {
      return { reply: "No entendí la respuesta del servidor 😅" };
    }

    return res;
  };

  const renderItem = ({ item }: { item: Msg }) => {
    // tarjeta de sitio (solo bot)
    if (item.kind === "sitio" && item.role === "bot") {
      return (
        <View style={[s.row, s.rowStart]}>
          <View style={s.avatar}>
            <MaterialCommunityIcons
              name="robot-excited-outline"
              size={16}
              color={BRAND}
            />
          </View>
          <SitioCard sitio={item.sitio} />
        </View>
      );
    }

    // mensajes de texto
    const isUser = item.role === "user";
    const text = item.text;

    return (
      <View style={[s.row, isUser ? s.rowEnd : s.rowStart]}>
        {!isUser && (
          <View style={s.avatar}>
            <MaterialCommunityIcons
              name="robot-excited-outline"
              size={16}
              color={BRAND}
            />
          </View>
        )}
        <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleBot]}>
          <Text style={[s.msg, isUser ? s.msgUser : s.msgBot]}>{text}</Text>
          <Text style={[s.time, isUser ? s.timeUser : s.timeBot]}>
            {timeFmt(item.ts)}
          </Text>
        </View>
        {isUser && <View style={{ width: 20 }} />}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <SafeAreaView
        style={s.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <Stack.Screen options={{ title: "Chat", headerTitleAlign: "left" }} />

        {/* Lista de mensajes */}
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          style={{ flex: 1 }}
          contentContainerStyle={[s.listContent, { paddingBottom: 8 }]}
        />

        {/* Sugerencias rápidas */}
        <View style={[s.quickWrap, { paddingBottom: 4 }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.quickScroll}
          >
            {QUICK_REPLIES.map((q) => (
              <TouchableOpacity
                key={q.id}
                style={s.quickChip}
                activeOpacity={0.9}
                onPress={() => handleQuickReply(q.text)}
                disabled={thinking}
              >
                <Text style={s.quickText}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Barra de input */}
        <View style={[s.inputWrap, { paddingBottom: 4 + insets.bottom }]}>
          <View style={s.inputBar}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Escribe tu mensaje…"
              placeholderTextColor="#9aa1b2"
              style={s.input}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                s.sendBtn,
                !input.trim() || thinking ? s.sendBtnDisabled : null,
              ]}
              onPress={handleSend}
              disabled={!input.trim() || thinking}
              activeOpacity={0.9}
            >
              {thinking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// === TARJETA DE SITIO DENTRO DEL CHAT ===

type SitioCardProps = { sitio: ChatSitio };

function SitioCard({ sitio }: SitioCardProps) {
  const uri = formatImageUrl(sitio.img || undefined);

  const handleOpenMaps = async () => {
    const dest = `${sitio.latitude},${sitio.longitude}`;
    const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    const googleApp = `comgooglemaps://?daddr=${dest}`;
    const appleApp = `maps://?daddr=${dest}`;

    if (Platform.OS === "ios") {
      const canApple = await Linking.canOpenURL("maps://");
      if (canApple) return Linking.openURL(appleApp);
      const canGoogle = await Linking.canOpenURL("comgooglemaps://");
      if (canGoogle) return Linking.openURL(googleApp);
      return Linking.openURL(googleWeb);
    } else {
      const canGoogle = await Linking.canOpenURL("comgooglemaps://");
      if (canGoogle) return Linking.openURL(googleApp);
      return Linking.openURL(googleWeb);
    }
  };

  return (
    <View style={s.card}>
      {uri ? (
        <Image source={{ uri }} style={s.cover} resizeMode="cover" />
      ) : (
        <View style={s.coverPlaceholder}>
          <MaterialCommunityIcons name="image-off" size={32} color="#888" />
        </View>
      )}

      <View style={s.infoRow}>
        <Text style={s.name}>{sitio.nombre}</Text>
      </View>

      <Text style={s.subtle}>
        {sitio.calle ? `${sitio.calle}, ` : ""}
        {sitio.fraccionamiento ? `${sitio.fraccionamiento}, ` : ""}
        {sitio.municipio}, {sitio.estado}
        {sitio.cp ? `, C.P. ${sitio.cp}` : ""}
      </Text>

      <View style={s.actions}>
        <TouchableOpacity style={s.mapBtn} onPress={handleOpenMaps}>
          <MaterialCommunityIcons name="navigation" size={18} color="#fff" />
          <Text style={s.mapText}>Abrir en mapas</Text>
        </TouchableOpacity>

        <Link href={`/sitios/${sitio.id}`} asChild>
          <TouchableOpacity style={s.moreBtn}>
            <Text style={s.moreText}>Más información</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

function formatImageUrl(imgPath?: string) {
  if (!imgPath) return null;
  if (imgPath.startsWith("http://") || imgPath.startsWith("https://"))
    return imgPath;
  return `https://res.cloudinary.com/${imgPath}`;
}

function timeFmt(ts: number) {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE },
  listContent: { paddingHorizontal: 12, paddingTop: 12, gap: 8 },

  row: {
    width: "100%",
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "flex-end",
  },
  rowStart: { justifyContent: "flex-start" },
  rowEnd: { justifyContent: "flex-end" },

  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#e9ecf3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  bubbleUser: { backgroundColor: BRAND, borderBottomRightRadius: 6 },
  bubbleBot: { backgroundColor: BUBBLE_BOT, borderBottomLeftRadius: 6 },

  msg: { fontSize: 16, lineHeight: 22 },
  msgUser: { color: "#fff" },
  msgBot: { color: "#0f172a" },

  time: { marginTop: 4, fontSize: 11 },
  timeUser: { color: "#e6e6e6", textAlign: "right" },
  timeBot: { color: "#667085" },

  quickWrap: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  quickScroll: {
    flexDirection: "row",
    columnGap: 8,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d0d4e4",
    backgroundColor: "#fff",
  },
  quickText: {
    fontSize: 13,
    color: "#1f2937",
  },

  inputWrap: {
    paddingHorizontal: 12,
    paddingTop: 4,
    backgroundColor: "transparent",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#0f172a",
  },
  sendBtn: {
    backgroundColor: BRAND,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.6 },

  // estilos de la tarjeta de sitio (copiados de MisLugares)
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    flex: 1,
  },
  cover: { width: "100%", height: 140 },
  coverPlaceholder: {
    width: "100%",
    height: 140,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    gap: 12,
  },
  name: { fontSize: 18, fontWeight: "700", color: "#0d0575ff", flex: 1 },
  subtle: { color: "#444", paddingHorizontal: 12, paddingBottom: 8 },
  actions: { flexDirection: "row", gap: 10, padding: 12 },
  mapBtn: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  mapText: { color: "#fff", fontWeight: "700" },
  moreBtn: {
    flex: 1,
    backgroundColor: "#0d0575ff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  moreText: { color: "#fff", fontWeight: "700" },
});
