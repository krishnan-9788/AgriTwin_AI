import api from './api';
import { Farm } from '../types/farm';

const mapToFrontend = (data: any, farmerName = "Farmer"): Farm => ({
  id: data.id,
  userId: data.user_id,
  farmerName: farmerName,
  farmName: data.farm_name,
  location: data.location,
  size: data.farm_size,
  soilType: data.soil_type,
  waterSource: data.water_source,
  currentCrop: data.current_crop,
  plantingDate: data.planting_date,
});

export const createFarm = async (farmData: Omit<Farm, 'id'>): Promise<Farm> => {
  try {
    console.log("[CREATE FARM] Request payload:", farmData);
    
    // Safely handle date parsing
    let parsedDate = new Date().toISOString();
    try {
      const dateObj = new Date(farmData.plantingDate);
      if (!isNaN(dateObj.getTime())) {
        parsedDate = dateObj.toISOString();
      } else {
        console.warn("[CREATE FARM] Invalid date provided, using current date as fallback:", farmData.plantingDate);
      }
    } catch (e) {
      console.warn("[CREATE FARM] Date parsing error:", e);
    }

    const backendData = {
      farm_name: farmData.farmName,
      location: farmData.location,
      farm_size: Number(farmData.size),
      soil_type: farmData.soilType,
      water_source: farmData.waterSource,
      current_crop: farmData.currentCrop,
      planting_date: parsedDate,
    };
    
    console.log("[CREATE FARM] API URL: /farms/");
    console.log("[CREATE FARM] Backend formatted payload:", backendData);
    
    const response = await api.post('/farms/', backendData);
    
    console.log("[CREATE FARM] Response status:", response.status);
    console.log("[CREATE FARM] Response data:", response.data);
    
    return mapToFrontend(response.data, farmData.farmerName);
  } catch (error: any) {
    console.error("[CREATE FARM] Error response:", error.response?.data || error.message);
    throw error;
  }
};

export const getFarm = async (id: string): Promise<Farm | null> => {
  try {
    const response = await api.get('/farms/');
    const farms = response.data;
    const farm = farms.find((f: any) => String(f.id) === String(id));
    return farm ? mapToFrontend(farm) : null;
  } catch (error) {
    console.error("Error fetching farm: ", error);
    return null;
  }
};

export const getUserFarms = async (userId: string): Promise<Farm[]> => {
  console.log("Current user:", userId);
  const response = await api.get('/farms/');
  console.log("Farm API response:", response.data);
  return response.data.map((data: any) => mapToFrontend(data));
};

export const updateFarm = async (id: string, farmData: Partial<Farm>): Promise<Farm> => {
  const backendData: any = {};
  if (farmData.farmName) backendData.farm_name = farmData.farmName;
  if (farmData.location) backendData.location = farmData.location;
  if (farmData.size) backendData.farm_size = Number(farmData.size);
  if (farmData.soilType) backendData.soil_type = farmData.soilType;
  if (farmData.waterSource) backendData.water_source = farmData.waterSource;
  if (farmData.currentCrop) backendData.current_crop = farmData.currentCrop;
  if (farmData.plantingDate) backendData.planting_date = new Date(farmData.plantingDate).toISOString();
  
  const response = await api.put(`/farms/${id}`, backendData);
  return mapToFrontend(response.data);
};

export const deleteFarm = async (id: number | string) => {
  const response = await api.delete(`/farms/${id}`);
  return response.data;
};

export const getFarmDigitalTwin = async (id: number | string, simDate?: string) => {
  const url = simDate ? `/farms/${id}/digital-twin?sim_date=${simDate}` : `/farms/${id}/digital-twin`;
  const response = await api.get(url);
  return response.data;
};

export const getFarmSuitability = async (id: number | string) => {
  const response = await api.get(`/farms/${id}/suitability`);
  return response.data;
};
