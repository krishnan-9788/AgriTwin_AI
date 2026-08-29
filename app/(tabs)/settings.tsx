import React, { useEffect, useState } from 'react';
import { View, Text, Switch, ScrollView } from 'react-native';
import { useColorScheme } from 'nativewind';

// Simple global state for push notifications to persist during the session
let globalNotificationsState = true;

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(globalNotificationsState);
  const { colorScheme, toggleColorScheme } = useColorScheme();
  
  const handleNotifToggle = (val: boolean) => {
    globalNotificationsState = val;
    setNotifications(val);
  };

  const isDark = colorScheme === 'dark';

  return (
    <ScrollView className="flex-1 bg-background px-4 py-6 dark:bg-slate-900">
      <View className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm mb-6">
        <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Preferences</Text>
        
        <View className="flex-row justify-between items-center py-2 border-b border-gray-50 dark:border-slate-700">
          <Text className="text-gray-700 dark:text-gray-200 dark:text-gray-300 text-base">Push Notifications</Text>
          <Switch 
            value={notifications} 
            onValueChange={handleNotifToggle} 
            trackColor={{ true: '#2E7D32', false: '#d1d5db' }}
          />
        </View>
        
        <View className="flex-row justify-between items-center py-2">
          <Text className="text-gray-700 dark:text-gray-200 dark:text-gray-300 text-base">Dark Mode</Text>
          <Switch 
            value={isDark} 
            onValueChange={toggleColorScheme} 
            trackColor={{ true: '#2E7D32', false: '#d1d5db' }}
          />
        </View>
      </View>
      
      <View className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm mb-6">
        <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">About</Text>
        
        <View className="py-2">
          <Text className="text-gray-700 dark:text-gray-200 dark:text-gray-300 text-base">Version 1.0.0</Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-1">AgriTwin AI © 2026</Text>
        </View>
      </View>
    </ScrollView>
  );
}
