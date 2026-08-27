import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '../../context/auth';
import { Button } from '../../components/ui/Button';
// Removed firebase auth

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView className="flex-1 bg-background dark:bg-slate-900 px-4 py-6">
      <View className="items-center mb-8 mt-4">
        <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-4">
          <Text className="text-white text-3xl font-bold">
            {user?.displayName?.charAt(0) || 'U'}
          </Text>
        </View>
        <Text className="text-2xl font-bold text-gray-800 dark:text-white">{user?.displayName || 'User'}</Text>
        <Text className="text-gray-500 dark:text-gray-400">{user?.email}</Text>
      </View>

      <View className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm mb-6">
        <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Account Info</Text>
        
        <View className="flex-row justify-between py-2 border-b border-gray-50">
          <Text className="text-gray-500 dark:text-gray-400">Name</Text>
          <Text className="text-gray-800 dark:text-white font-medium">{user?.displayName || 'N/A'}</Text>
        </View>
        
        <View className="flex-row justify-between py-2 border-b border-gray-50">
          <Text className="text-gray-500 dark:text-gray-400">Email</Text>
          <Text className="text-gray-800 dark:text-white font-medium">{user?.email}</Text>
        </View>
      </View>
      
      <Button 
        title="Sign Out" 
        variant="outline"
        onPress={() => logout()} 
      />
    </ScrollView>
  );
}
