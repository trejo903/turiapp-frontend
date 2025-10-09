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
} from "react-native";
import { Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type Msg = { id: string; role: "user" | "bot"; text: string; ts: number };

const BOT_NAME = "TuriBot";
const BRAND = "#0d0575ff";
const SURFACE = "#f5f6fa";
const BUBBLE_BOT = "#eef1f6";

export default function Chat() {
  const insets = useSafeAreaInsets();

  const [msgs, setMsgs] = useState<Msg[]>([
    { id: "hello", role: "bot", text: `Hola, soy ${BOT_NAME} 👋 ¿En qué te ayudo?`, ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [msgs.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Msg = { id: Math.random().toString(36), role: "user", text, ts: Date.now() };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    const reply = await ruleBasedReply(text);
    setMsgs((m) => [...m, { id: Math.random().toString(36), role: "bot", text: reply, ts: Date.now() }]);
    setThinking(false);
  };

  const ruleBasedReply = async (text: string): Promise<string> => {
    const t = text.toLowerCase();
    if (/\b(hola|hello|buenas|hey)\b/.test(t))
      return "¡Hola! 🙌 Puedo recomendarte lugares cercanos, abrir el mapa o resolver dudas rápidas.";
    if (/\b(recom|cerca|cercanos|nearby)\b/.test(t))
      return "Ve a la pestaña “Recomendado” para ver lugares cerca de ti 👉.";
    if (/\bmapa|cómo llegar|ruta|direcci(o|ó)nes\b/.test(t))
      return "Abre una categoría y elige un lugar para ver la ruta o abrir en Google/Apple Maps 🗺️.";
    if (/\b(reserva|reservar|hotel|mesa)\b/.test(t))
      return "Si el lugar admite reservas, verás el botón “Reservar” en la tarjeta 😉.";
    if (/\bperfil|usuario\b/.test(t))
      return "En la pestaña “Usuario” puedes ver tu perfil y favoritos.";
    if (/\b(ayuda|help|ayudame)\b/.test(t))
      return "Puedo: 1) recomendar cercanos, 2) explicar funciones, 3) abrir mapas. ¿Qué necesitas?";
    return "Entendido. Pídeme “recomendaciones cerca de mí” o abre la pestaña “Recomendado”.";
  };

  const renderItem = ({ item }: { item: Msg }) => {
    const isUser = item.role === "user";
    return (
      <View style={[s.row, isUser ? s.rowEnd : s.rowStart]}>
        {!isUser && (
          <View style={s.avatar}>
            <MaterialCommunityIcons name="robot-excited-outline" size={16} color={BRAND} />
          </View>
        )}
        <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleBot]}>
          <Text style={[s.msg, isUser ? s.msgUser : s.msgBot]}>{item.text}</Text>
          <Text style={[s.time, isUser ? s.timeUser : s.timeBot]}>{timeFmt(item.ts)}</Text>
        </View>
        {isUser && <View style={{ width: 20 }} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={[s.container]} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: "Chat", headerTitleAlign: "left" }} />

      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={[s.listContent, { paddingBottom: 96 + insets.bottom }]}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[s.inputWrap, { paddingBottom: 12 + insets.bottom }]}>
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
              style={[s.sendBtn, !input.trim() || thinking ? s.sendBtnDisabled : null]}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function timeFmt(ts: number) {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE },
  listContent: { padding: 12, gap: 8 },

  row: { width: "100%", flexDirection: "row", marginBottom: 6, alignItems: "flex-end" },
  rowStart: { justifyContent: "flex-start" },
  rowEnd: { justifyContent: "flex-end" },

  avatar: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#e9ecf3",
    alignItems: "center", justifyContent: "center",
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

  inputWrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 12 },
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
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: "#0f172a" },
  sendBtn: {
    backgroundColor: BRAND,
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.6 },
});
