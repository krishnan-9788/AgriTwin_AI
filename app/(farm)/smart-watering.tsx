import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../services/api';

export default function SmartWateringScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [selectedId, setSelectedId] = useState<string | null>(id || null);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [irrigationData, setIrrigationData] = useState<any>(null);
  
  const [lightIntensity, setLightIntensity] = useState<string>('');

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
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };
    fetchFarms();
    return () => { isMounted = false; };
  }, []);

  const handlePredict = async () => {
    if (!selectedId) return;
    try {
      setLoading(true);
      setError(null);
      
      const payload: any = { farm_id: parseInt(selectedId) };
      if (lightIntensity.trim() !== '') {
        payload.light_intensity_lux = parseFloat(lightIntensity);
      }
      
      const res = await api.post('/irrigation/predict', payload);
      setIrrigationData(res.data);
    } catch (err: any) {
      console.error("Irrigation Prediction Error:", err);
      setError(err.response?.data?.detail || "Unable to predict irrigation requirement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background dark:bg-slate-900 px-4 py-6 pb-12">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
          <MaterialIcons name="arrow-back" size={24} color="#16a34a" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-white">Smart Watering</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm">AI-driven irrigation recommendation</Text>
        </View>
      </View>

      {/* Farm Selector */}
      {farms.length > 0 && (
        <View className="mb-6">
          <Text className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Select Farm</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {farms.map((farm) => {
              const isSelected = selectedId === farm.id.toString();
              return (
                <TouchableOpacity
                  key={farm.id}
                  onPress={() => setSelectedId(farm.id.toString())}
                  className={`mr-3 px-4 py-2 rounded-full border ${
                    isSelected 
                      ? 'bg-blue-600 border-blue-700 shadow-sm' 
                      : 'bg-white dark:bg-slate-800 border-gray-200'
                  }`}
                >
                  <Text className={`font-bold ${isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                    {farm.farm_name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Inputs */}
      <View className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-slate-700 mb-6">
        <Text className="text-lg font-bold text-gray-800 dark:text-white mb-2">Sensor Inputs</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm mb-4">Provide light intensity for more accurate predictions, or leave blank to auto-estimate.</Text>
        
        <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">Light Intensity (Lux) - Optional</Text>
        <TextInput
          className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white"
          placeholder="e.g. 50000"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={lightIntensity}
          onChangeText={setLightIntensity}
        />
        
        <TouchableOpacity 
          className="bg-blue-600 mt-6 py-4 rounded-xl items-center flex-row justify-center"
          onPress={handlePredict}
          disabled={loading || !selectedId}
        >
          {loading ? (
             <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialIcons name="water-drop" size={20} color="white" className="mr-2" />
              <Text className="text-white font-bold text-lg ml-2">Analyze Watering Need</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Results */}
      {initialLoading ? (
         <View className="items-center justify-center py-10"><ActivityIndicator size="large" color="#3b82f6" /></View>
      ) : error ? (
        <View className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-slate-700 items-center justify-center">
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text className="text-red-500 font-bold mt-2 text-lg text-center">{error}</Text>
        </View>
      ) : irrigationData ? (
        <View>
          <View className={`${irrigationData.irrigation_required ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100' : 'bg-green-50 dark:bg-green-900/20 border-green-100'} rounded-[24px] p-6 shadow-sm border mb-6`}>
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <MaterialIcons name={irrigationData.irrigation_required ? "water" : "check-circle"} size={28} color={irrigationData.irrigation_required ? "#3b82f6" : "#16a34a"} />
                <Text className={`text-xl font-bold ml-2 ${irrigationData.irrigation_required ? 'text-blue-800' : 'text-green-800'}`}>Status</Text>
              </View>
              <View className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm">
                <Text className="text-gray-700 font-bold text-xs uppercase tracking-widest">{irrigationData.crop}</Text>
              </View>
            </View>
            
            <View className="items-center py-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-4">
              <Text className={`text-2xl font-extrabold ${irrigationData.irrigation_required ? 'text-blue-700' : 'text-green-700'}`}>
                {irrigationData.recommendation}
              </Text>
            </View>

            <View className="items-center bg-white dark:bg-slate-800 w-[100%] py-4 rounded-xl shadow-sm mb-2 px-4">
               <Text className="text-gray-600 dark:text-gray-300 font-medium text-center">{irrigationData.reason}</Text>
            </View>
          </View>
        </View>
      ) : null}
      
      <View className="h-10" />
    </ScrollView>
  );
}
