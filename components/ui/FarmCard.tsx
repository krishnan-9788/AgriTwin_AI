import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Farm } from '../../types/farm';
import { Colors } from '../../constants/Colors';
import { useRouter } from 'expo-router';

interface FarmCardProps {
  farm: Farm;
}

export const FarmCard: React.FC<FarmCardProps> = ({ farm }) => {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/(app)/farm-profile?id=${farm.id}` as any)}
    >
      <View style={styles.header}>
        <Text style={styles.farmName}>{farm.farmName}</Text>
        <Text style={styles.cropBadge}>{farm.currentCrop}</Text>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.detailText}>🧑‍🌾 {farm.farmerName}</Text>
        <Text style={styles.detailText}>📍 {farm.location}</Text>
        <Text style={styles.detailText}>📏 {farm.size} Acres</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  farmName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  cropBadge: {
    backgroundColor: Colors.light.secondary,
    color: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  details: {
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.text,
  }
});
