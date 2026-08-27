import api from './api';

export interface SoilData {
  id: number;
  farm_id: number;
  soil_type: string;
  moisture: number;
  ph: number;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  created_at: string;
}

export interface SoilCreate {
  farm_id: number;
  soil_type: string;
  moisture: number;
  ph: number;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
}

export interface SoilUpdate {
  soil_type?: string;
  moisture?: number;
  ph?: number;
  nitrogen?: string;
  phosphorus?: string;
  potassium?: string;
}

export const createSoil = async (data: SoilCreate): Promise<SoilData> => {
  const response = await api.post('/soil/', data);
  return response.data;
};

export const getSoilByFarm = async (farmId: number): Promise<SoilData> => {
  const response = await api.get(`/soil/${farmId}`);
  return response.data;
};

export const updateSoil = async (farmId: number, data: SoilUpdate): Promise<SoilData> => {
  const response = await api.put(`/soil/${farmId}`, data);
  return response.data;
};

export interface SoilFertilityResponse {
  farm_id: number;
  model_used: boolean;
  message: string;
  missing_features: string[];
}

export const getSoilFertilityByFarm = async (farmId: number): Promise<SoilFertilityResponse> => {
  const response = await api.get(`/soil/${farmId}/fertility`);
  return response.data;
};
