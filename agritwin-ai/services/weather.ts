import api from './api';

export interface WeatherData {
  city: string;
  temperature: number;
  humidity: number;
  description: string;
  wind_speed: number;
  feels_like: number;
  pressure: number;
  icon: string;
}

export const getWeather = async (city: string): Promise<WeatherData> => {
  const response = await api.get(`/weather?city=${encodeURIComponent(city)}`);
  return response.data;
};
