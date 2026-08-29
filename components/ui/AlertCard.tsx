import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Severity = 'info' | 'warning' | 'critical';
type AlertType = 'irrigation' | 'weather' | 'soil' | 'temperature';

export interface AlertItemProps {
  type: AlertType;
  severity: Severity;
  title: string;
  message: string;
  value?: string;
}

export function AlertCard({ type, severity, title, message, value }: AlertItemProps) {
  // Determine styling based on severity
  let bgClass = "bg-blue-50 dark:bg-blue-900/20";
  let borderClass = "border-blue-200 dark:border-blue-800";
  let iconColor = "#3b82f6"; // blue-500
  let titleClass = "text-blue-800 dark:text-blue-300";

  if (severity === 'warning') {
    bgClass = "bg-orange-50 dark:bg-orange-900/20";
    borderClass = "border-orange-200 dark:border-orange-800";
    iconColor = "#f97316"; // orange-500
    titleClass = "text-orange-800 dark:text-orange-300";
  } else if (severity === 'critical') {
    bgClass = "bg-red-50 dark:bg-red-900/20";
    borderClass = "border-red-200 dark:border-red-800";
    iconColor = "#ef4444"; // red-500
    titleClass = "text-red-800 dark:text-red-300";
  }

  // Determine icon based on type
  let iconName: any = "info";
  if (type === 'irrigation') iconName = "water-drop";
  else if (type === 'weather') iconName = "cloud";
  else if (type === 'soil') iconName = "grass";
  else if (type === 'temperature') iconName = "thermostat";

  return (
    <View className={`p-4 rounded-xl border ${bgClass} ${borderClass} mb-3 flex-row items-start`}>
      <View className="mr-3 mt-1">
        <MaterialIcons name={iconName} size={24} color={iconColor} />
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className={`font-bold text-sm ${titleClass}`}>{title}</Text>
          {value && (
            <Text className={`text-xs font-semibold ${titleClass} opacity-80`}>
              {value}
            </Text>
          )}
        </View>
        <Text className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
          {message}
        </Text>
      </View>
    </View>
  );
}
