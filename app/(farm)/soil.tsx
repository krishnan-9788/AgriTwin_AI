import React from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SoilHealthCard } from '../../components/ui/SoilHealthCard';

export default function SoilDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView className="flex-1 bg-background dark:bg-slate-900 px-4 py-6">
      {id && <SoilHealthCard farmId={Number(id)} />}
    </ScrollView>
  );
}
