import api from './api';

export interface MarketPriceRecord {
  commodity: string;
  variety?: string;
  market?: string;
  district?: string;
  state?: string;
  min_price: string;
  max_price: string;
  modal_price: string;
  arrival_date?: string;
}

export interface MarketPriceResponse {
  success: boolean;
  records: MarketPriceRecord[];
  source?: string;
  message?: string;
  error?: string;
}

export async function getMarketPrices(
  state: string,
  district: string,
  commodity: string
): Promise<MarketPriceResponse> {
  const response = await api.get('/market-prices', {
    params: {
      state,
      district,
      commodity,
    },
  });

  return response.data;
}
