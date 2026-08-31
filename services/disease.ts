import api from './api';
import { ImagePickerAsset } from 'expo-image-picker';

import { Platform } from 'react-native';

export interface DiseaseResponse {
  disease: string;
  confidence: number;
}

export async function predictDisease(
  imageAsset: ImagePickerAsset,
  farmId?: string
): Promise<DiseaseResponse> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // Web requires a Blob/File, otherwise it sends "[object Object]" and FastAPI throws 422
    const res = await fetch(imageAsset.uri);
    const blob = await res.blob();
    formData.append('image', blob, imageAsset.fileName || 'plant-image.jpg');
  } else {
    // Native platforms use the object syntax
    formData.append('image', {
      uri: imageAsset.uri,
      name: imageAsset.fileName || 'plant-image.jpg',
      type: imageAsset.mimeType || 'image/jpeg',
    } as any);
  }

  if (farmId) {
    formData.append('farm_id', farmId);
  }

  const response = await api.post('/api/disease/predict', formData);

  return response.data;
}
