import api from './api';

export interface SoilData {
  soil_type: string;
  moisture: number;
  ph: number;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  n_val?: number;
  p_val?: number;
  k_val?: number;
  ec?: number;
  oc?: number;
  s?: number;
  zn?: number;
  fe?: number;
  cu?: number;
  mn?: number;
  b?: number;
  created_at?: string;
}

export interface SoilResponse extends SoilData {
  id: number;
  farm_id: number;
  created_at: string;
}

export interface SoilFertilityResponse {
  prediction: number;
  fertility: string;
  health_score: number;
  status: string;
  model_used?: boolean | string;
  message?: string;
  missing_features?: string[];
}

export async function createSoil(
  data: SoilData & { farm_id: number }
): Promise<SoilResponse> {
  const response = await api.post('/soil/', data);
  return response.data;
}

export async function getSoilByFarm(
  farmId: number | string
): Promise<SoilResponse> {
  const response = await api.get(`/soil/${farmId}`);
  return response.data;
}

export async function updateSoil(
  farmId: number | string,
  data: Partial<SoilData>
): Promise<SoilResponse> {
  const response = await api.put(`/soil/${farmId}`, data);
  return response.data;
}

export async function getSoilFertilityByFarm(
  farmId: number | string
): Promise<SoilFertilityResponse> {
  const response = await api.get(`/soil/${farmId}/fertility`);
  return response.data;
}
