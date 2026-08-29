import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Animated, Easing, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getFarm, getFarmDigitalTwin, getFarmSuitability } from '../../services/farm';
import { getMarketPrices } from '../../services/market';
import { Farm } from '../../types/farm';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import { OpenStreetMap } from '../../components/ui/OpenStreetMap';
import { Crop3DRenderer } from '../../components/DigitalTwin/CropRenderer';
import { getCropConfig, getCropStageName } from '../../components/DigitalTwin/cropConfigs';
import { useColorScheme } from 'nativewind';

const { width } = Dimensions.get('window');

class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('3D Model Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-[#1e293b]">
          <MaterialIcons name="error-outline" size={32} color="#ef4444" />
          <Text className="text-gray-400 font-bold mt-2">Unable to load 3D farm model</Text>
          <TouchableOpacity 
            className="mt-4 bg-green-600 px-6 py-2 rounded-lg"
            onPress={() => this.setState({ hasError: false })}
          >
            <Text className="text-white font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function ProceduralFarm({ twinData, farm, simDaysOffset, onSelect }: { twinData: any, farm: Farm | null, simDaysOffset: number, onSelect: () => void }) {
  // Base dimensions calculation
  const acres = twinData?.farm?.area_acres || farm?.size || 1;
  const baseSize = Math.max(10, Math.sqrt(acres) * 15); // Scaling factor for visual representation
  
  // Visual states
  const moisture = twinData?.soil?.moisture != null ? twinData.soil.moisture : 50;
  const health = twinData?.health_score != null ? twinData.health_score : 100;
  const cropName = farm?.currentCrop || twinData?.crop?.name || 'Unknown';

  const cropConfig = getCropConfig(cropName);
  const harvestDays = cropConfig.maxGrowthDays;

  // Calculate simulated age
  let ageDays = twinData?.crop?.age_days || 0;
  if (farm?.plantingDate) {
    const pDate = new Date(farm.plantingDate);
    const cDate = new Date();
    cDate.setDate(cDate.getDate() + simDaysOffset);
    const diffTime = cDate.getTime() - pDate.getTime();
    ageDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Clamp effective age to harvest maturity
  const effectiveAge = Math.min(ageDays, harvestDays);

  // Determine clamped Growth % and Stage
  const calculatedGrowth = Math.min(100, Math.max(0, (effectiveAge / harvestDays) * 100));
  const growth = Math.min(100, twinData?.crop?.growth_progress != null ? twinData.crop.growth_progress : calculatedGrowth);
  
  let growthStage = twinData?.crop?.growth_stage || '';
  if (!growthStage) {
    growthStage = getCropStageName(cropConfig, ageDays);
  }

  let flowerColor = '#ffffff'; // Default White (Jasmine / Arabian Jasmine)
  if (cropName.toLowerCase().includes('crossandra')) flowerColor = '#f97316'; // Orange
  else if (cropName.toLowerCase().includes('chrysanthemum')) flowerColor = '#facc15'; // Yellow
  
  // Geometry scale modifiers based on stage are now handled strictly via growthFactor in CropRenderer

  // Soil color based on moisture
  const soilColor = new THREE.Color().lerpColors(
    new THREE.Color('#d2b48c'), // Dry tan
    new THREE.Color('#3e2723'), // Wet dark brown
    moisture / 100
  );
  
  // Plant health color
  const plantColor = new THREE.Color().lerpColors(
    new THREE.Color('#b45309'), // Unhealthy/dead brown
    new THREE.Color('#22c55e'), // Healthy green
    health / 100
  );

  // IoT Sensor Pulse animation
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
    }
  });

  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[baseSize, baseSize, 8, 8]} />
        <meshStandardMaterial color={soilColor} roughness={0.9} />
      </mesh>
      
      <Crop3DRenderer 
        cropName={cropName}
        growthPercentage={growth}
        cropAge={effectiveAge}
        growthStage={growthStage}
        plantColor={plantColor}
        farmSize={baseSize}
      />
      
      {/* IoT Sensors (Simulated) */}
      <group position={[baseSize * 0.3, 0.5, baseSize * 0.3]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 1]} />
          <meshStandardMaterial ref={materialRef} color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
        </mesh>
        <Html position={[0, 0.8, 0]} center>
          <div className="bg-blue-600/80 px-2 py-0.5 rounded-full border border-blue-400">
            <Text className="text-white text-[8px] font-bold">Simulated IoT Sensor</Text>
          </div>
        </Html>
      </group>
      
      {/* Fences/Boundary Layout */}
      <gridHelper args={[baseSize, Math.floor(baseSize)]} position={[0, 0.01, 0]} material-color="#1e293b" />
    </group>
  );
}

export default function DigitalTwinScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  
  // Data States
  const [farm, setFarm] = useState<Farm | null>(null);
  const [twinData, setTwinData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [yieldData, setYieldData] = useState<any>(null);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayTab, setOverlayTab] = useState<'crop' | 'soil'>('crop');
  const [resetKey, setResetKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
  
  // Simulation State
  const [simDaysOffset, setSimDaysOffset] = useState(0);

  const fetchData = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    try {
      const fData = await getFarm(id as string);
      if (fData) setFarm(fData);

      // Calculate Sim Date
      let simDateStr: string | undefined = undefined;
      if (simDaysOffset !== 0) {
        const d = new Date();
        d.setDate(d.getDate() + simDaysOffset);
        simDateStr = d.toISOString();
      }

      // Fetch all concurrently
      const [tData, yData] = await Promise.all([
        getFarmDigitalTwin(id as string, simDateStr).catch(e => { console.error("Twin API failed", e); return null; }),
        require('../../services/api').default.get(`/farms/${id}/yield${simDateStr ? `?sim_date=${simDateStr}` : ''}`).then((res: any) => res.data).catch((e: any) => { console.error("Yield API failed", e); return null; }),
      ]);
      
      setTwinData(tData);
      setYieldData(yData);

      // Market Data
      if (fData && fData.location && fData.currentCrop) {
        const parts = fData.location.split(',');
        const district = parts.length >= 2 ? parts[0].trim() : "";
        const state = parts.length >= 2 ? parts[1].trim() : fData.location;
        try {
          const mData = await getMarketPrices(state, district, fData.currentCrop);
          if (mData.success && mData.records.length > 0) {
            let highest = 0;
            let record = null;
            mData.records.forEach((r: any) => {
              let p = parseFloat(r.modal_price);
              if (isNaN(p)) {
                const min = parseFloat(r.min_price);
                const max = parseFloat(r.max_price);
                if (!isNaN(min) && !isNaN(max)) p = (min + max) / 2;
              }
              if (!isNaN(p) && p > highest) {
                highest = p;
                record = r;
              }
            });
            setMarketData(record);
          } else {
            setMarketData(null);
          }
        } catch (e) {
          console.error("Market API failed", e);
          setMarketData(null);
        }
      }
    } catch (err) {
      console.error("Data fetch failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    }, 60000);
    return () => clearInterval(timer);
  }, [id, simDaysOffset]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0f172a]">
        <Text className="text-white">Loading Digital Twin...</Text>
      </View>
    );
  }

  const isIrrigationNeeded = twinData?.soil?.moisture < 40;

  return (
    <View className="flex-1 bg-[#0f172a]">
      {/* TOP HEADER */}
      <View className="pt-14 pb-4 px-4 bg-[#1e293b] flex-row justify-between items-center z-10 shadow-lg border-b border-white/5 dark:border-slate-700">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.push('/(tabs)/dashboard')} className="mr-3 p-1 rounded-full bg-white/20 dark:bg-slate-800/30">
            <MaterialIcons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <View>
            <Text className="text-white font-extrabold text-lg">AgriTwin</Text>
            <View className="flex-row items-center mt-0.5">
              <View className="w-2 h-2 rounded-full bg-green-50 dark:bg-green-900/200 mr-1 animate-pulse" />
              <Text className="text-gray-400 text-xs font-bold">3D Digital Twin Live</Text>
            </View>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-white font-bold">{currentTime}</Text>
          <View className="flex-row items-center mt-0.5">
            <MaterialIcons name="thermostat" size={12} color="#94a3b8" />
            <Text className="text-gray-400 text-xs ml-1">{twinData?.weather?.temperature ? `${twinData.weather.temperature}°C` : '--'}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {/* 3D MODEL VIEWPORT */}
        <View className="w-full h-[350px] relative">
          <ErrorBoundary>
            <React.Suspense fallback={
              <View className="flex-1 items-center justify-center bg-[#0f172a]">
                <Text className="text-gray-500 dark:text-gray-400 font-medium">Loading Environment...</Text>
              </View>
            }>
              <Canvas key={resetKey} camera={{ position: [6, 4, 6], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} />
                <Environment preset="sunset" />
                <React.Suspense fallback={null}>
                  <Center>
                    <ProceduralFarm twinData={twinData} farm={farm} simDaysOffset={simDaysOffset} onSelect={() => setShowOverlay(true)} />
                  </Center>
                </React.Suspense>
                <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate={!showOverlay} autoRotateSpeed={0.5} />
              </Canvas>

              {/* NEW SMALL UI INDICATOR INSIDE THE DIGITAL TWIN */}
              <View className="absolute bottom-16 left-4 bg-black/80 p-3 rounded-xl border border-white/20 backdrop-blur-md z-10 w-48">
                <Text className="text-white font-bold text-sm mb-2">{farm?.currentCrop || 'Unknown Crop'}</Text>
                
                {(() => {
                  const cropName = farm?.currentCrop || 'Unknown Crop';
                  const config = getCropConfig(cropName);
                  const harvestDays = config.maxGrowthDays;

                  let simAge = 0;
                  if (farm?.plantingDate) {
                    const pDate = new Date(farm.plantingDate);
                    const cDate = new Date();
                    cDate.setDate(cDate.getDate() + simDaysOffset);
                    simAge = Math.max(0, Math.ceil((cDate.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24)));
                  }

                  const effAge = Math.min(simAge, harvestDays);
                  const growthPercent = Math.min(100, Math.floor((effAge / harvestDays) * 100));
                  const stageStr = getCropStageName(config, simAge);

                  return (
                    <>
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-gray-400 text-[10px]">Simulated Age</Text>
                        <Text className="text-white font-bold text-[10px]">{simAge} days</Text>
                      </View>
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-gray-400 text-[10px]">Max Growth Age</Text>
                        <Text className="text-white font-bold text-[10px]">{harvestDays} days</Text>
                      </View>
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-gray-400 text-[10px]">Effective Age</Text>
                        <Text className="text-yellow-400 font-bold text-[10px]">{effAge} days</Text>
                      </View>
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-gray-400 text-[10px]">Growth</Text>
                        <Text className="text-green-400 font-bold text-[10px]">{growthPercent}%</Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-gray-400 text-[10px]">Stage</Text>
                        <Text className="text-white font-bold text-[9px] text-right flex-1 ml-2">{stageStr}</Text>
                      </View>
                    </>
                  );
                })()}
              </View>

              {/* LOCATION BADGE OVERLAY */}
              <View className="absolute top-4 right-4 bg-black/50 px-3 py-1.5 rounded-full flex-row items-center border border-white/10 backdrop-blur-md">
                <MaterialIcons name="location-on" size={14} color="#ef4444" />
                <Text className="text-white text-xs font-bold ml-1">{farm?.location || 'Unknown'}</Text>
              </View>

              {/* 3D INTERACTION POPUP */}
              {showOverlay && twinData && (
                <View className="absolute top-10 self-center w-[85%] bg-black/80 rounded-2xl p-4 shadow-xl border border-white/20 backdrop-blur-xl z-20">
                  <View className="flex-row justify-between items-center mb-3 border-b border-white/10 pb-2">
                    <View className="flex-row bg-white dark:bg-slate-800/10 rounded-lg p-1">
                      <TouchableOpacity 
                        className={`px-3 py-1 rounded-md ${overlayTab === 'crop' ? 'bg-green-600' : ''}`}
                        onPress={() => setOverlayTab('crop')}
                      >
                        <Text className={`text-xs font-bold ${overlayTab === 'crop' ? 'text-white' : 'text-gray-400'}`}>🌾 CROP</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className={`px-3 py-1 rounded-md ${overlayTab === 'soil' ? 'bg-amber-700' : ''}`}
                        onPress={() => setOverlayTab('soil')}
                      >
                        <Text className={`text-xs font-bold ${overlayTab === 'soil' ? 'text-white' : 'text-gray-400'}`}>🌱 SOIL</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => setShowOverlay(false)} className="p-1 bg-white dark:bg-slate-800/10 rounded-full">
                      <MaterialIcons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                  
                  {overlayTab === 'crop' ? (
                    <View>
                      <Text className="text-white font-black text-lg mb-2 uppercase tracking-wider">{twinData.crop.name || 'UNKNOWN'}</Text>
                      <View className="flex-row justify-between mb-1"><Text className="text-gray-400 text-xs">Health</Text><Text className="text-green-400 font-bold text-xs">{twinData.health_score}%</Text></View>
                      <View className="flex-row justify-between mb-1"><Text className="text-gray-400 text-xs">Growth</Text><Text className="text-white font-bold text-xs">{twinData.crop.growth_stage}</Text></View>
                      <View className="flex-row justify-between mb-1"><Text className="text-gray-400 text-xs">Crop Age</Text><Text className="text-white font-bold text-xs">{twinData.crop.age_days} Days</Text></View>
                      <View className="flex-row justify-between mb-1"><Text className="text-gray-400 text-xs">Moisture</Text><Text className="text-blue-400 font-bold text-xs">{twinData.soil?.moisture ?? '--'}%</Text></View>
                      <View className="flex-row justify-between mb-1"><Text className="text-gray-400 text-xs">Disease</Text><Text className={farm?.latestDisease && farm?.latestDisease !== 'Healthy' ? "text-red-400 font-bold text-xs" : "text-green-400 font-bold text-xs"}>{farm?.latestDisease || 'Healthy'}</Text></View>
                      <View className="flex-row justify-between"><Text className="text-gray-400 text-xs">Yield</Text><Text className="text-yellow-400 font-bold text-xs">{yieldData ? `${yieldData.estimated_yield} Qt` : 'Unknown'}</Text></View>
                    </View>
                  ) : (
                    <View>
                      <Text className="text-white font-black text-lg mb-2 uppercase tracking-wider">LAND AREA</Text>
                      <View className="flex-row justify-between mb-1"><Text className="text-gray-400 text-xs">Type</Text><Text className="text-amber-400 font-bold text-xs">{farm?.soilType || '--'}</Text></View>
                      <View className="flex-row justify-between mb-1"><Text className="text-gray-400 text-xs">pH Level</Text><Text className="text-white font-bold text-xs">{twinData.soil?.ph ?? '--'}</Text></View>
                      <View className="flex-row justify-between mb-1"><Text className="text-gray-400 text-xs">Moisture</Text><Text className="text-blue-400 font-bold text-xs">{twinData.soil?.moisture ?? '--'}%</Text></View>
                      <View className="flex-row justify-between mb-1"><Text className="text-gray-400 text-xs">Nitrogen (N)</Text><Text className="text-white font-bold text-xs">{twinData.soil?.nitrogen ?? '--'} kg/ha</Text></View>
                      <View className="flex-row justify-between mb-1"><Text className="text-gray-400 text-xs">Phosphorus (P)</Text><Text className="text-white font-bold text-xs">{twinData.soil?.phosphorus ?? '--'} kg/ha</Text></View>
                      <View className="flex-row justify-between"><Text className="text-gray-400 text-xs">Potassium (K)</Text><Text className="text-white font-bold text-xs">{twinData.soil?.potassium ?? '--'} kg/ha</Text></View>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity 
                className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-800/80 px-3 py-1.5 rounded-full flex-row items-center border border-gray-200 dark:border-white/20 backdrop-blur-md shadow-sm"
                onPress={() => {
                  setResetKey(prev => prev + 1);
                  setShowOverlay(false);
                }}
              >
                <MaterialIcons name="restart-alt" size={14} color={colorScheme === 'dark' ? 'white' : '#374151'} />
                <Text className="text-gray-700 dark:text-white font-bold text-[10px] ml-1">Reset</Text>
              </TouchableOpacity>
            </React.Suspense>
          </ErrorBoundary>
        </View>

        {/* SIMULATION TIME CONTROLS */}
        <View className="px-3 mt-4 mb-2">
          <View className="bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-gray-200 dark:border-blue-500/30 shadow-md">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <MaterialIcons name="schedule" size={16} color="#3b82f6" />
                <Text className="text-blue-600 dark:text-blue-400 font-extrabold text-xs ml-1 uppercase">Time Travel Simulator</Text>
              </View>
              <Text className="text-blue-800 dark:text-white text-xs font-bold bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                {simDaysOffset === 0 ? "Today" : simDaysOffset > 0 ? `+${simDaysOffset} Days` : `${simDaysOffset} Days`}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <TouchableOpacity onPress={() => setSimDaysOffset(prev => prev - 10)} className="bg-gray-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg flex-1 mr-1 items-center border border-gray-200 dark:border-slate-700">
                <Text className="text-gray-700 dark:text-white text-[10px] font-bold">-10 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSimDaysOffset(0)} className={`px-3 py-1.5 rounded-lg flex-1 mx-1 items-center border ${simDaysOffset === 0 ? 'bg-blue-600 border-blue-700' : 'bg-gray-100 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'}`}>
                <Text className={`text-[10px] font-bold ${simDaysOffset === 0 ? 'text-white' : 'text-gray-700 dark:text-white'}`}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSimDaysOffset(prev => prev + 10)} className="bg-gray-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg flex-1 mx-1 items-center border border-gray-200 dark:border-slate-700">
                <Text className="text-gray-700 dark:text-white text-[10px] font-bold">+10 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSimDaysOffset(prev => prev + 30)} className="bg-gray-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg flex-1 ml-1 items-center border border-gray-200 dark:border-slate-700">
                <Text className="text-gray-700 dark:text-white text-[10px] font-bold">+30 Days</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 10 DATA OVERLAY CARDS */}
        <View className="px-3 pb-24 flex-row flex-wrap justify-between mt-2">
          
          {/* 1. CROP HEALTH */}
          <TouchableOpacity onPress={() => router.push(`/(farm)/farm-profile?id=${farm?.id}` as any)} className="w-[48%] bg-[#1e293b] p-3 rounded-xl border border-white/5 dark:border-slate-700 mb-3 shadow-md">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="eco" size={16} color="#10b981" />
              <Text className="text-gray-400 text-[10px] font-bold ml-1 uppercase">1. Crop Health</Text>
            </View>
            {twinData ? (
              <>
                <Text className="text-white font-extrabold text-lg">{twinData.health_score}%</Text>
                <Text className={`text-xs font-bold mt-1 ${twinData.health_score > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {twinData.health_score > 80 ? 'Optimal' : 'Needs Attention'}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-[10px] mt-1 truncate">{farm?.currentCrop} - {twinData.crop.growth_stage}</Text>
              </>
            ) : <Text className="text-gray-600 dark:text-gray-300 text-xs italic">Data unavailable</Text>}
          </TouchableOpacity>

          {/* 2. SOIL MOISTURE */}
          <TouchableOpacity onPress={() => router.push(`/(farm)/soil?id=${farm?.id}` as any)} className="w-[48%] bg-[#1e293b] p-3 rounded-xl border border-white/5 dark:border-slate-700 mb-3 shadow-md">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="water-drop" size={16} color="#3b82f6" />
              <Text className="text-gray-400 text-[10px] font-bold ml-1 uppercase">2. Soil Moisture</Text>
            </View>
            {twinData?.soil?.moisture != null ? (
              <>
                <Text className="text-white font-extrabold text-lg">{twinData.soil.moisture}%</Text>
                <Text className={`text-xs font-bold mt-1 ${twinData.soil.moisture < 40 ? 'text-red-400' : twinData.soil.moisture > 70 ? 'text-blue-400' : 'text-green-400'}`}>
                  {twinData.soil.moisture < 40 ? 'Low' : twinData.soil.moisture > 70 ? 'High' : 'Optimal'}
                </Text>
              </>
            ) : <Text className="text-gray-600 dark:text-gray-300 text-xs italic">Soil data unavailable</Text>}
          </TouchableOpacity>

          {/* 3. SOIL pH */}
          <TouchableOpacity onPress={() => router.push(`/(farm)/soil?id=${farm?.id}` as any)} className="w-[48%] bg-[#1e293b] p-3 rounded-xl border border-white/5 dark:border-slate-700 mb-3 shadow-md">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="science" size={16} color="#f59e0b" />
              <Text className="text-gray-400 text-[10px] font-bold ml-1 uppercase">3. Soil pH</Text>
            </View>
            {twinData?.soil?.ph != null ? (
              <>
                <Text className="text-white font-extrabold text-lg">{twinData.soil.ph}</Text>
                <Text className={`text-xs font-bold mt-1 ${twinData.soil.ph < 6 ? 'text-yellow-400' : twinData.soil.ph > 7.5 ? 'text-red-400' : 'text-green-400'}`}>
                  {twinData.soil.ph < 6 ? 'Acidic' : twinData.soil.ph > 7.5 ? 'Alkaline' : 'Optimal'}
                </Text>
              </>
            ) : <Text className="text-gray-600 dark:text-gray-300 text-xs italic">Soil data unavailable</Text>}
          </TouchableOpacity>

          {/* 4. NUTRIENTS */}
          <TouchableOpacity onPress={() => router.push(`/(farm)/soil?id=${farm?.id}` as any)} className="w-[48%] bg-[#1e293b] p-3 rounded-xl border border-white/5 dark:border-slate-700 mb-3 shadow-md">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="bubble-chart" size={16} color="#a855f7" />
              <Text className="text-gray-400 text-[10px] font-bold ml-1 uppercase">4. Nutrients</Text>
            </View>
            {twinData?.soil?.nitrogen != null ? (
              <View className="flex-row justify-between mt-1">
                <View className="items-center"><Text className="text-gray-500 dark:text-gray-400 text-[10px]">N</Text><Text className="text-white text-xs font-bold">{twinData.soil.nitrogen}</Text></View>
                <View className="items-center"><Text className="text-gray-500 dark:text-gray-400 text-[10px]">P</Text><Text className="text-white text-xs font-bold">{twinData.soil.phosphorus}</Text></View>
                <View className="items-center"><Text className="text-gray-500 dark:text-gray-400 text-[10px]">K</Text><Text className="text-white text-xs font-bold">{twinData.soil.potassium}</Text></View>
              </View>
            ) : <Text className="text-gray-600 dark:text-gray-300 text-xs italic">Soil data unavailable</Text>}
          </TouchableOpacity>

          {/* 5. WEATHER */}
          <TouchableOpacity className="w-[48%] bg-[#1e293b] p-3 rounded-xl border border-white/5 dark:border-slate-700 mb-3 shadow-md">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="wb-sunny" size={16} color="#fcd34d" />
              <Text className="text-gray-400 text-[10px] font-bold ml-1 uppercase">5. Weather</Text>
            </View>
            {twinData?.weather ? (
              <>
                <Text className="text-white font-extrabold text-lg">{twinData.weather.temperature}°C</Text>
                <Text className="text-gray-300 text-xs mt-1 truncate">{twinData.weather.condition}</Text>
                <Text className="text-blue-300 text-[10px] mt-1">Humidity: {twinData.weather.humidity}%</Text>
              </>
            ) : <Text className="text-gray-600 dark:text-gray-300 text-xs italic">Weather data unavailable</Text>}
          </TouchableOpacity>

          {/* 6. DISEASE STATUS */}
          <TouchableOpacity onPress={() => router.push(`/(farm)/disease-detection` as any)} className="w-[48%] bg-[#1e293b] p-3 rounded-xl border border-white/5 dark:border-slate-700 mb-3 shadow-md">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="bug-report" size={16} color="#ef4444" />
              <Text className="text-gray-400 text-[10px] font-bold ml-1 uppercase">6. Disease</Text>
            </View>
            {farm?.latestDisease && farm?.latestDisease !== 'Healthy' ? (
              <>
                <Text className="text-red-400 font-bold text-xs mt-1 truncate">{farm.latestDisease}</Text>
                <Text className="text-white font-extrabold text-sm mt-1">Status: Diseased</Text>
                <Text className="text-gray-400 text-[10px] mt-1">Confidence: {farm.diseaseConfidence ? `${(farm.diseaseConfidence * 100).toFixed(0)}%` : '--'}</Text>
              </>
            ) : (
              <>
                <Text className="text-green-400 font-bold text-sm mt-1">Healthy</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-[10px] mt-2">No disease prediction available.</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 7. YIELD PREDICTION */}
          <TouchableOpacity onPress={() => {
            const d = new Date();
            d.setDate(d.getDate() + simDaysOffset);
            const simQ = simDaysOffset !== 0 ? `&sim_date=${d.toISOString()}` : '';
            router.push(`/(farm)/yield-prediction?id=${farm?.id}${simQ}` as any);
          }} className="w-[48%] bg-[#1e293b] p-3 rounded-xl border border-white/5 dark:border-slate-700 mb-3 shadow-md">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="trending-up" size={16} color="#10b981" />
              <Text className="text-gray-400 text-[10px] font-bold ml-1 uppercase">7. Yield</Text>
            </View>
            {yieldData ? (
              <>
                <Text className="text-white font-extrabold text-lg">{yieldData.estimated_yield}</Text>
                <Text className="text-gray-300 text-xs mt-1">Quintals</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-[10px] mt-1">Crop: {farm?.currentCrop}</Text>
              </>
            ) : <Text className="text-gray-600 dark:text-gray-300 text-xs italic">Yield prediction unavailable</Text>}
          </TouchableOpacity>

          {/* 8. MARKET PRICE */}
          <TouchableOpacity onPress={() => router.push(`/(farm)/market-price?id=${farm?.id}` as any)} className="w-[48%] bg-[#1e293b] p-3 rounded-xl border border-white/5 dark:border-slate-700 mb-3 shadow-md">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="storefront" size={16} color="#2563eb" />
              <Text className="text-gray-400 text-[10px] font-bold ml-1 uppercase">8. Market Price</Text>
            </View>
            {marketData ? (
              <>
                <Text className="text-green-400 font-extrabold text-lg">
                  ₹{marketData.modal_price ? parseFloat(marketData.modal_price).toLocaleString('en-IN') : '--'}
                </Text>
                <Text className="text-gray-300 text-[10px] mt-1 truncate">{marketData.market}, {marketData.state}</Text>
                <View className="flex-row justify-between mt-1">
                  <Text className="text-gray-500 dark:text-gray-400 text-[9px]">Min: ₹{marketData.min_price || '--'}</Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-[9px]">Max: ₹{marketData.max_price || '--'}</Text>
                </View>
              </>
            ) : <Text className="text-gray-600 dark:text-gray-300 text-xs italic">Market data unavailable</Text>}
          </TouchableOpacity>

          {/* 9. IRRIGATION STATUS */}
          <View className="w-[48%] bg-[#1e293b] p-3 rounded-xl border border-white/5 dark:border-slate-700 mb-3 shadow-md">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="opacity" size={16} color="#0ea5e9" />
              <Text className="text-gray-400 text-[10px] font-bold ml-1 uppercase">9. Irrigation</Text>
            </View>
            {twinData?.soil ? (
              <>
                <Text className={`text-sm font-bold mt-1 ${isIrrigationNeeded ? 'text-red-400' : 'text-blue-400'}`}>
                  {isIrrigationNeeded ? "Irrigation Required" : "No Irrigation Required"}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-[10px] mt-1 leading-tight">
                  {isIrrigationNeeded ? "Soil moisture is critically low." : "Soil moisture is optimal."}
                </Text>
              </>
            ) : <Text className="text-gray-600 dark:text-gray-300 text-xs italic">Data unavailable</Text>}
          </View>

          {/* 10. RECOMMENDED ACTIONS */}
          <View className="w-[48%] bg-[#1e293b] p-3 rounded-xl border border-white/5 dark:border-slate-700 mb-3 shadow-md">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="assignment-turned-in" size={16} color="#f43f5e" />
              <Text className="text-gray-400 text-[10px] font-bold ml-1 uppercase">10. Actions</Text>
            </View>
            {twinData?.recommendations && twinData.recommendations.length > 0 ? (
              <View className="mt-1">
                {twinData.recommendations.slice(0,2).map((rec: string, i: number) => (
                  <View key={i} className="flex-row items-start mb-1">
                    <MaterialIcons name="arrow-right" size={14} color="#f43f5e" />
                    <Text className="text-gray-300 text-[10px] flex-1 leading-tight">{rec}</Text>
                  </View>
                ))}
              </View>
            ) : <Text className="text-gray-600 dark:text-gray-300 text-xs italic">Data unavailable</Text>}
          </View>

        </View>

        {/* SECTION 11: Farm Location (Map) */}
        <View className="px-3 pb-8">
          <View className="bg-[#1e293b] p-4 rounded-xl border border-white/5 dark:border-slate-700 shadow-md">
            <View className="flex-row items-center mb-3">
              <MaterialIcons name="map" size={18} color="#3b82f6" />
              <Text className="text-white font-extrabold text-sm ml-2">Farm Location</Text>
            </View>
            <OpenStreetMap 
              location={farm?.location || ''} 
              farmName={farm?.farmName || 'Unknown Farm'} 
              cropName={farm?.currentCrop || twinData?.crop?.name || 'Unknown Crop'}
              areaAcres={farm?.size}
            />
          </View>
        </View>

      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#0f172a]/95 border-t border-white/10 p-4 pb-6 flex-row items-center justify-between backdrop-blur-lg">
        <View className="flex-1 mr-4">
          <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">Top Recommendation</Text>
          <View className="flex-row items-center">
            <MaterialIcons name={isIrrigationNeeded ? 'warning' : 'check-circle'} size={14} color={isIrrigationNeeded ? '#f59e0b' : '#10b981'} />
            <Text className="text-white text-xs font-bold ml-1 truncate" numberOfLines={1}>
              {isIrrigationNeeded ? "Irrigate crops immediately." : "Monitor soil after rainfall."}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          className="bg-green-600 px-4 py-2 rounded-full flex-row items-center"
          onPress={() => router.push(`/(farm)/farm-profile?id=${farm?.id}` as any)}
        >
          <Text className="text-white font-bold text-xs mr-1">Full Analytics</Text>
          <MaterialIcons name="chevron-right" size={16} color="white" />
        </TouchableOpacity>
      </View>

    </View>
  );
}
