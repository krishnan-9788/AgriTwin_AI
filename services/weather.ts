import api from './api';

export interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  humidity: number;
  icon: string;
}

export async function getWeather(city: string): Promise<WeatherData> {
  const response = await api.get('/weather/', {
    params: { city },
  });

  return response.data;
}
