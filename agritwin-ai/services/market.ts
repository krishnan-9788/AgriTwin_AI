import api from './api';

export interface MarketPriceRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: string;
  max_price: string;
  modal_price: string;
}

export interface MarketPriceResponse {
  success: boolean;
  records: MarketPriceRecord[];
  count: number;
  error: string | null;
  source?: string;
}

export const getMarketPrices = async (state: string, district: string, commodity: string, limit: number = 20): Promise<MarketPriceResponse> => {
  const response = await api.get(`/api/market-prices`, {
    params: {
      state,
      district,
      commodity,
      limit
    }
  });
  return response.data;
};
