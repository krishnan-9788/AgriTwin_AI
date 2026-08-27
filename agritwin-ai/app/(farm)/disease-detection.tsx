import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { predictDisease } from '../../services/disease';

export default function DiseaseDetectionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ disease: string; confidence: number; } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission to access camera roll is required!");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setImageAsset(pickerResult.assets[0]);
        setResult(null);
        setError(null);
      }
    } catch (err) {
      setError("Error selecting image.");
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission to access camera is required!");
        return;
      }

      const cameraResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!cameraResult.canceled && cameraResult.assets && cameraResult.assets.length > 0) {
        setImageAsset(cameraResult.assets[0]);
        setResult(null);
        setError(null);
      }
    } catch (err) {
      setError("Error taking photo.");
    }
  };

  const analyzeImage = async () => {
    if (!imageAsset) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const data = await predictDisease(imageAsset, id as string);
      setResult({
        disease: data.disease,
        confidence: data.confidence,
      });
    } catch (err: any) {
      setError(err.message || "Failed to analyze image.");
    } finally {
      setLoading(false);
    }
  };

  const getRecommendation = (diseaseName: string) => {
    const d = diseaseName.toLowerCase();
    if (d.includes('healthy')) {
      return "Your plant is perfectly healthy! Continue regular watering and maintenance.";
    } else if (d.includes('blight')) {
      return "Remove and destroy affected leaves immediately. Apply appropriate fungicide and ensure good air circulation.";
    } else if (d.includes('mildew')) {
      return "Apply a sulfur or copper-based fungicide. Avoid overhead watering and reduce humidity if possible.";
    } else if (d.includes('rust')) {
      return "Prune infected parts and apply a fungicide. Avoid wetting leaves during watering.";
    } else if (d.includes('spot')) {
      return "Remove spotted leaves. Use a copper-based spray and ensure soil has good drainage.";
    } else {
      return "Isolate the plant if possible. Monitor progression and consult local agricultural extension for specific treatments.";
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-5 py-6 bg-red-600 rounded-b-[40px] mb-6 shadow-md pt-16">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/dashboard' as any)} className="mb-4 bg-black/20 dark:bg-slate-800/40 w-10 h-10 rounded-full items-center justify-center">
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-3xl font-extrabold mb-2">🌿 Disease Detection</Text>
        <Text className="text-red-100 text-sm font-medium">Identify plant diseases instantly using AI.</Text>
      </View>

      <View className="px-4 pb-12">
        <View className="bg-white dark:bg-slate-800 rounded-[24px] p-6 mb-6 shadow-sm border border-gray-100 dark:border-slate-700">
          
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4">Select a Leaf Image</Text>
          
          <View className="flex-row justify-between mb-6">
            <TouchableOpacity 
              onPress={takePhoto}
              className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl items-center w-[48%] border border-red-100"
            >
              <MaterialIcons name="camera-alt" size={32} color="#ef4444" />
              <Text className="text-red-600 font-bold mt-2">Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={pickImage}
              className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl items-center w-[48%] border border-blue-100 dark:border-blue-900/30"
            >
              <MaterialIcons name="photo-library" size={32} color="#3b82f6" />
              <Text className="text-blue-600 font-bold mt-2">Gallery</Text>
            </TouchableOpacity>
          </View>

          {imageAsset ? (
            <View className="items-center mb-6">
              <Image 
                source={{ uri: imageAsset.uri }} 
                className="w-full h-64 rounded-2xl mb-4 border border-gray-200"
                resizeMode="cover"
              />
              
              {!result && !loading && (
                <TouchableOpacity 
                  onPress={analyzeImage}
                  className="bg-green-600 w-full py-4 rounded-xl flex-row items-center justify-center shadow-sm"
                >
                  <MaterialIcons name="analytics" size={24} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Detect Disease</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View className="w-full h-48 bg-gray-100 rounded-2xl items-center justify-center border-2 border-dashed border-gray-300">
              <MaterialIcons name="image-search" size={48} color="#9ca3af" />
              <Text className="text-gray-400 mt-2 font-medium">No image selected</Text>
            </View>
          )}

          {loading && (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#16a34a" />
              <Text className="text-gray-600 dark:text-gray-300 font-medium mt-4">Analyzing your plant using AI...</Text>
            </View>
          )}

          {error && (
            <View className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 mt-4 flex-row items-center">
              <MaterialIcons name="error-outline" size={24} color="#ef4444" />
              <Text className="text-red-700 font-medium ml-2 flex-1">{error}</Text>
            </View>
          )}

          {result && (
            <View className="mt-2 bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl border border-green-200">
              <View className="flex-row items-center mb-4 pb-4 border-b border-green-200">
                <View className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm mr-3">
                  <MaterialIcons name={result.disease.toLowerCase().includes('healthy') ? "check-circle" : "warning"} size={28} color={result.disease.toLowerCase().includes('healthy') ? "#16a34a" : "#f59e0b"} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-green-700 font-bold uppercase tracking-wider">AI Prediction</Text>
                  <Text className="text-xl font-extrabold text-gray-800 dark:text-white">{result.disease}</Text>
                </View>
              </View>
              
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-600 dark:text-gray-300 font-medium">Confidence Score</Text>
                <View className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm">
                  <Text className="text-green-700 font-bold">{result.confidence}%</Text>
                </View>
              </View>

              <View className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-green-100 mt-2">
                <Text className="text-gray-800 dark:text-white font-bold mb-1">Recommendation</Text>
                <Text className="text-gray-600 dark:text-gray-300 text-sm leading-5">
                  {getRecommendation(result.disease)}
                </Text>
              </View>
              
              <TouchableOpacity 
                onPress={() => {
                  setImageAsset(null);
                  setResult(null);
                }}
                className="mt-6 border border-green-600 py-3 rounded-xl items-center"
              >
                <Text className="text-green-700 font-bold">Scan Another Leaf</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
