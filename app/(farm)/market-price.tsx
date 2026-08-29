import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getFarm } from '../../services/farm';
import { getMarketPrices, MarketPriceRecord } from '../../services/market';
import { Farm } from '../../types/farm';
import { MaterialIcons } from '@expo/vector-icons';

export default function MarketPriceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [prices, setPrices] = useState<MarketPriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noDataMessage, setNoDataMessage] = useState<string | null>(null);
  const [yieldData, setYieldData] = useState<{ estimated_yield: number } | null>(null);
  const [dataSource, setDataSource] = useState<string>('LIVE - data.gov.in');
  
  // To handle location parsing safely
  const parseLocation = (locationString: string) => {
    if (!locationString) return { state: "", district: "" };
    const parts = locationString.split(',');
    if (parts.length >= 2) {
      return { 
        district: parts[0].trim(), 
        state: parts[1].trim() 
      };
    }
    // Fallback if formatting is unexpected
    return { state: locationString, district: "" };
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        if (!id) return;
        
        // 1. Fetch Farm
        const farmData = await getFarm(id);
        if (isMounted) setFarm(farmData);
        
        if (!farmData.currentCrop || !farmData.location) {
          if (isMounted) {
            setError("Farm missing crop or location information.");
            setLoading(false);
          }
          return;
        }

        const { state, district } = parseLocation(farmData.location);
        
        // 2. Fetch Market Prices
        const marketResponse = await getMarketPrices(state, district, farmData.currentCrop);
        
        if (isMounted) {
          if (!marketResponse.success) {
            setError(marketResponse.error || "Failed to load market prices.");
          } else if (marketResponse.records.length === 0) {
            setNoDataMessage(marketResponse.message || "No market data found");
            setPrices([]);
          } else {
            setPrices(marketResponse.records);
            if (marketResponse.source) {
              setDataSource(marketResponse.source);
            }
          }
        }
        
        // 3. Fetch Yield Prediction
        try {
          const yieldRes = await require('../../services/api').default.get(`/farms/${id}/yield`);
          if (isMounted) {
            setYieldData(yieldRes.data);
          }
        } catch (ye) {
          console.log("Yield estimation error:", ye);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(err);
          setError(err.message || "An unexpected error occurred.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-background dark:bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Fetching live market rates...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background dark:bg-slate-900 justify-center items-center px-6">
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text className="mt-4 text-gray-800 dark:text-white font-bold text-lg text-center">Unable to load prices</Text>
        <Text className="mt-2 text-gray-500 dark:text-gray-400 text-center">{error}</Text>
      </View>
    );
  }

  if (!farm) {
    return <View className="flex-1 justify-center items-center"><Text>Farm not found</Text></View>;
  }

  // Find the highest resolved price to highlight it
  let bestMarket: MarketPriceRecord | null = null;
  let highestPrice = 0;
  
  prices.forEach(record => {
    let priceVal = parseFloat(record.modal_price);
    // If modal price is invalid or 0, fallback to average of min and max
    if (isNaN(priceVal) || priceVal <= 0) {
      const minP = parseFloat(record.min_price);
      const maxP = parseFloat(record.max_price);
      if (!isNaN(minP) && !isNaN(maxP) && minP > 0 && maxP > 0) {
        priceVal = (minP + maxP) / 2;
      }
    }
    
    if (!isNaN(priceVal) && priceVal > highestPrice) {
      highestPrice = priceVal;
      bestMarket = record;
    }
  });

  return (
    <ScrollView className="flex-1 bg-background dark:bg-slate-900 px-4 py-6">
      <View className="mb-6 flex-row justify-between items-start">
        <View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-white">Market Prices</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">Rates for {farm.currentCrop}</Text>
        </View>
        <View className={`px-2 py-1 rounded-md ${dataSource.includes('DEMO') ? 'bg-orange-100' : 'bg-green-100'}`}>
          <Text className={`text-[10px] font-bold ${dataSource.includes('DEMO') ? 'text-orange-700' : 'text-green-700'}`}>
            {dataSource.includes('DEMO') ? 'DEMO DATA' : 'LIVE API'}
          </Text>
        </View>
      </View>

      <View className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm mb-6 flex-row items-center">
        <View className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full items-center justify-center mr-4">
          <MaterialIcons name="location-on" size={24} color="#16a34a" />
        </View>
        <View>
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Search Region</Text>
          <Text className="text-gray-800 dark:text-white font-bold">{farm.location}</Text>
        </View>
      </View>

      {/* Income & Profit Calculator */}
      <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-900/30 shadow-sm mb-8">
        <View className="flex-row items-center mb-3">
          <MaterialIcons name="calculate" size={24} color="#2563eb" />
          <Text className="text-blue-800 font-bold text-lg ml-2">Income Calculator</Text>
        </View>
        
        {yieldData ? (
          <View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-blue-700">Estimated Yield:</Text>
              <Text className="text-blue-900 font-bold">{yieldData.estimated_yield} Quintals</Text>
            </View>
            {bestMarket && highestPrice > 0 ? (
              <>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-blue-700">Current Market Price:</Text>
                  <Text className="text-blue-900 font-bold">₹{highestPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })} / Quintal</Text>
                </View>
                <View className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 mt-2">
                  <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">Estimated Revenue</Text>
                  {yieldData.estimated_yield && yieldData.estimated_yield > 0 ? (
                    <Text className="text-green-600 font-extrabold text-2xl">
                      ₹{(yieldData.estimated_yield * highestPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </Text>
                  ) : (
                    <Text className="text-red-500 font-medium text-sm">Revenue cannot be calculated until a valid yield is available.</Text>
                  )}
                </View>
              </>
            ) : (
              <View className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 mt-2">
                <Text className="text-gray-500 dark:text-gray-400 text-xs text-center">Market price unavailable to calculate revenue.</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            <Text className="text-blue-700 text-sm mb-3">
              Connect your yield estimates to calculate potential revenue and profit.
            </Text>
            <View className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-50">
              <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">Formula</Text>
              <Text className="text-gray-700 dark:text-gray-200 font-medium text-sm">Estimated Revenue = Expected Yield × Market Price</Text>
            </View>
            <Text className="text-blue-500 text-xs mt-3 italic text-center">Waiting for Yield Prediction data...</Text>
          </>
        )}
      </View>

      <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4">Available Markets</Text>

      {prices.length === 0 ? (
        <View className="bg-white dark:bg-slate-800 rounded-xl p-6 items-center border border-gray-100 dark:border-slate-700 shadow-sm">
          <MaterialIcons name="storefront" size={48} color="#d1d5db" />
          <Text className="text-gray-500 dark:text-gray-400 font-bold mt-2 text-lg">No Market Data Found</Text>
          <Text className="text-gray-400 text-sm text-center mt-1">
            {noDataMessage || `Could not find recent mandi prices for ${farm.currentCrop} in this region.`}
          </Text>
        </View>
      ) : (
        prices.map((record, index) => {
          const isBest = bestMarket && record.market === bestMarket.market && record.modal_price === bestMarket.modal_price;
          
          return (
            <View 
              key={index} 
              className={`bg-white dark:bg-slate-800 rounded-xl p-4 border shadow-sm mb-4 ${isBest ? 'border-green-50 dark:border-green-900/300' : 'border-gray-100 dark:border-slate-700'}`}
            >
              {isBest && (
                <View className="bg-green-100 self-start px-2 py-1 rounded mb-2 flex-row items-center">
                  <MaterialIcons name="star" size={12} color="#16a34a" />
                  <Text className="text-green-700 text-xs font-bold ml-1">Highest Available Price</Text>
                </View>
              )}
              
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800 dark:text-white">{record.market}</Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs">{record.district}, {record.state}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-extrabold text-green-600">
                    {record.modal_price ? `₹${parseFloat(record.modal_price).toLocaleString('en-IN')}` : 'N/A'}
                  </Text>
                  <Text className="text-gray-400 text-xs">per Quintal</Text>
                </View>
              </View>
              
              <View className="flex-row flex-wrap mt-2 pt-3 border-t border-gray-50">
                <View className="w-1/2 mb-2">
                  <Text className="text-gray-400 text-xs">Commodity</Text>
                  <Text className="text-gray-700 dark:text-gray-200 font-medium text-sm">{record.commodity}</Text>
                </View>
                <View className="w-1/2 mb-2">
                  <Text className="text-gray-400 text-xs">Variety</Text>
                  <Text className="text-gray-700 dark:text-gray-200 font-medium text-sm">{record.variety || 'N/A'}</Text>
                </View>
                <View className="w-1/2">
                  <Text className="text-gray-400 text-xs">Min Price</Text>
                  <Text className="text-gray-700 dark:text-gray-200 font-medium text-sm">
                    {record.min_price ? `₹${parseFloat(record.min_price).toLocaleString('en-IN')}` : 'N/A'}
                  </Text>
                </View>
                <View className="w-1/2">
                  <Text className="text-gray-400 text-xs">Max Price</Text>
                  <Text className="text-gray-700 dark:text-gray-200 font-medium text-sm">
                    {record.max_price ? `₹${parseFloat(record.max_price).toLocaleString('en-IN')}` : 'N/A'}
                  </Text>
                </View>
              </View>
              
              <Text className="text-gray-400 text-xs text-right mt-3 italic">
                Reported on: {record.arrival_date}
              </Text>
            </View>
          );
        })
      )}
      <View className="h-10" />
    </ScrollView>
  );
}
