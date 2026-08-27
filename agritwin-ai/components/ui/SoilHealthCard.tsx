import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Easing, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getSoilByFarm, getSoilFertilityByFarm, SoilData, SoilFertilityResponse } from '../../services/soil';

export const SoilHealthCard = ({ farmId }: { farmId: number }) => {
  const [soil, setSoil] = useState<SoilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fertilityResult, setFertilityResult] = useState<SoilFertilityResponse | null>(null);
  const [fertilityError, setFertilityError] = useState(false);
  const [isApiError, setIsApiError] = useState(false);

  useEffect(() => {
    if (!farmId) return;
    let isMounted = true;
    setLoading(true);
    setSoil(null);
    setError(false);
    setIsApiError(false);
    setFertilityResult(null);
    setFertilityError(false);
    
    getSoilByFarm(farmId)
      .then(data => {
        if (isMounted) {
          setSoil(data);
          setError(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          if (err.response && err.response.status === 404) {
            console.log("No soil data exists yet for this farm.");
            setError(true);
            setIsApiError(false);
          } else {
            console.error("Error fetching soil:", err.response?.data || err.message || err);
            setError(true);
            setIsApiError(true);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    getSoilFertilityByFarm(farmId)
      .then(res => {
        if (isMounted) setFertilityResult(res);
      })
      .catch(err => {
        if (isMounted) {
          console.error("ML Prediction Error:", err);
          setFertilityError(true);
        }
      });

    return () => { isMounted = false; };
  }, [farmId]);

  const moistureAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (soil && soil.moisture !== undefined) {
      Animated.timing(moistureAnim, {
        toValue: soil.moisture,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [soil]);

  const widthInterpolated = moistureAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  if (loading) {
    return (
      <View className="bg-white dark:bg-slate-800 rounded-[24px] p-5 mb-6 shadow-sm border border-gray-100 dark:border-slate-700 items-center justify-center h-48 w-full">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="text-gray-500 dark:text-gray-400 font-medium mt-3">Loading soil details...</Text>
      </View>
    );
  }

  if (error || !soil) {
    if (isApiError) {
      return (
        <View className="bg-white dark:bg-slate-800 rounded-[24px] p-5 mb-6 shadow-sm border border-gray-100 dark:border-slate-700 items-center justify-center min-h-[192px] w-full">
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text className="text-red-500 font-bold mt-2 text-lg">Unable to load soil details</Text>
        </View>
      );
    }
    return (
      <View className="bg-white dark:bg-slate-800 rounded-[24px] p-5 mb-6 shadow-sm border border-gray-100 dark:border-slate-700 items-center justify-center min-h-[192px] w-full">
        <MaterialIcons name="eco" size={48} color="#d1d5db" />
        <Text className="text-gray-500 dark:text-gray-400 font-bold mt-2 text-lg">No soil data available for this farm.</Text>
        <Text className="text-gray-400 text-sm mt-1 mb-4">Please add soil data for this farm.</Text>
        
        <TouchableOpacity 
          className="bg-green-600 px-6 py-2.5 rounded-xl flex-row items-center shadow-sm"
          onPress={() => {
            const { router } = require('expo-router');
            router.push(`/(farm)/edit-soil?id=${farmId}`);
          }}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text className="text-white font-bold ml-1">Add Soil Data</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use dynamic soil data from DB, fallback to some constants for AI insights
  const isIrrigationRequired = soil.moisture < 40;
  
  const soilData = {
    title: '🌍 SOIL DETAILS',
    lastUpdated: soil.created_at ? new Date(soil.created_at).toLocaleDateString() : 'Just now',
    score: fertilityResult?.health_score ?? 0,
    fertilityStatus: fertilityResult?.status ?? 'Unknown',
    soilType: soil.soil_type,
    moisture: soil.moisture,
    pH: soil.ph,
    nitrogen: soil.nitrogen,
    phosphorus: soil.phosphorus,
    potassium: soil.potassium,
    insightTitle: '🤖 Irrigation Status',
    insightMessage: isIrrigationRequired 
      ? 'Irrigation Required. Soil moisture is below 40%.'
      : 'Irrigation Not Required. Soil moisture is adequate.',
    recommendations: isIrrigationRequired
      ? ['Schedule irrigation immediately', 'Check water source']
      : ['No irrigation needed today', 'Monitor soil after rainfall'],
    insightColor: isIrrigationRequired ? 'blue' : 'green'
  };

  // Helper component for Nutrients to safely handle Tailwind classes
  const NutrientCard = ({ label, emoji, level }: { label: string, emoji: string, level: string }) => {
    const isHigh = level.toLowerCase() === 'high';
    const isMedium = level.toLowerCase() === 'medium';
    
    return (
      <View className={`items-center flex-1 mx-1 p-3 rounded-2xl border border-gray-100 dark:border-slate-700 ${isHigh ? 'bg-green-50 dark:bg-green-900/20' : isMedium ? 'bg-orange-50' : 'bg-red-50 dark:bg-red-900/20'}`}>
        <Text className="text-xl mb-1">{emoji}</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-wider">{label}</Text>
        <View className="flex-row items-center">
          <MaterialIcons 
            name={isHigh ? 'arrow-upward' : isMedium ? 'horizontal-rule' : 'arrow-downward'} 
            size={14} 
            color={isHigh ? '#16a34a' : isMedium ? '#f97316' : '#ef4444'} 
          />
          <Text className={`font-extrabold text-sm ml-1 ${isHigh ? 'text-green-600' : isMedium ? 'text-orange-500' : 'text-red-500'}`}>
            {level}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="w-full mb-6">
      {/* Main Widget Container */}
      <View className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
        
        <View className="flex-row justify-between items-start mb-6">
          <View>
            <Text className="text-2xl font-extrabold text-green-800">{soilData.title}</Text>
            <Text className="text-gray-400 text-xs mt-1 font-medium">Last Updated: {soilData.lastUpdated}</Text>
          </View>
          <View className="flex-col items-end">
            <View className="bg-green-100 px-3 py-1.5 rounded-2xl flex-row items-center border border-green-200 shadow-sm mb-2">
              <Text className="text-green-800 font-bold text-sm">🟢 {soilData.score}/100</Text>
            </View>
            <TouchableOpacity 
              className="bg-gray-100 px-3 py-1.5 rounded-xl flex-row items-center border border-gray-200"
              onPress={() => {
                const { router } = require('expo-router');
                router.push(`/(farm)/edit-soil?id=${farmId}`);
              }}
            >
              <MaterialIcons name="edit" size={14} color="#4b5563" />
              <Text className="text-gray-600 dark:text-gray-300 font-bold text-xs ml-1">Update Soil</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50">
          <Text className="text-gray-800 dark:text-white font-bold text-sm mb-3">🌱 Soil Fertility Status</Text>
          {fertilityError ? (
            <Text className="text-red-500 font-medium text-sm">Unable to analyze soil fertility</Text>
          ) : !fertilityResult ? (
            <ActivityIndicator size="small" color="#16a34a" className="self-start" />
          ) : (
            <View>
              {fertilityResult.model_used ? (
                <Text className="text-green-600 font-medium text-sm mb-2">✅ ML Model Active: {fertilityResult.fertility}</Text>
              ) : (
                <View>
                  <Text className="text-orange-600 font-medium text-sm mb-2">⚠️ {fertilityResult.message}</Text>
                  <Text className="text-gray-800 dark:text-white font-bold text-sm mb-2">{fertilityResult.fertility}</Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Missing Features for ML</Text>
                  <View className="flex-row flex-wrap">
                    {fertilityResult.missing_features?.map((f: string, i: number) => (
                      <View key={i} className="bg-gray-100 rounded px-2 py-1 mr-2 mb-2 border border-gray-200">
                        <Text className="text-gray-600 dark:text-gray-300 text-xs font-bold">{f}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Moisture Animated Progress Section */}
        <View className="mb-5 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
          <View className="flex-row justify-between items-end mb-3">
            <View className="flex-row items-center">
              <View className="bg-blue-100 p-2 rounded-full mr-2">
                <Text className="text-base">💧</Text>
              </View>
              <Text className="text-gray-700 dark:text-gray-200 font-bold text-base">Soil Moisture</Text>
            </View>
            <Text className="text-blue-600 font-extrabold text-2xl">{soilData.moisture}%</Text>
          </View>
          <View className="w-full h-3 bg-blue-100/50 rounded-full overflow-hidden">
            <Animated.View 
              className="h-full bg-blue-50 dark:bg-blue-900/200 rounded-full" 
              style={{ width: widthInterpolated }} 
            />
          </View>
        </View>

        {/* Soil Type & pH Level Cards */}
        <View className="flex-row justify-between mb-5">
          <View className="w-[48%] bg-gray-50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 items-center">
            <Text className="text-2xl mb-1">🌱</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1 uppercase font-bold tracking-wider">Soil Type</Text>
            <Text className="text-gray-800 dark:text-white font-bold text-base">{soilData.soilType}</Text>
          </View>
          
          <View className="w-[48%] bg-gray-50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 items-center">
            <Text className="text-2xl mb-1">🧪</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1 uppercase font-bold tracking-wider">pH Level</Text>
            <Text className="text-gray-800 dark:text-white font-bold text-base">{soilData.pH}</Text>
          </View>
        </View>

        {/* Nutrients Row */}
        <Text className="text-gray-800 dark:text-white font-bold text-sm mb-3 ml-1">Nutrient Levels</Text>
        <View className="flex-row justify-between mb-6">
          <NutrientCard label="Nitrogen" emoji="🟩" level={soilData.nitrogen} />
          <NutrientCard label="Phosphorus" emoji="🟧" level={soilData.phosphorus} />
          <NutrientCard label="Potassium" emoji="🟪" level={soilData.potassium} />
        </View>

        {/* AI Insight Card */}
        <View className={`bg-${soilData.insightColor}-50 p-4 rounded-2xl border border-${soilData.insightColor}-100 mb-4`}>
          <View className="flex-row items-center mb-2">
            <Text className="text-lg mr-2">🤖</Text>
            <Text className={`text-${soilData.insightColor}-800 font-bold text-base`}>{soilData.insightTitle}</Text>
          </View>
          <Text className={`text-${soilData.insightColor}-700 leading-5 text-sm font-medium`}>
            "{soilData.insightMessage}"
          </Text>
        </View>

        {/* Recommendations Card */}
        <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="lightbulb-outline" size={20} color="#f59e0b" />
            <Text className="text-gray-800 dark:text-white font-bold text-base ml-1">Recommended Action</Text>
          </View>
          
          {soilData.recommendations.map((rec, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <View className="bg-white dark:bg-slate-800 rounded-full p-1 mr-3 shadow-sm border border-gray-100 dark:border-slate-700">
                <MaterialIcons name="check" size={14} color="#10b981" />
              </View>
              <Text className="text-gray-600 dark:text-gray-300 flex-1 text-sm font-medium">{rec}</Text>
            </View>
          ))}
        </View>

      </View>
    </View>
  );
};
