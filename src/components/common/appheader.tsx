//AppHeader.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PINK = '#007AFF';
//es un componente reciclado de correos de mexico no voy a cambiar esa vaariable pink KKKKKKKKK
interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
}

export default function AppHeader({ title, onBack, rightComponent }: AppHeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: PINK }}>
      {/* 🔹 StatusBar fijo en cada header */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={PINK}
        translucent={false}
      />
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}

        <Text style={styles.title}>{title}</Text>

        {rightComponent ? rightComponent : <View style={{ width: 22 }} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PINK,
  },
  backButton: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
//prueba