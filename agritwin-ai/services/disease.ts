import api from './api';

import { Platform } from 'react-native';

export const predictDisease = async (asset: any, farmId?: string | number) => {
  const formData = new FormData();
  
  if (Platform.OS === 'web') {
    if (asset.file) {
      formData.append('image', asset.file);
    } else {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const file = new File(
        [blob],
        asset.fileName || "leaf.jpg",
        {
          type: asset.mimeType || blob.type || "image/jpeg"
        }
      );
      formData.append('image', file);
    }
  } else {
    // React Native (Android / iOS) file object representation
    const filename = asset.fileName || asset.uri.split('/').pop() || 'plant.jpg';
    let type = asset.mimeType;
    if (!type) {
      const match = /\.(\w+)$/.exec(filename);
      type = match ? `image/${match[1]}` : 'image/jpeg';
    }
    
    formData.append('image', {
      uri: asset.uri,
      name: filename,
      type,
    } as any);
  }

  if (farmId) {
    formData.append('farm_id', String(farmId));
  }

  try {
    const response = await api.post('/api/disease/predict', formData, {
      headers: {
        // By setting this to undefined, Axios will delete the global application/json header.
        // React Native's XMLHttpRequest will then natively detect the FormData object 
        // and correctly set the Content-Type to multipart/form-data with the correct boundary.
        // This avoids transformRequest which can silently break interceptor auth headers.
        'Content-Type': undefined,
      },
    });
    return response.data;
  } catch (error: any) {
    let message = 'Disease detection failed';
    if (error.response?.status === 401) {
      message = 'Authentication failed. Please login again.';
    } else if (error.response?.data) {
      if (typeof error.response.data.detail === 'string') {
        message = error.response.data.detail;
      } else if (Array.isArray(error.response.data.detail)) {
        // FastAPI validation error is an array of objects
        message = error.response.data.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
      } else if (typeof error.response.data === 'string') {
        message = error.response.data;
      }
    } else if (error.message) {
      message = error.message;
    }
    throw new Error(message);
  }
};
