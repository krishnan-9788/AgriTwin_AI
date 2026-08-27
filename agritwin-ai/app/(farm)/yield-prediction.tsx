import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../services/api';

export default function YieldPredictionScreen() {
  const { id, sim_date } = useLocalSearchParams<{ id: string; sim_date?: string }>();
  const router = useRouter();
  
  const [selectedId, setSelectedId] = useState<string | null>(id || null);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yieldData, setYieldData] = useState<any>(null);

  // Fetch all farms for the selector
  useEffect(() => {
    let isMounted = true;
    const fetchFarms = async () => {
      try {
        const res = await api.get('/farms/');
        if (isMounted) {
          setFarms(res.data);
          if (!selectedId && res.data.length > 0) {
            setSelectedId(res.data[0].id.toString());
          }
        }
      } catch (err) {
        console.error("Failed to load farms:", err);
      }
    };
    fetchFarms();
    return () => { isMounted = false; };
  }, []);

  // Fetch yield data when selected farm changes
  useEffect(() => {
    let isMounted = true;
    const fetchYield = async () => {
      if (!selectedId) return;
      try {
        setLoading(true);
        const res = await api.get(`/farms/${selectedId}/yield${sim_date ? `?sim_date=${encodeURIComponent(sim_date)}` : ''}`);
        if (isMounted) {
          setYieldData(res.data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Yield Estimation Error:", err);
          setError(err.response?.data?.detail || "Unable to load yield prediction");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchYield();
    return () => { isMounted = false; };
  }, [selectedId, sim_date]);

  return (
    <ScrollView className="flex-1 bg-background dark:bg-slate-900 px-4 py-6 pb-12">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
          <MaterialIcons name="arrow-back" size={24} color="#16a34a" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-white">Yield Prediction</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm">Agronomic estimation based on your farm</Text>
        </View>
      </View>

      {/* Farm/Crop Selector */}
      {farms.length > 0 && (
        <View className="mb-6">
          <Text className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Select Farm / Crop</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {farms.map((farm) => {
              const isSelected = selectedId === farm.id.toString();
              return (
                <TouchableOpacity
                  key={farm.id}
                  onPress={() => setSelectedId(farm.id.toString())}
                  className={`mr-3 px-4 py-2 rounded-full border ${
                    isSelected 
                      ? 'bg-green-600 border-green-700 shadow-sm' 
                      : 'bg-white dark:bg-slate-800 border-gray-200'
                  }`}
                >
                  <Text className={`font-bold ${isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                    {farm.current_crop || farm.farm_name}
                  </Text>
                  <Text className={`text-[10px] ${isSelected ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {farm.farm_name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-slate-700 items-center justify-center min-h-[300px]">
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className="text-gray-500 dark:text-gray-400 font-medium mt-4">Analyzing farm agronomics...</Text>
        </View>
      ) : error ? (
        <View className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-slate-700 items-center justify-center min-h-[300px]">
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text className="text-red-500 font-bold mt-2 text-lg text-center">{error}</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm text-center mt-2">Ensure your farm has a crop selected and valid profile data.</Text>
        </View>
      ) : yieldData ? (
        <View>
          <View className="bg-green-50 dark:bg-green-900/20 rounded-[24px] p-6 shadow-sm border border-green-100 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <MaterialIcons name="trending-up" size={28} color="#16a34a" />
                <Text className="text-xl font-bold text-green-800 ml-2">Estimated Yield</Text>
              </View>
              <View className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm border border-green-100">
                <Text className="text-green-700 font-bold text-xs uppercase tracking-widest">{yieldData.crop || "Crop"}</Text>
              </View>
            </View>
            
            <View className="items-center py-4 bg-white dark:bg-slate-800 rounded-2xl border border-green-50 dark:border-green-900/30 shadow-sm mb-4">
              <Text className="text-5xl font-extrabold text-green-700">
                {yieldData.estimated_yield} <Text className="text-xl font-bold text-green-600">{yieldData.unit || 'Quintals'}</Text>
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1 uppercase tracking-wider">Total Projected Harvest</Text>
            </View>

            <View className="flex-row justify-between pt-2">
              <View className="items-center bg-white dark:bg-slate-800 w-[100%] py-3 rounded-xl border border-green-50 dark:border-green-900/30 shadow-sm">
                <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Farm Area</Text>
                <Text className="text-gray-800 dark:text-white font-extrabold text-lg mt-1">{yieldData.area_acres} Acres</Text>
              </View>
            </View>
          </View>

          <View className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-slate-700 mb-6">
            <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4">Prediction Factors</Text>
            
            {yieldData.factors && yieldData.factors.map((factor: string, idx: number) => {
              const isPositive = factor.startsWith('+');
              const isNegative = factor.startsWith('-');
              
              return (
                <View key={idx} className={`flex-row items-center mb-3 p-3 rounded-xl border ${isPositive ? 'bg-green-50 dark:bg-green-900/20 border-green-100' : isNegative ? 'bg-red-50 dark:bg-red-900/20 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                  <MaterialIcons 
                    name={isPositive ? 'check-circle' : isNegative ? 'warning' : 'info'} 
                    size={20} 
                    color={isPositive ? '#16a34a' : isNegative ? '#ef4444' : '#6b7280'} 
                  />
                  <Text className={`ml-3 font-medium flex-1 ${isPositive ? 'text-green-800' : isNegative ? 'text-red-800' : 'text-gray-700 dark:text-gray-200'}`}>
                    {factor}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
      
      <View className="h-10" />
    </ScrollView>
  );
}
