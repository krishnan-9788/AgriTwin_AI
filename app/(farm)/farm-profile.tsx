import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getFarm, deleteFarm, getFarmSuitability } from '../../services/farm';
import { Farm } from '../../types/farm';
import { Button } from '../../components/ui/Button';
import { MaterialIcons } from '@expo/vector-icons';

export default function FarmProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [suitability, setSuitability] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([getFarm(id), getFarmSuitability(id)])
        .then(([farmData, suitabilityData]) => {
          setFarm(farmData);
          setSuitability(suitabilityData);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  const handleDelete = () => {
    Alert.alert('Delete Farm', 'Are you sure you want to delete this farm?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          if (id) {
            await deleteFarm(id);
            router.replace('/(tabs)/dashboard');
          }
        }
      }
    ]);
  };

  if (loading) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#2E7D32" /></View>;
  }

  if (!farm) {
    return <View className="flex-1 justify-center items-center"><Text>Farm not found</Text></View>;
  }

  return (
    <ScrollView className="flex-1 bg-background dark:bg-slate-900 px-4 py-6">
      <View className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm mb-6 items-center">
        <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
          <MaterialIcons name="agriculture" size={40} color="#2E7D32" />
        </View>
        <Text className="text-3xl font-bold text-gray-800 dark:text-white text-center">{farm.farmName}</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center mt-1"><MaterialIcons name="location-on" size={14} /> {farm.location}</Text>
      </View>

      <View className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm mb-6">
        <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Farm Details</Text>
        
        <View className="flex-row justify-between py-2 border-b border-gray-50">
          <Text className="text-gray-500 dark:text-gray-400">Farmer Name</Text>
          <Text className="text-gray-800 dark:text-white font-medium">{farm.farmerName}</Text>
        </View>
        <View className="flex-row justify-between py-2 border-b border-gray-50">
          <Text className="text-gray-500 dark:text-gray-400">Size</Text>
          <Text className="text-gray-800 dark:text-white font-medium">{farm.size} Acres</Text>
        </View>
        <View className="flex-row justify-between py-2 border-b border-gray-50">
          <Text className="text-gray-500 dark:text-gray-400">Soil Type</Text>
          <Text className="text-gray-800 dark:text-white font-medium">{farm.soilType}</Text>
        </View>
        <View className="flex-row justify-between py-2 border-b border-gray-50 mb-3">
          <Text className="text-gray-500 dark:text-gray-400">Water Source</Text>
          <Text className="text-gray-800 dark:text-white font-medium">{farm.waterSource}</Text>
        </View>

        <Button 
          title="View Soil Details" 
          variant="outline" 
          onPress={() => router.push(`/(farm)/soil?id=${farm.id}`)} 
        />
      </View>

      <View className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm mb-8">
        <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Crop Info</Text>
        
        <View className="flex-row justify-between py-2 border-b border-gray-50">
          <Text className="text-gray-500 dark:text-gray-400">Current Crop</Text>
          <Text className="text-gray-800 dark:text-white font-medium">{farm.currentCrop}</Text>
        </View>
        <View className="flex-row justify-between py-2 border-b border-gray-50">
          <Text className="text-gray-500 dark:text-gray-400">Planting Date</Text>
          <Text className="text-gray-800 dark:text-white font-medium">{farm.plantingDate}</Text>
        </View>

        {suitability && (
          <View className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-green-800 font-bold">Crop Suitability</Text>
              <View className={`px-2 py-1 rounded-full ${suitability.suitability_score === 'High' ? 'bg-green-600' : suitability.suitability_score === 'Moderate' ? 'bg-yellow-500' : 'bg-red-50 dark:bg-red-900/200'}`}>
                <Text className="text-white text-xs font-bold">{suitability.suitability_score}</Text>
              </View>
            </View>
            
            {suitability.reasons && suitability.reasons.map((r: string, idx: number) => (
              <Text key={idx} className={`text-xs mt-1 ${r.startsWith('-') ? 'text-red-600' : 'text-green-700'}`}>
                {r}
              </Text>
            ))}

            {suitability.alternatives && suitability.alternatives.length > 0 && (
              <Text className="text-gray-600 dark:text-gray-300 text-xs font-medium mt-3 border-t border-green-200 pt-2">
                Suggested Alternatives: {suitability.alternatives.join(", ")}
              </Text>
            )}
          </View>
        )}
        
        <Button 
          title="View Market Prices" 
          variant="outline" 
          onPress={() => router.push(`/(farm)/market-price?id=${farm.id}`)} 
          className="mt-4"
        />
      </View>

      <Button title="Edit Farm" onPress={() => router.push(`/(farm)/edit-farm?id=${farm.id}`)} className="mb-4" />
      <Button 
        title="Open Digital Twin" 
        onPress={() => router.push(`/(farm)/digital-twin?id=${farm.id}`)} 
        className="mb-4"
        style={{ backgroundColor: '#1e293b' }}
      />
      <Button title="Delete Farm" variant="outline" onPress={handleDelete} className="border-red-500 text-red-500 mb-8" />
    </ScrollView>
  );
}
