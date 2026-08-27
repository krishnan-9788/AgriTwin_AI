// Nominatim geocoding service for AgriTwin
import axios from 'axios';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Simple in-memory cache to prevent redundant API calls
const locationCache: Record<string, Coordinates | null> = {};

export const geocodeLocation = async (locationStr: string): Promise<Coordinates | null> => {
  if (!locationStr || locationStr.trim() === '') return null;
  
  const query = locationStr.trim().toLowerCase();
  
  if (locationCache[query] !== undefined) {
    return locationCache[query];
  }

  try {
    console.log(`[GEOCODE] Fetching coordinates for: ${query}`);
    
    // Nominatim requires a valid User-Agent
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'AgriTwin-AI-Digital-Twin/1.0'
      },
      timeout: 5000 // 5 second timeout so we don't hang the UI forever
    });

    if (response.data && response.data.length > 0) {
      const result = {
        latitude: parseFloat(response.data[0].lat),
        longitude: parseFloat(response.data[0].lon)
      };
      locationCache[query] = result;
      return result;
    }
    
    console.warn(`[GEOCODE] No results found for: ${query}`);
    locationCache[query] = null;
    return null;
    
  } catch (error) {
    console.error(`[GEOCODE] Error geocoding ${query}:`, error);
    return null; // Return null gracefully on failure
  }
};
