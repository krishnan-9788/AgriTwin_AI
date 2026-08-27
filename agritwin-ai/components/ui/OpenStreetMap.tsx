import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { geocodeLocation, Coordinates } from '../../services/location';

interface OpenStreetMapProps {
  location: string;
  farmName: string;
  cropName?: string;
  areaAcres?: number;
}

export const OpenStreetMap: React.FC<OpenStreetMapProps> = ({ location, farmName, cropName, areaAcres }) => {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchLocation = async () => {
      if (!location) {
        setCoords(null);
        setError(true);
        return;
      }

      setLoading(true);
      setError(false);
      const result = await geocodeLocation(location);
      
      if (isMounted) {
        if (result) {
          setCoords(result);
        } else {
          setError(true);
        }
        setLoading(false);
      }
    };

    fetchLocation();
    return () => { isMounted = false; };
  }, [location]);

  if (!location) {
    return (
      <View className="w-full h-48 bg-blue-50 dark:bg-blue-900/20/50 rounded-2xl items-center justify-center border border-blue-100 dark:border-blue-900/30">
        <MaterialIcons name="location-off" size={32} color="#94a3b8" />
        <Text className="text-gray-500 dark:text-gray-400 font-bold mt-2">Farm location unavailable</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="w-full h-48 bg-blue-50 dark:bg-blue-900/20/50 rounded-2xl items-center justify-center border border-blue-100 dark:border-blue-900/30">
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text className="text-blue-500 font-bold mt-2">Finding farm location...</Text>
      </View>
    );
  }

  if (error || !coords) {
    return (
      <View className="w-full h-48 bg-red-50 dark:bg-red-900/20/50 rounded-2xl items-center justify-center border border-red-100">
        <MaterialIcons name="error-outline" size={32} color="#ef4444" />
        <Text className="text-red-500 font-bold mt-2 text-xs">Unable to locate this farm on the map.</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">Location: {location}</Text>
      </View>
    );
  }

  // Create a small bounding box around the point to center it
  const offset = 0.01;
  const bbox = `${coords.longitude - offset},${coords.latitude - offset},${coords.longitude + offset},${coords.latitude + offset}`;
  
  // Official OpenStreetMap Embed URL using mapnik layer
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.latitude},${coords.longitude}`;

  return (
    <View className="w-full h-48 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 overflow-hidden relative shadow-sm">
      {Platform.OS === 'web' ? (
        <iframe 
          src={mapUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={`Map of ${farmName}`}
        />
      ) : (
        <WebView 
          source={{ uri: mapUrl }} 
          style={{ flex: 1 }}
          scrollEnabled={true}
        />
      )}
      
      {/* Floating Info Badge Overlay */}
      <View className="absolute bottom-3 left-3 bg-white dark:bg-slate-800/95 px-3 py-2 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 backdrop-blur-md">
        <View className="flex-row items-center">
          <MaterialIcons name="location-on" size={14} color="#ef4444" />
          <Text className="text-gray-800 dark:text-white font-extrabold text-xs ml-1">{farmName}</Text>
        </View>
        <Text className="text-gray-500 dark:text-gray-400 font-medium text-[10px] ml-4 mt-0.5">{location}</Text>
        {cropName && (
          <Text className="text-blue-600 font-bold text-[10px] ml-4 mt-0.5">Crop: {cropName}</Text>
        )}
        {areaAcres && (
          <Text className="text-green-600 font-bold text-[10px] ml-4 mt-0.5">Area: {areaAcres} Acres</Text>
        )}
      </View>
    </View>
  );
};
