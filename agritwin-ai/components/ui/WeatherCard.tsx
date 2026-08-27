import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getWeather, WeatherData } from '../../services/weather';

export const WeatherCard = ({ city }: { city: string }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) return;
    
    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const cityName = city.split(',')[0].trim();
        const weatherData = await getWeather(cityName);
        setWeather(weatherData);
      } catch (err: any) {
        console.error('Error fetching weather:', err);
        setWeatherError('Could not load weather data.');
      } finally {
        setWeatherLoading(false);
      }
    };
    
    fetchWeather();
  }, [city]);

  if (weatherLoading) {
    return (
      <View className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4 mb-6 border border-blue-100 dark:border-slate-700 flex-row items-center justify-center h-24">
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  if (weatherError) {
    return (
      <View className="bg-red-50 dark:bg-slate-800 rounded-xl p-4 mb-6 border border-red-100 dark:border-red-900/30">
        <Text className="text-red-500 text-center">{weatherError}</Text>
      </View>
    );
  }

  if (!weather) return null;
  
  // Ensure (Demo) text is stripped from the API description
  const cleanDescription = weather.description.replace(/\s*\(Demo\)/i, '');

  return (
    <View className="bg-blue-50 dark:bg-slate-800 rounded-xl p-5 mb-6 shadow-sm flex-row justify-between items-center border border-blue-100 dark:border-slate-700">
      <View>
        <Text className="text-blue-800 dark:text-blue-200 text-sm font-medium"><MaterialIcons name="location-on" size={12} /> {weather.city}</Text>
        <Text className="text-blue-900 dark:text-white text-4xl font-bold my-1">{Math.round(weather.temperature)}°C</Text>
        <Text className="text-blue-700 dark:text-blue-100 capitalize">{cleanDescription}</Text>
      </View>
      <View className="items-center">
        <Image 
          source={{ uri: `https://openweathermap.org/img/wn/${weather.icon}@2x.png` }} 
          style={{ width: 64, height: 64 }} 
        />
        <View className="flex-row items-center mt-1">
          <MaterialIcons name="water-drop" size={14} color="#3b82f6" />
          <Text className="text-blue-700 dark:text-blue-100 text-xs ml-1">{weather.humidity}%</Text>
        </View>
      </View>
    </View>
  );
};
