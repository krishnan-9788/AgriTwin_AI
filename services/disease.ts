import api from './api';
import { ImagePickerAsset } from 'expo-image-picker';

export interface DiseaseResponse {
  disease: string;
  confidence: number;
}

export async function predictDisease(
  imageAsset: ImagePickerAsset,
  farmId?: string
): Promise<DiseaseResponse> {
  const formData = new FormData();

  formData.append('file', {
    uri: imageAsset.uri,
    name: imageAsset.fileName || 'plant-image.jpg',
    type: imageAsset.mimeType || 'image/jpeg',
  } as any);

  if (farmId) {
    formData.append('farm_id', farmId);
  }

  const response = await api.post('/disease/predict', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
