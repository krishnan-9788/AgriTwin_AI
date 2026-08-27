import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/auth';
import { getUserFarms } from '../../services/farm';
import { WeatherCard } from '../../components/ui/WeatherCard';
import { AlertCard, AlertItemProps } from '../../components/ui/AlertCard';
import { Farm } from '../../types/farm';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../services/api';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [alerts, setAlerts] = useState<AlertItemProps[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  
  const selectedFarm = farms.find(f => f.id === selectedFarmId) || (farms.length > 0 ? farms[0] : null);

  const fetchFarms = async () => {
    if (!user) return;
    try {
      const data = await getUserFarms(user.uid);
      setFarms(data);
      if (data && data.length > 0 && !selectedFarmId) {
        setSelectedFarmId(data[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAlertsForFarm = async (farmId: number) => {
    try {
      const alertsRes = await api.get(`/alerts/${farmId}`);
      if (alertsRes.data && alertsRes.data.alerts) {
        setAlerts(alertsRes.data.alerts);
      }
    } catch (alertError) {
      console.error("Failed to fetch alerts", alertError);
      setAlerts([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFarms();
    }, [user])
  );

  React.useEffect(() => {
    if (selectedFarmId) {
      fetchAlertsForFarm(selectedFarmId);
    }
  }, [selectedFarmId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFarms();
    if (selectedFarmId) await fetchAlertsForFarm(selectedFarmId);
    setRefreshing(false);
  };

  return (
    <ScrollView 
      className="flex-1 bg-background dark:bg-slate-900 px-4 py-6"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-gray-500 dark:text-gray-400 text-sm">Welcome back,</Text>
          <Text className="text-2xl font-bold text-gray-800 dark:text-white">{user?.displayName || 'Farmer'}</Text>
        </View>
        <TouchableOpacity 
          className="bg-primary h-12 w-12 rounded-full items-center justify-center"
          onPress={() => router.push('/(farm)/create-farm')}
        >
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {farms.length > 1 && (
        <View className="mb-6">
          <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">Viewing Weather & Alerts for</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {farms.map(f => (
              <TouchableOpacity 
                key={f.id} 
                onPress={() => setSelectedFarmId(f.id)}
                className={`mr-2 px-4 py-2 rounded-full border ${selectedFarmId === f.id ? 'bg-primary border-primary' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}
              >
                <Text className={`font-semibold ${selectedFarmId === f.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{f.farmName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {selectedFarm && <WeatherCard city={selectedFarm.location} />}

      <Text className="text-xl font-bold text-gray-800 dark:text-white mb-4">Your Farms</Text>
      
      {farms.length === 0 ? (
        <View className="bg-white dark:bg-slate-800 rounded-xl p-6 items-center border border-gray-100 dark:border-slate-700 shadow-sm mb-6">
          <Text className="text-2xl mb-2">🌾</Text>
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-2">No Farm Configured</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-4">Create your farm to receive farm-specific smart alerts.</Text>
          <TouchableOpacity 
            className="bg-secondary px-6 py-2 rounded-lg"
            onPress={() => router.push('/(farm)/create-farm')}
          >
            <Text className="text-white font-semibold">Create Farm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        farms.map((farm) => (
          <TouchableOpacity 
            key={farm.id} 
            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm mb-4"
            onPress={() => router.push(`/(farm)/farm-profile?id=${farm.id}` as any)}
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-lg font-bold text-gray-800 dark:text-white">{farm.farmName}</Text>
              <View className="bg-primary/10 px-2 py-1 rounded">
                <Text className="text-primary text-xs font-semibold">{farm.size} Acres</Text>
              </View>
            </View>
            
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="location-on" size={16} color="#6b7280" />
              <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1">{farm.location}</Text>
            </View>
            
            <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
              <View>
                <Text className="text-gray-400 text-xs">Current Crop</Text>
                <Text className="text-gray-700 dark:text-gray-200 font-medium">{farm.currentCrop}</Text>
              </View>
              <View>
                <Text className="text-gray-400 text-xs">Soil Type</Text>
                <Text className="text-gray-700 dark:text-gray-200 font-medium">{farm.soilType}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      {farms.length > 0 && alerts.length > 0 && selectedFarm && (
        <View className="mb-6">
          <View className="flex-row items-center mb-4 mt-2">
            <MaterialIcons name="notifications-active" size={24} color="#f59e0b" />
            <Text className="text-xl font-bold text-gray-800 dark:text-white ml-2">Smart Farm Alerts</Text>
          </View>
          
          <View className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm mb-4">
             <Text className="text-gray-800 dark:text-gray-200 font-semibold mb-2">🌾 {selectedFarm.farmName}</Text>
             <Text className="text-gray-800 dark:text-gray-200 font-semibold mb-2">📍 {selectedFarm.location}</Text>
             <Text className="text-gray-800 dark:text-gray-200 font-semibold">🌱 Crop: {selectedFarm.currentCrop}</Text>
          </View>

          <View className="mb-4">
            {alerts.map((alert, index) => (
              <AlertCard key={index} {...alert} />
            ))}
          </View>
        </View>
      )}

      <Text className="text-xl font-bold text-gray-800 dark:text-white mt-2 mb-4">Quick Actions</Text>
      
      <View className="flex-row flex-wrap justify-between">
        {[
          { title: 'Smart Watering', icon: 'water-drop', color: '#3b82f6' },
          { title: 'Crop Recommendation', icon: 'psychology', color: '#10b981' },
          { title: 'Disease Detection', icon: 'bug-report', color: '#ef4444' },
          { title: 'Yield Prediction', icon: 'trending-up', color: '#8b5cf6' },
          { title: 'Digital Twin', icon: 'memory', color: '#6366f1' },
          { title: 'Market Prices', icon: 'storefront', color: '#f59e0b' },
        ].map((action, idx) => (
          <TouchableOpacity 
            key={idx} 
            className="bg-white dark:bg-slate-800 w-[48%] p-4 rounded-xl items-center border border-gray-100 dark:border-slate-700 shadow-sm mb-4"
            onPress={() => {
              if (action.title === 'Smart Watering') {
                if (farms.length > 0) {
                  router.push(`/(farm)/smart-watering?id=${farms[0].id}` as any);
                } else {
                  alert(`Please create a farm first to use smart watering.`);
                }
              } else if (action.title === 'Crop Recommendation') {
                if (farms.length > 0) {
                  router.push(`/(farm)/crop-recommendation?id=${farms[0].id}` as any);
                } else {
                  alert(`Please create a farm first to get crop recommendations.`);
                }
              } else if (action.title === 'Disease Detection') {
                router.push('/(farm)/disease-detection' as any);
              } else if (action.title === 'Digital Twin') {
                if (farms.length > 0) {
                  router.push(`/(farm)/digital-twin?id=${farms[0].id}` as any);
                } else {
                  router.push('/(farm)/digital-twin' as any);
                }
              } else if (action.title === 'Yield Prediction') {
                if (farms.length > 0) {
                  router.push(`/(farm)/yield-prediction?id=${farms[0].id}` as any);
                } else {
                  alert(`Please create a farm first to view yield prediction.`);
                }
              } else if (action.title === 'Market Prices') {
                if (farms.length > 0) {
                  router.push(`/(farm)/market-price?id=${farms[0].id}` as any);
                } else {
                  alert(`Please create a farm first to view market prices.`);
                }
              } else {
                alert(`${action.title} coming soon!`);
              }
            }}
          >
            <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: `${action.color}15` }}>
              <MaterialIcons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text className="text-gray-700 dark:text-gray-200 font-medium text-center">{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View className="h-10" />
    </ScrollView>
  );
}
