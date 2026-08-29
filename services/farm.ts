import api from './api';

export interface FarmData {
  farmerName?: string;
  farmName: string;
  location: string;
  size: number;
  soilType: string;
  waterSource: string;
  currentCrop: string;
  plantingDate: string;
}

export interface FarmResponse {
  id: number;
  user_id: number;
  farm_name: string;
  location: string;
  farm_size: number;
  soil_type: string;
  water_source: string;
  current_crop: string;
  planting_date: string;
  created_at: string;

  // UI-compatible fields
  farmerName?: string;
  farmName: string;
  size: number;
  soilType: string;
  waterSource: string;
  currentCrop: string;
  plantingDate: string;

  latestDisease?: string;
  diseaseConfidence?: number;
}

function normalizeFarm(data: any): FarmResponse {
  return {
    ...data,

    farmerName: data.farmerName ?? data.farmer_name ?? '',
    farmName: data.farmName ?? data.farm_name ?? '',
    size: data.size ?? data.farm_size ?? 0,
    soilType: data.soilType ?? data.soil_type ?? '',
    waterSource: data.waterSource ?? data.water_source ?? '',
    currentCrop: data.currentCrop ?? data.current_crop ?? '',
    plantingDate: data.plantingDate ?? data.planting_date ?? '',
  };
}

export async function createFarm(data: FarmData): Promise<FarmResponse> {
  const response = await api.post('/farms/', {
    farm_name: data.farmName,
    location: data.location,
    farm_size: data.size,
    soil_type: data.soilType,
    water_source: data.waterSource,
    current_crop: data.currentCrop,
    planting_date: data.plantingDate.length === 10 ? `${data.plantingDate}T00:00:00` : data.plantingDate,
  });

  return normalizeFarm(response.data);
}

export async function getFarms(): Promise<FarmResponse[]> {
  const response = await api.get('/farms/');
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map(normalizeFarm);
}

export async function getUserFarms(_userId?: string): Promise<FarmResponse[]> {
  return getFarms();
}

export async function getFarm(id: number | string): Promise<FarmResponse> {
  const response = await api.get(`/farms/${id}`);
  return normalizeFarm(response.data);
}

export async function updateFarm(
  id: number | string,
  data: Partial<FarmData>
): Promise<FarmResponse> {
  const response = await api.put(`/farms/${id}`, {
    ...(data.farmName !== undefined && { farm_name: data.farmName }),
    ...(data.location !== undefined && { location: data.location }),
    ...(data.size !== undefined && { farm_size: data.size }),
    ...(data.soilType !== undefined && { soil_type: data.soilType }),
    ...(data.waterSource !== undefined && { water_source: data.waterSource }),
    ...(data.currentCrop !== undefined && { current_crop: data.currentCrop }),
    ...(data.plantingDate !== undefined && { planting_date: data.plantingDate }),
  });

  return normalizeFarm(response.data);
}

export async function deleteFarm(id: number | string): Promise<void> {
  await api.delete(`/farms/${id}`);
}

export async function getFarmDigitalTwin(id: number | string, simDate?: string) {
  const response = await api.get(`/farms/${id}/digital-twin`, { params: simDate ? { sim_date: simDate } : undefined });
  return response.data;
}

export async function getFarmSuitability(id: number | string) {
  const response = await api.get(`/farms/${id}/suitability`);
  return response.data;
}



