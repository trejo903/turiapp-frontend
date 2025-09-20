// app/(tabs)/Card.tsx
import { Link } from "expo-router";
import { useState } from "react";
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Option = { label: string; path: string };

type CardProps = {
  title: string;
  options: Option[];
};

export default function Card({ title, options }: CardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={toggleExpand} style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.arrow}>{expanded ? "▲" : "▼"}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.optionsContainer}>
          {options.map((opt) => (
            <Link key={opt.path} href={opt.path} asChild>
              <Pressable android_ripple={{ color: "#ccc" }} style={styles.option}>
                <Text style={styles.optionText}>{opt.label}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 313,
    marginTop: 12,
  },
  card: {
    height: 65,
    backgroundColor: "#D9D9D9",
    borderRadius: 5,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  arrow: {
    fontSize: 18,
  },
  optionsContainer: {
    marginTop: 8,
    backgroundColor: "#EFEFEF",
    borderRadius: 5,
    overflow: "hidden",
  },
  option: {
    padding: 12,
  },
  optionText: {
    fontSize: 16,
  },
});
