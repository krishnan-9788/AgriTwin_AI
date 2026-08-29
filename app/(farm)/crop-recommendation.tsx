import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../services/api';

export default function CropRecommendationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendationData, setRecommendationData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRecommendation = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.get(`/farms/${id}/recommendation`);
        if (isMounted) {
          setRecommendationData(res.data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Crop Recommendation Error:", err);
          setError(err.response?.data?.detail || "Unable to load crop recommendations");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchRecommendation();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-background dark:bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Analyzing agronomic models...</Text>
      </View>
    );
  }

  if (error || !recommendationData) {
    return (
      <View className="flex-1 bg-background dark:bg-slate-900 px-4 py-6">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
            <MaterialIcons name="arrow-back" size={24} color="#16a34a" />
          </TouchableOpacity>
        </View>
        <View className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-slate-700 items-center justify-center min-h-[300px]">
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text className="text-red-500 font-bold mt-2 text-lg text-center">{error || "Failed to load data"}</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm text-center mt-2">Please ensure you have created a valid farm profile.</Text>
        </View>
      </View>
    );
  }

  const { best_crop, recommendations } = recommendationData;

  return (
    <ScrollView className="flex-1 bg-background dark:bg-slate-900 px-4 py-6 pb-12">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
          <MaterialIcons name="arrow-back" size={24} color="#16a34a" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-white">AI Crop Engine</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm">Dynamic profitability comparison</Text>
        </View>
      </View>

      {/* BEST CROP HIGHLIGHT */}
      <View className="bg-[#1e3a8a] rounded-[24px] p-6 shadow-xl border border-blue-800 mb-8 overflow-hidden">
        {/* Abstract background decorations */}
        <View className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 dark:bg-blue-900/200/20 rounded-full" />
        <View className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/10 rounded-full" />
        
        <View className="flex-row items-center mb-2 z-10">
          <MaterialIcons name="emoji-events" size={24} color="#fbbf24" />
          <Text className="text-blue-200 font-bold text-xs ml-2 tracking-widest uppercase">Best Recommended Crop</Text>
        </View>
        <Text className="text-4xl font-extrabold text-white mb-2 z-10">{best_crop.crop}</Text>
        
        <View className="flex-row items-center bg-blue-800/50 self-start px-3 py-1.5 rounded-full mb-6 z-10 border border-blue-700">
          <MaterialIcons name="bolt" size={16} color="#fbbf24" />
          <Text className="text-blue-100 font-bold ml-1 text-xs">Suitability Score: {best_crop.score}%</Text>
        </View>

        <View className="bg-black/20 p-4 rounded-xl border border-white/10 z-10">
          <Text className="text-blue-200 font-bold text-sm mb-3">Why AgriTwin recommends this crop:</Text>
          {best_crop.reasons.map((reason: string, idx: number) => {
            const isPositive = reason.startsWith('+');
            return (
              <View key={idx} className="flex-row items-start mb-2">
                <MaterialIcons name={isPositive ? 'check-circle' : 'warning'} size={16} color={isPositive ? '#4ade80' : '#fb923c'} />
                <Text className="text-white text-xs ml-2 flex-1 leading-relaxed">{reason}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ALL CROPS COMPARISON */}
      <Text className="text-xl font-bold text-gray-800 dark:text-white mb-4 ml-1">Crop Economics Comparison</Text>
      
      {recommendations.map((item: any, index: number) => {
        const isWinner = item.rank === 1;
        const eco = item.economics;
        
        return (
          <View 
            key={index} 
            className={`bg-white dark:bg-slate-800 rounded-2xl p-5 mb-4 shadow-sm border ${isWinner ? 'border-blue-400 shadow-blue-100' : 'border-gray-100 dark:border-slate-700'}`}
          >
            <View className="flex-row justify-between items-start mb-4 pb-4 border-b border-gray-50">
              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isWinner ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Text className={`font-black ${isWinner ? 'text-blue-700' : 'text-gray-500 dark:text-gray-400'}`}>#{item.rank}</Text>
                </View>
                <View>
                  <Text className="text-lg font-bold text-gray-800 dark:text-white">{item.crop}</Text>
                  <Text className={`text-xs font-bold ${item.suitability_score >= 80 ? 'text-green-600' : item.suitability_score >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                    Suitability: {item.suitability_score}%
                  </Text>
                </View>
              </View>
              
              <View className="items-end">
                <Text className="text-gray-400 text-[10px] font-bold uppercase">Exp. Profit</Text>
                <Text className={`font-black text-lg ${eco.expected_profit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {eco.expected_profit !== null && eco.expected_profit !== undefined ? `₹${eco.expected_profit.toLocaleString('en-IN')}` : 'Unavailable'}
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] bg-gray-50 p-3 rounded-xl border border-gray-100 dark:border-slate-700 mb-3">
                <Text className="text-gray-400 text-xs font-medium">Expected Yield</Text>
                <Text className="text-gray-800 dark:text-white font-bold">
                  {item.estimated_yield !== null && item.estimated_yield !== undefined ? `${item.estimated_yield} Quintals` : 'Unavailable'}
                </Text>
              </View>
              
              <View className="w-[48%] bg-gray-50 p-3 rounded-xl border border-gray-100 dark:border-slate-700 mb-3">
                <Text className="text-gray-400 text-xs font-medium">Market Price</Text>
                <Text className="text-gray-800 dark:text-white font-bold">
                  {eco.market_price !== null && eco.market_price !== undefined ? `₹${eco.market_price.toLocaleString('en-IN')}/Q` : 'Unavailable'}
                </Text>
              </View>
              
              <View className="w-[48%] bg-gray-50 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                <Text className="text-gray-400 text-xs font-medium">Expected Revenue</Text>
                <Text className="text-gray-800 dark:text-white font-bold">
                  {eco.expected_revenue !== null && eco.expected_revenue !== undefined ? `₹${eco.expected_revenue.toLocaleString('en-IN')}` : 'Unavailable'}
                </Text>
              </View>
              
              <View className="w-[48%] bg-gray-50 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                <Text className="text-gray-400 text-xs font-medium">Est. Production Cost</Text>
                <Text className="text-gray-800 dark:text-white font-bold">
                  {eco.total_cost !== null && eco.total_cost !== undefined ? `₹${eco.total_cost.toLocaleString('en-IN')}` : 'Unavailable'}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
      
      <View className="h-10" />
    </ScrollView>
  );
}
