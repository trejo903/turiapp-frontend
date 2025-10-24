// src/components/FilterModal.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

type FilterOption = {
  id: string;
  label: string;
  icon: string;
};

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
};

const filterOptions: FilterOption[] = [
  { id: 'distance', label: 'Más cercano', icon: 'map-marker-distance' },
  { id: 'rating', label: 'Mejor puntuado', icon: 'star-outline' },
  { id: 'popular', label: 'Más opinado', icon: 'message-text-outline' },
  { id: 'combined', label: 'Recomendado', icon: 'trending-up' },
];

export default function FilterModal({
  visible,
  onClose,
  selectedFilter,
  onFilterChange,
}: FilterModalProps) {
  const [slideAnim] = useState(new Animated.Value(width));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Filtrar por</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.optionsContainer}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  selectedFilter === option.id && styles.optionSelected,
                ]}
                onPress={() => {
                  onFilterChange(option.id);
                  onClose();
                }}
              >
                <View style={styles.optionContent}>
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={20}
                    color={selectedFilter === option.id ? '#0d0575ff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      selectedFilter === option.id && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {selectedFilter === option.id && (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color="#0d0575ff"
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.8,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0d0575ff',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  optionSelected: {
    backgroundColor: '#f8f9ff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#0d0575ff',
    fontWeight: '600',
  },
});