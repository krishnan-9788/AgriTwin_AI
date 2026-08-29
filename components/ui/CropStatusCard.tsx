import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface CropStatusProps {
  cropName: string;
  growthStage: string;
  cropAge: number;
  harvestDays: number;
  healthStatus: string;
  growthPercentage: number;
  aiObservation: string;
  recommendedActions: string[];
}

export const CropStatusCard: React.FC<CropStatusProps> = ({
  cropName,
  growthStage,
  cropAge,
  harvestDays,
  healthStatus,
  growthPercentage,
  aiObservation,
  recommendedActions
}) => {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in card
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: growthPercentage,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [growthPercentage]);

  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  return (
    <Animated.View 
      style={{ opacity: fadeAnim }} 
      className="w-full mb-6"
    >
      <View className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
        
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-extrabold text-green-800">🌱 Crop Status</Text>
          <View className="bg-green-100 px-3 py-1.5 rounded-full border border-green-200">
            <Text className="text-green-800 font-bold text-xs uppercase tracking-wider">{healthStatus}</Text>
          </View>
        </View>

        {/* 2x2 Grid for Crop Details */}
        <View className="flex-row flex-wrap justify-between mb-5">
          <View className="w-[48%] bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl mb-4 border border-green-100 items-center justify-center">
            <Text className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Crop Name</Text>
            <Text className="text-green-800 font-bold text-lg">{cropName} 🌽</Text>
          </View>
          
          <View className="w-[48%] bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl mb-4 border border-green-100 items-center justify-center">
            <Text className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Growth Stage</Text>
            <Text className="text-green-800 font-bold text-lg text-center">{growthStage}</Text>
          </View>
          
          <View className="w-[48%] bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 items-center justify-center">
            <Text className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Crop Age</Text>
            <Text className="text-green-800 font-bold text-lg">{cropAge} Days</Text>
          </View>
          
          <View className="w-[48%] bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 items-center justify-center">
            <Text className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Expected Harvest</Text>
            <Text className="text-green-800 font-bold text-lg">{harvestDays} Days Left</Text>
          </View>
        </View>

        {/* Animated Progress Bar */}
        <View className="mb-6 bg-blue-50 dark:bg-blue-900/20/50 p-4 rounded-2xl border border-blue-50">
          <View className="flex-row justify-between items-end mb-3">
            <View className="flex-row items-center">
              <View className="bg-blue-100 p-2 rounded-full mr-2">
                <MaterialIcons name="trending-up" size={16} color="#3b82f6" />
              </View>
              <Text className="text-gray-700 dark:text-gray-200 font-bold text-sm">Growth Progress</Text>
            </View>
            <Text className="text-blue-600 font-extrabold text-xl">{growthPercentage}%</Text>
          </View>
          <View className="w-full h-3 bg-blue-100/50 rounded-full overflow-hidden">
            <Animated.View 
              className="h-full bg-blue-50 dark:bg-blue-900/200 rounded-full" 
              style={{ width: widthInterpolated }} 
            />
          </View>
        </View>

        {/* AI Observation */}
        <View className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 mb-4">
          <View className="flex-row items-center mb-2">
            <Text className="text-xl mr-2">🤖</Text>
            <Text className="text-green-800 font-bold text-base">AI Observation</Text>
          </View>
          <Text className="text-green-700 leading-5 text-sm font-medium">
            "{aiObservation}"
          </Text>
        </View>

        {/* Recommended Actions */}
        <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="lightbulb-outline" size={20} color="#f59e0b" />
            <Text className="text-gray-800 dark:text-white font-bold text-base ml-1">Recommended Actions</Text>
          </View>
          
          {recommendedActions.map((rec, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <View className="bg-white dark:bg-slate-800 rounded-full p-1 mr-3 shadow-sm border border-gray-100 dark:border-slate-700">
                <MaterialIcons name="check" size={14} color="#10b981" />
              </View>
              <Text className="text-gray-600 dark:text-gray-300 flex-1 text-sm font-medium">{rec}</Text>
            </View>
          ))}
        </View>

      </View>
    </Animated.View>
  );
};
