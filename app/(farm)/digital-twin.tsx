import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import {
  getFarm,
  getFarmDigitalTwin,
} from '../../services/farm';

import { getMarketPrices } from '../../services/market';
import api from '../../services/api';

import { Farm } from '../../types/farm';

import {
  Canvas,
  useFrame,
} from '@react-three/fiber';

import {
  Center,
  OrbitControls,
} from '@react-three/drei';

import * as THREE from 'three';

import { OpenStreetMap } from '../../components/ui/OpenStreetMap';
import { Crop3DRenderer } from '../../components/DigitalTwin/CropRenderer';

import {
  getCropConfig,
  getCropStageName,
} from '../../components/DigitalTwin/cropConfigs';

import { useColorScheme } from 'nativewind';

const { width } = Dimensions.get('window');


// ============================================================
// ERROR BOUNDARY
// ============================================================

class ErrorBoundary extends React.Component<
  any,
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(
      '3D DIGITAL TWIN ERROR:',
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-[#0f172a]">

          <MaterialIcons
            name="error-outline"
            size={42}
            color="#ef4444"
          />

          <Text className="text-gray-300 font-bold mt-3">
            Unable to load 3D farm model
          </Text>

          <Text className="text-gray-500 text-xs mt-2 text-center px-8">
            The farm data is available, but the 3D renderer
            could not be loaded.
          </Text>

          <TouchableOpacity
            className="mt-5 bg-green-600 px-7 py-3 rounded-xl"
            onPress={() =>
              this.setState({
                hasError: false,
              })
            }
          >
            <Text className="text-white font-bold">
              Retry
            </Text>
          </TouchableOpacity>

        </View>
      );
    }

    return this.props.children;
  }
}


// ============================================================
// PROCEDURAL FARM 3D MODEL
// ============================================================

function ProceduralFarm({
  twinData,
  farm,
  simDaysOffset,
  onSelect,
}: {
  twinData: any;
  farm: Farm | null;
  simDaysOffset: number;
  onSelect: () => void;
}) {

  // ----------------------------------------------------------
  // FARM SIZE
  // ----------------------------------------------------------

  const acres =
    Number(twinData?.farm?.area_acres) ||
    Number(farm?.size) ||
    1;

  const safeAcres = Math.max(0.1, acres);

  const baseSize =
    Math.max(
      10,
      Math.sqrt(safeAcres) * 15
    );


  // ----------------------------------------------------------
  // SOIL / HEALTH
  // ----------------------------------------------------------

  const moisture =
    twinData?.soil?.moisture != null
      ? Number(twinData.soil.moisture)
      : 50;

  const health =
    twinData?.health_score != null
      ? Number(twinData.health_score)
      : 100;


  // ----------------------------------------------------------
  // CROP
  // ----------------------------------------------------------

  const cropName =
    farm?.currentCrop ||
    twinData?.crop?.name ||
    'Unknown Crop';

  const cropConfig = getCropConfig(cropName);

  const harvestDays =
    cropConfig?.maxGrowthDays || 120;


  // ----------------------------------------------------------
  // CROP AGE
  // ----------------------------------------------------------

  let ageDays = 0;

  if (farm?.plantingDate) {
    const plantingDate = new Date(farm.plantingDate);
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + simDaysOffset);

    const diffTime = currentDate.getTime() - plantingDate.getTime();
    ageDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  } else {
    // fallback
    ageDays = Math.max(0, (Number(twinData?.crop?.age_days) || 0) + simDaysOffset);
  }

  // ----------------------------------------------------------
  // GROWTH
  // ----------------------------------------------------------

  const environmentalModifier = Math.max(0, health) / 100.0;
  
  const effectiveAge = Math.min(
    Math.max(ageDays * environmentalModifier, 0),
    harvestDays
  );

  const growth = Math.min(
    100,
    Math.max(0, (effectiveAge / harvestDays) * 100)
  );

  // ----------------------------------------------------------
  // GROWTH STAGE
  // ----------------------------------------------------------

  const growthStage = getCropStageName(cropConfig, ageDays);


  // ----------------------------------------------------------
  // SOIL COLOR
  // ----------------------------------------------------------

  const soilColor =
    new THREE.Color().lerpColors(
      new THREE.Color('#d2b48c'),
      new THREE.Color('#3e2723'),
      Math.min(
        100,
        Math.max(0, moisture)
      ) / 100
    );


  // ----------------------------------------------------------
  // PLANT HEALTH COLOR
  // ----------------------------------------------------------

  const plantColor =
    new THREE.Color().lerpColors(
      new THREE.Color('#b45309'),
      new THREE.Color('#22c55e'),
      Math.min(
        100,
        Math.max(0, health)
      ) / 100
    );


  // ----------------------------------------------------------
  // SENSOR ANIMATION
  // ----------------------------------------------------------

  const materialRef =
    useRef<THREE.MeshStandardMaterial | null>(null);

  useFrame((state) => {

    if (materialRef.current) {

      materialRef.current.emissiveIntensity =
        0.35 +
        Math.sin(
          state.clock.elapsedTime * 2
        ) *
        0.2;
    }
  });


  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <group
      onClick={(event: any) => {
        event?.stopPropagation?.();
        onSelect();
      }}
    >

      {/* TERRAIN */}

      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
        position={[
          0,
          0,
          0,
        ]}
        receiveShadow
      >

        <planeGeometry
          args={[
            baseSize,
            baseSize,
            8,
            8,
          ]}
        />

        <meshStandardMaterial
          color={soilColor}
          roughness={0.9}
        />

      </mesh>


      {/* CROPS */}

      <Crop3DRenderer
        cropName={cropName}
        growthPercentage={growth}
        cropAge={effectiveAge}
        growthStage={growthStage}
        plantColor={plantColor}
        farmSize={baseSize}
      />


      {/* IOT SENSOR */}

      <group
        position={[
          baseSize * 0.3,
          0.5,
          baseSize * 0.3,
        ]}
      >

        <mesh>

          <cylinderGeometry
            args={[
              0.1,
              0.1,
              1,
            ]}
          />

          <meshStandardMaterial
            ref={materialRef}
            color="#0ea5e9"
            emissive="#0ea5e9"
            emissiveIntensity={0.35}
          />

        </mesh>

      </group>


      {/* FARM GRID */}

      <gridHelper
        args={[
          baseSize,
          Math.max(
            2,
            Math.floor(baseSize)
          ),
        ]}
        position={[
          0,
          0.02,
          0,
        ]}
      />

    </group>
  );
}


// ============================================================
// DIGITAL TWIN SCREEN
// ============================================================

export default function DigitalTwinScreen() {

  const { id } =
    useLocalSearchParams();

  const router =
    useRouter();

  const { colorScheme } =
    useColorScheme();


  // ==========================================================
  // DATA STATES
  // ==========================================================

  const [
    farm,
    setFarm,
  ] = useState<Farm | null>(null);

  const [
    twinData,
    setTwinData,
  ] = useState<any>(null);

  const [
    marketData,
    setMarketData,
  ] = useState<any>(null);

  const [
    yieldData,
    setYieldData,
  ] = useState<any>(null);


  // ==========================================================
  // UI STATES
  // ==========================================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    showOverlay,
    setShowOverlay,
  ] = useState(false);

  const [
    overlayTab,
    setOverlayTab,
  ] = useState<'crop' | 'soil'>('crop');

  const [
    resetKey,
    setResetKey,
  ] = useState(0);

  const [
    currentTime,
    setCurrentTime,
  ] = useState(
    new Date().toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  );


  // ==========================================================
  // SIMULATION
  // ==========================================================

  const [
    simDaysOffset,
    setSimDaysOffset,
  ] = useState(0);


  // ==========================================================
  // FETCH DATA
  // ==========================================================

  const fetchData = async () => {

    if (!id) {

      console.error(
        'DIGITAL TWIN: FARM ID MISSING'
      );

      setLoading(false);

      return;
    }


    console.log(
      '========================================'
    );

    console.log(
      'DIGITAL TWIN FETCH START'
    );

    console.log(
      'FARM ID:',
      id
    );

    console.log(
      'SIM OFFSET:',
      simDaysOffset
    );


    try {

      // ======================================================
      // 1. FARM
      // ======================================================

      console.log(
        'Fetching farm...'
      );

      const fData =
        await getFarm(id as string);

      console.log(
        'FARM RESPONSE:',
        JSON.stringify(
          fData,
          null,
          2
        )
      );


      if (!fData) {

        console.error(
          'Farm data not found'
        );

        setFarm(null);
        setTwinData(null);
        setYieldData(null);
        setMarketData(null);

        return;
      }


      setFarm(fData);


      // ======================================================
      // 2. SIMULATION DATE
      // ======================================================

      let simDateStr:
        string | undefined =
        undefined;


      if (simDaysOffset !== 0) {

        const d =
          new Date();

        d.setDate(
          d.getDate() +
          simDaysOffset
        );

        simDateStr =
          d.toISOString();
      }


      console.log(
        'SIM DATE:',
        simDateStr || 'TODAY'
      );


      // ======================================================
      // 3. DIGITAL TWIN API
      // ======================================================

      console.log(
        'Calling Digital Twin API:',
        `/farms/${id}/digital-twin`
      );


      let tData:
        any = null;


      try {

        tData =
          await getFarmDigitalTwin(
            id as string,
            simDateStr
          );

        console.log(
          'DIGITAL TWIN SUCCESS:',
          JSON.stringify(
            tData,
            null,
            2
          )
        );

      } catch (error: any) {

        console.error(
          'DIGITAL TWIN API FAILED'
        );

        console.error(
          'STATUS:',
          error?.response?.status
        );

        console.error(
          'DATA:',
          error?.response?.data
        );

        console.error(
          'MESSAGE:',
          error?.message
        );

        tData = null;
      }


      setTwinData(tData);


      // ======================================================
      // 4. YIELD API
      // ======================================================

      let yData:
        any = null;


      try {

        const query =
          simDateStr
            ? `?sim_date=${encodeURIComponent(
                simDateStr
              )}`
            : '';


        console.log(
          'Calling Yield API:',
          `/farms/${id}/yield${query}`
        );


        const response =
          await api.get(
            `/farms/${id}/yield${query}`
          );


        yData =
          response.data;


        console.log(
          'YIELD SUCCESS:',
          JSON.stringify(
            yData,
            null,
            2
          )
        );

      } catch (error: any) {

        console.error(
          'YIELD API FAILED'
        );

        console.error(
          'STATUS:',
          error?.response?.status
        );

        console.error(
          'DATA:',
          error?.response?.data
        );

        console.error(
          'MESSAGE:',
          error?.message
        );

        yData = null;
      }


      setYieldData(yData);


      // ======================================================
      // 5. MARKET API
      // ======================================================

      if (
        fData.location &&
        fData.currentCrop
      ) {

        try {

          console.log(
            'Fetching market data...'
          );


          const location =
            String(
              fData.location
            );


          const parts =
            location
              .split(',')
              .map(
                (item) =>
                  item.trim()
              )
              .filter(
                Boolean
              );


          let district = '';
          let state = '';


          if (parts.length >= 2) {

            district =
              parts[0];

            state =
              parts[1];

          } else {

            state =
              location;
          }


          console.log(
            'MARKET STATE:',
            state
          );

          console.log(
            'MARKET DISTRICT:',
            district
          );

          console.log(
            'MARKET CROP:',
            fData.currentCrop
          );


          const mData =
            await getMarketPrices(
              state,
              district,
              fData.currentCrop
            );


          console.log(
            'MARKET RESPONSE:',
            JSON.stringify(
              mData,
              null,
              2
            )
          );


          if (
            mData?.success &&
            Array.isArray(
              mData.records
            ) &&
            mData.records.length > 0
          ) {

            let highest = -1;

            let selectedRecord:
              any = null;


            mData.records.forEach(
              (record: any) => {

                let price =
                  parseFloat(
                    record.modal_price
                  );


                if (
                  isNaN(price)
                ) {

                  const min =
                    parseFloat(
                      record.min_price
                    );

                  const max =
                    parseFloat(
                      record.max_price
                    );


                  if (
                    !isNaN(min) &&
                    !isNaN(max)
                  ) {

                    price =
                      (min + max) / 2;
                  }
                }


                if (
                  !isNaN(price) &&
                  price > highest
                ) {

                  highest =
                    price;

                  selectedRecord =
                    record;
                }

              }
            );


            setMarketData(
              selectedRecord
            );

          } else {

            console.warn(
              'No market records'
            );

            setMarketData(null);
          }

        } catch (error: any) {

          console.error(
            'MARKET API FAILED:',
            error?.message
          );

          setMarketData(null);
        }

      } else {

        console.warn(
          'Market API skipped: location/crop missing'
        );

        setMarketData(null);
      }


      console.log(
        'DIGITAL TWIN FETCH COMPLETE'
      );

      console.log(
        '========================================'
      );

    } catch (error: any) {

      console.error(
        'DIGITAL TWIN GENERAL ERROR:',
        error
      );

    } finally {

      setLoading(false);
      setRefreshing(false);
    }
  };


  // ==========================================================
  // EFFECT
  // ==========================================================

  useEffect(() => {

    fetchData();


    const timer =
      setInterval(
        () => {

          setCurrentTime(
            new Date().toLocaleTimeString(
              [],
              {
                hour: '2-digit',
                minute: '2-digit',
              }
            )
          );

        },
        60000
      );


    return () =>
      clearInterval(timer);

  }, [
    id,
    // Removed simDaysOffset so we don't spam the API on day increments.
    // The visual UI updates synchronously based on local calculation.
  ]);


  // ==========================================================
  // REFRESH
  // ==========================================================

  const onRefresh = () => {

    setRefreshing(true);

    fetchData();
  };


  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (
    loading &&
    !refreshing
  ) {

    return (
      <View className="flex-1 justify-center items-center bg-[#0f172a]">

        <MaterialIcons
          name="agriculture"
          size={42}
          color="#10b981"
        />

        <Text className="text-white font-bold mt-3">
          Loading Digital Twin...
        </Text>

        <Text className="text-gray-500 text-xs mt-2">
          Connecting farm data...
        </Text>

      </View>
    );
  }


  // ==========================================================
  // VALUES
  // ==========================================================

  const moisture =
    twinData?.soil?.moisture != null
      ? Number(
          twinData.soil.moisture
        )
      : null;


  const isIrrigationNeeded =
    moisture !== null &&
    moisture < 40;


  const farmLocation =
    farm?.location ||
    twinData?.farm?.location ||
    'Location unavailable';


  const farmCrop =
    farm?.currentCrop ||
    twinData?.crop?.name ||
    'Unknown Crop';


  // SYNC SIMULATION VALUES FOR OVERLAY
  let currentSimAge = 0;
  if (farm?.plantingDate) {
    const pDate = new Date(farm.plantingDate);
    const cDate = new Date();
    cDate.setDate(cDate.getDate() + simDaysOffset);
    currentSimAge = Math.max(0, Math.ceil((cDate.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24)));
  } else {
    currentSimAge = Math.max(0, (Number(twinData?.crop?.age_days) || 0) + simDaysOffset);
  }
  const config = getCropConfig(farmCrop);
  const currentSimStage = getCropStageName(config, currentSimAge);


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (

    <View className="flex-1 bg-[#0f172a]">


      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <View className="pt-14 pb-4 px-4 bg-[#1e293b] flex-row justify-between items-center border-b border-white/5">

        <View className="flex-row items-center">

          <TouchableOpacity
            onPress={() =>
              router.push(
                '/(tabs)/dashboard'
              )
            }
            className="mr-3 p-2 rounded-full bg-white/10"
          >

            <MaterialIcons
              name="arrow-back"
              size={22}
              color="white"
            />

          </TouchableOpacity>


          <View>

            <Text className="text-white font-extrabold text-lg">
              AgriTwin
            </Text>

            <View className="flex-row items-center mt-1">

              <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />

              <Text className="text-gray-400 text-xs font-bold">
                3D Digital Twin Live
              </Text>

            </View>

          </View>

        </View>


        <View className="items-end">

          <Text className="text-white font-bold">
            {currentTime}
          </Text>

          <View className="flex-row items-center mt-1">

            <MaterialIcons
              name="thermostat"
              size={13}
              color="#94a3b8"
            />

            <Text className="text-gray-400 text-xs ml-1">

              {twinData?.weather?.temperature != null
                ? `${twinData.weather.temperature}°C`
                : '--'}

            </Text>

          </View>

        </View>

      </View>


      {/* ==================================================== */}
      {/* SCROLL */}
      {/* ==================================================== */}

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
          />
        }
      >


        {/* ================================================== */}
        {/* 3D VIEW */}
        {/* ================================================== */}

        <View className="w-full h-[350px] relative bg-[#0f172a]">

          <ErrorBoundary>

            <React.Suspense
              fallback={
                <View className="flex-1 justify-center items-center">

                  <Text className="text-gray-400">
                    Loading 3D Farm...
                  </Text>

                </View>
              }
            >

              <Canvas
                key={resetKey}
                camera={{
                  position: [
                    6,
                    4,
                    6,
                  ],
                  fov: 45,
                }}
              >

                {/* BASIC LIGHTING ONLY */}
                {/* Environment removed to avoid mobile 3D loading issues */}

                <ambientLight
                  intensity={0.7}
                />

                <directionalLight
                  position={[
                    10,
                    10,
                    5,
                  ]}
                  intensity={1.5}
                />

                <Center>

                  <ProceduralFarm
                    twinData={twinData}
                    farm={farm}
                    simDaysOffset={
                      simDaysOffset
                    }
                    onSelect={() =>
                      setShowOverlay(true)
                    }
                  />

                </Center>


                <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  autoRotate={
                    !showOverlay
                  }
                  autoRotateSpeed={0.5}
                />

              </Canvas>


              {/* ================================================= */}
              {/* CROP INFO */}
              {/* ================================================= */}

              <View className="absolute bottom-16 left-4 bg-black/80 p-3 rounded-xl border border-white/20 w-48">

                <Text className="text-white font-bold text-sm mb-2">
                  {farmCrop}
                </Text>


                {(() => {
                  const config = getCropConfig(farmCrop);
                  const maxDays = config?.maxGrowthDays || 120;

                  let simAge = 0;
                  if (farm?.plantingDate) {
                    const pDate = new Date(farm.plantingDate);
                    const cDate = new Date();
                    cDate.setDate(cDate.getDate() + simDaysOffset);
                    simAge = Math.max(0, Math.ceil((cDate.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24)));
                  } else {
                    simAge = Math.max(0, (Number(twinData?.crop?.age_days) || 0) + simDaysOffset);
                  }

                  const health = twinData?.health_score != null ? Number(twinData.health_score) : 100;
                  const environmentalModifier = Math.max(0, health) / 100.0;
                  
                  const effectiveAge = Math.min(
                    Math.max(simAge * environmentalModifier, 0),
                    maxDays
                  );

                  const growth = Math.min(100, Math.floor((effectiveAge / maxDays) * 100));
                  const stage = getCropStageName(config, simAge);


                  return (
                    <>

                      <View className="flex-row justify-between mb-1">

                        <Text className="text-gray-400 text-[10px]">
                          Age
                        </Text>

                        <Text className="text-white font-bold text-[10px]">
                          {simAge} days
                        </Text>

                      </View>


                      <View className="flex-row justify-between mb-1">

                        <Text className="text-gray-400 text-[10px]">
                          Max Age
                        </Text>

                        <Text className="text-white font-bold text-[10px]">
                          {maxDays} days
                        </Text>

                      </View>


                      <View className="flex-row justify-between mb-1">

                        <Text className="text-gray-400 text-[10px]">
                          Growth
                        </Text>

                        <Text className="text-green-400 font-bold text-[10px]">
                          {growth}%
                        </Text>

                      </View>


                      <View className="flex-row justify-between">

                        <Text className="text-gray-400 text-[10px]">
                          Stage
                        </Text>

                        <Text className="text-white font-bold text-[9px] text-right flex-1 ml-2">
                          {stage}
                        </Text>

                      </View>

                    </>
                  );

                })()}

              </View>


              {/* ================================================= */}
              {/* LOCATION */}
              {/* ================================================= */}

              <View className="absolute top-4 right-4 bg-black/70 px-3 py-2 rounded-full flex-row items-center border border-white/10 max-w-[65%]">

                <MaterialIcons
                  name="location-on"
                  size={15}
                  color="#ef4444"
                />

                <Text
                  className="text-white text-xs font-bold ml-1"
                  numberOfLines={1}
                >
                  {farmLocation}
                </Text>

              </View>


              {/* ================================================= */}
              {/* OVERLAY */}
              {/* ================================================= */}

              {showOverlay &&
                twinData && (

                  <View className="absolute top-10 self-center w-[85%] bg-black/90 rounded-2xl p-4 border border-white/20">

                    <View className="flex-row justify-between items-center mb-3">

                      <View className="flex-row">

                        <TouchableOpacity
                          className={`px-3 py-2 rounded-lg ${
                            overlayTab === 'crop'
                              ? 'bg-green-600'
                              : 'bg-white/10'
                          }`}
                          onPress={() =>
                            setOverlayTab(
                              'crop'
                            )
                          }
                        >

                          <Text className="text-white text-xs font-bold">
                            🌾 CROP
                          </Text>

                        </TouchableOpacity>


                        <TouchableOpacity
                          className={`px-3 py-2 rounded-lg ml-2 ${
                            overlayTab === 'soil'
                              ? 'bg-amber-700'
                              : 'bg-white/10'
                          }`}
                          onPress={() =>
                            setOverlayTab(
                              'soil'
                            )
                          }
                        >

                          <Text className="text-white text-xs font-bold">
                            🌱 SOIL
                          </Text>

                        </TouchableOpacity>

                      </View>


                      <TouchableOpacity
                        onPress={() =>
                          setShowOverlay(
                            false
                          )
                        }
                        className="p-2 bg-white/10 rounded-full"
                      >

                        <MaterialIcons
                          name="close"
                          size={17}
                          color="white"
                        />

                      </TouchableOpacity>

                    </View>


                    {overlayTab ===
                    'crop' ? (

                      <View>

                        <Text className="text-white font-black text-lg mb-3">
                          {twinData?.crop?.name ||
                            farmCrop}
                        </Text>


                        <View className="flex-row justify-between mb-2">

                          <Text className="text-gray-400 text-xs">
                            Health
                          </Text>

                          <Text className="text-green-400 font-bold text-xs">
                            {twinData?.health_score ?? '--'}%
                          </Text>

                        </View>


                        <View className="flex-row justify-between mb-2">

                          <Text className="text-gray-400 text-xs">
                            Growth Stage
                          </Text>

                          <Text className="text-white font-bold text-xs">
                            {currentSimStage || '--'}
                          </Text>

                        </View>


                        <View className="flex-row justify-between mb-2">

                          <Text className="text-gray-400 text-xs">
                            Crop Age
                          </Text>

                          <Text className="text-white font-bold text-xs">
                            {currentSimAge ?? '--'} Days
                          </Text>

                        </View>


                        <View className="flex-row justify-between mb-2">

                          <Text className="text-gray-400 text-xs">
                            Moisture
                          </Text>

                          <Text className="text-blue-400 font-bold text-xs">
                            {twinData?.soil?.moisture ??
                              '--'}%
                          </Text>

                        </View>


                        <View className="flex-row justify-between">

                          <Text className="text-gray-400 text-xs">
                            Yield
                          </Text>

                          <Text className="text-yellow-400 font-bold text-xs">
                            {yieldData?.estimated_yield != null
                              ? `${yieldData.estimated_yield} Qt`
                              : '--'}
                          </Text>

                        </View>

                      </View>

                    ) : (

                      <View>

                        <Text className="text-white font-black text-lg mb-3">
                          SOIL DETAILS
                        </Text>


                        <View className="flex-row justify-between mb-2">

                          <Text className="text-gray-400 text-xs">
                            Soil Type
                          </Text>

                          <Text className="text-amber-400 font-bold text-xs">
                            {farm?.soilType ||
                              '--'}
                          </Text>

                        </View>


                        <View className="flex-row justify-between mb-2">

                          <Text className="text-gray-400 text-xs">
                            pH
                          </Text>

                          <Text className="text-white font-bold text-xs">
                            {twinData?.soil?.ph ??
                              '--'}
                          </Text>

                        </View>


                        <View className="flex-row justify-between mb-2">

                          <Text className="text-gray-400 text-xs">
                            Moisture
                          </Text>

                          <Text className="text-blue-400 font-bold text-xs">
                            {twinData?.soil?.moisture ??
                              '--'}%
                          </Text>

                        </View>


                        <View className="flex-row justify-between mb-2">

                          <Text className="text-gray-400 text-xs">
                            Nitrogen
                          </Text>

                          <Text className="text-white font-bold text-xs">
                            {twinData?.soil?.nitrogen ??
                              '--'}
                          </Text>

                        </View>


                        <View className="flex-row justify-between mb-2">

                          <Text className="text-gray-400 text-xs">
                            Phosphorus
                          </Text>

                          <Text className="text-white font-bold text-xs">
                            {twinData?.soil?.phosphorus ??
                              '--'}
                          </Text>

                        </View>


                        <View className="flex-row justify-between">

                          <Text className="text-gray-400 text-xs">
                            Potassium
                          </Text>

                          <Text className="text-white font-bold text-xs">
                            {twinData?.soil?.potassium ??
                              '--'}
                          </Text>

                        </View>

                      </View>

                    )}

                  </View>
                )}


              {/* ================================================= */}
              {/* RESET */}
              {/* ================================================= */}

              <TouchableOpacity
                className="absolute bottom-4 right-4 bg-white/90 px-3 py-2 rounded-full flex-row items-center"
                onPress={() => {

                  setResetKey(
                    (prev) =>
                      prev + 1
                  );

                  setShowOverlay(
                    false
                  );

                }}
              >

                <MaterialIcons
                  name="restart-alt"
                  size={15}
                  color={
                    colorScheme ===
                    'dark'
                      ? 'white'
                      : '#374151'
                  }
                />

                <Text className="text-gray-700 font-bold text-[10px] ml-1">
                  Reset
                </Text>

              </TouchableOpacity>

            </React.Suspense>

          </ErrorBoundary>

        </View>


        {/* ================================================== */}
        {/* TIME TRAVEL */}
        {/* ================================================== */}

        <View className="px-3 mt-4 mb-2">

          <View className="bg-[#1e293b] p-3 rounded-xl border border-blue-500/30">

            <View className="flex-row items-center justify-between mb-3">

              <View className="flex-row items-center">

                <MaterialIcons
                  name="schedule"
                  size={17}
                  color="#3b82f6"
                />

                <Text className="text-blue-400 font-extrabold text-xs ml-1 uppercase">
                  Time Travel Simulator
                </Text>

              </View>


              <Text className="text-white text-xs font-bold bg-blue-900/40 px-2 py-1 rounded">

                {simDaysOffset === 0
                  ? 'Today'
                  : simDaysOffset > 0
                  ? `+${simDaysOffset} Days`
                  : `${simDaysOffset} Days`}

              </Text>

            </View>


            <View className="flex-row justify-between">

              <TouchableOpacity
                onPress={() =>
                  setSimDaysOffset(
                    (prev) =>
                      prev - 10
                  )
                }
                className="bg-slate-800 px-2 py-2 rounded-lg flex-1 mr-1 items-center"
              >

                <Text className="text-white text-[10px] font-bold">
                  -10 Days
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                onPress={() =>
                  setSimDaysOffset(0)
                }
                className={`px-2 py-2 rounded-lg flex-1 mx-1 items-center ${
                  simDaysOffset === 0
                    ? 'bg-blue-600'
                    : 'bg-slate-800'
                }`}
              >

                <Text className="text-white text-[10px] font-bold">
                  Today
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                onPress={() =>
                  setSimDaysOffset(
                    (prev) =>
                      prev + 10
                  )
                }
                className="bg-slate-800 px-2 py-2 rounded-lg flex-1 mx-1 items-center"
              >

                <Text className="text-white text-[10px] font-bold">
                  +10 Days
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                onPress={() =>
                  setSimDaysOffset(
                    (prev) =>
                      prev + 30
                  )
                }
                className="bg-slate-800 px-2 py-2 rounded-lg flex-1 ml-1 items-center"
              >

                <Text className="text-white text-[10px] font-bold">
                  +30 Days
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </View>


        {/* ================================================== */}
        {/* DATA CARDS */}
        {/* ================================================== */}

        <View className="px-3 pb-24 flex-row flex-wrap justify-between">


          {/* 1 HEALTH */}

          <TouchableOpacity
            onPress={() =>
              farm?.id &&
              router.push(
                `/(farm)/farm-profile?id=${farm.id}` as any
              )
            }
            className="w-[48%] bg-[#1e293b] p-3 rounded-xl mb-3"
          >

            <View className="flex-row items-center mb-2">

              <MaterialIcons
                name="eco"
                size={16}
                color="#10b981"
              />

              <Text className="text-gray-400 text-[10px] font-bold ml-1">
                1. CROP HEALTH
              </Text>

            </View>


            {twinData ? (

              <>

                <Text className="text-white font-extrabold text-lg">
                  {twinData.health_score ?? '--'}%
                </Text>

                <Text className="text-green-400 text-xs font-bold mt-1">
                  {Number(
                    twinData.health_score || 0
                  ) > 80
                    ? 'Optimal'
                    : 'Needs Attention'}
                </Text>

              </>

            ) : (

              <Text className="text-gray-500 text-xs italic">
                Data unavailable
              </Text>

            )}

          </TouchableOpacity>


          {/* 2 MOISTURE */}

          <TouchableOpacity
            onPress={() =>
              farm?.id &&
              router.push(
                `/(farm)/soil?id=${farm.id}` as any
              )
            }
            className="w-[48%] bg-[#1e293b] p-3 rounded-xl mb-3"
          >

            <View className="flex-row items-center mb-2">

              <MaterialIcons
                name="water-drop"
                size={16}
                color="#3b82f6"
              />

              <Text className="text-gray-400 text-[10px] font-bold ml-1">
                2. SOIL MOISTURE
              </Text>

            </View>


            {moisture !== null ? (

              <>

                <Text className="text-white font-extrabold text-lg">
                  {moisture}%
                </Text>

                <Text className={`text-xs font-bold mt-1 ${
                  moisture < 40
                    ? 'text-red-400'
                    : moisture > 70
                    ? 'text-blue-400'
                    : 'text-green-400'
                }`}>

                  {moisture < 40
                    ? 'Low'
                    : moisture > 70
                    ? 'High'
                    : 'Optimal'}

                </Text>

              </>

            ) : (

              <Text className="text-gray-500 text-xs italic">
                Soil data unavailable
              </Text>

            )}

          </TouchableOpacity>


          {/* 3 PH */}

          <TouchableOpacity
            onPress={() =>
              farm?.id &&
              router.push(
                `/(farm)/soil?id=${farm.id}` as any
              )
            }
            className="w-[48%] bg-[#1e293b] p-3 rounded-xl mb-3"
          >

            <View className="flex-row items-center mb-2">

              <MaterialIcons
                name="science"
                size={16}
                color="#f59e0b"
              />

              <Text className="text-gray-400 text-[10px] font-bold ml-1">
                3. SOIL PH
              </Text>

            </View>


            {twinData?.soil?.ph != null ? (

              <Text className="text-white font-extrabold text-lg">
                {twinData.soil.ph}
              </Text>

            ) : (

              <Text className="text-gray-500 text-xs italic">
                Soil data unavailable
              </Text>

            )}

          </TouchableOpacity>


          {/* 4 NUTRIENTS */}

          <TouchableOpacity
            onPress={() =>
              farm?.id &&
              router.push(
                `/(farm)/soil?id=${farm.id}` as any
              )
            }
            className="w-[48%] bg-[#1e293b] p-3 rounded-xl mb-3"
          >

            <View className="flex-row items-center mb-2">

              <MaterialIcons
                name="bubble-chart"
                size={16}
                color="#a855f7"
              />

              <Text className="text-gray-400 text-[10px] font-bold ml-1">
                4. NUTRIENTS
              </Text>

            </View>


            {twinData?.soil?.nitrogen != null ? (

              <View className="flex-row justify-between">

                <View className="items-center">
                  <Text className="text-gray-500 text-[10px]">
                    N
                  </Text>

                  <Text className="text-white text-xs font-bold">
                    {twinData.soil.nitrogen}
                  </Text>
                </View>


                <View className="items-center">
                  <Text className="text-gray-500 text-[10px]">
                    P
                  </Text>

                  <Text className="text-white text-xs font-bold">
                    {twinData.soil.phosphorus ?? '--'}
                  </Text>
                </View>


                <View className="items-center">
                  <Text className="text-gray-500 text-[10px]">
                    K
                  </Text>

                  <Text className="text-white text-xs font-bold">
                    {twinData.soil.potassium ?? '--'}
                  </Text>
                </View>

              </View>

            ) : (

              <Text className="text-gray-500 text-xs italic">
                Soil data unavailable
              </Text>

            )}

          </TouchableOpacity>


          {/* 5 WEATHER */}

          <TouchableOpacity
            className="w-[48%] bg-[#1e293b] p-3 rounded-xl mb-3"
          >

            <View className="flex-row items-center mb-2">

              <MaterialIcons
                name="wb-sunny"
                size={16}
                color="#fcd34d"
              />

              <Text className="text-gray-400 text-[10px] font-bold ml-1">
                5. WEATHER
              </Text>

            </View>


            {twinData?.weather ? (

              <>

                <Text className="text-white font-extrabold text-lg">
                  {twinData.weather.temperature}°C
                </Text>

                <Text className="text-gray-300 text-xs mt-1">
                  {twinData.weather.condition || '--'}
                </Text>

                <Text className="text-blue-300 text-[10px] mt-1">
                  Humidity: {twinData.weather.humidity ?? '--'}%
                </Text>

              </>

            ) : (

              <Text className="text-gray-500 text-xs italic">
                Weather data unavailable
              </Text>

            )}

          </TouchableOpacity>


          {/* 6 DISEASE */}

          <TouchableOpacity
            onPress={() =>
              router.push(
                `/(farm)/disease-detection` as any
              )
            }
            className="w-[48%] bg-[#1e293b] p-3 rounded-xl mb-3"
          >

            <View className="flex-row items-center mb-2">

              <MaterialIcons
                name="bug-report"
                size={16}
                color="#ef4444"
              />

              <Text className="text-gray-400 text-[10px] font-bold ml-1">
                6. DISEASE
              </Text>

            </View>


            {farm?.latestDisease ? (

              <Text className="text-red-400 font-bold text-xs">
                {farm.latestDisease}
              </Text>

            ) : (

              <>

                <Text className="text-green-400 font-bold text-sm">
                  Healthy
                </Text>

                <Text className="text-gray-500 text-[10px] mt-2">
                  No disease prediction available.
                </Text>

              </>

            )}

          </TouchableOpacity>


          {/* 7 YIELD */}

          <TouchableOpacity
            onPress={() => {

              if (!farm?.id) return;

              const d =
                new Date();

              d.setDate(
                d.getDate() +
                simDaysOffset
              );

              const query =
                simDaysOffset !== 0
                  ? `&sim_date=${encodeURIComponent(
                      d.toISOString()
                    )}`
                  : '';

              router.push(
                `/(farm)/yield-prediction?id=${farm.id}${query}` as any
              );

            }}
            className="w-[48%] bg-[#1e293b] p-3 rounded-xl mb-3"
          >

            <View className="flex-row items-center mb-2">

              <MaterialIcons
                name="trending-up"
                size={16}
                color="#10b981"
              />

              <Text className="text-gray-400 text-[10px] font-bold ml-1">
                7. YIELD
              </Text>

            </View>


            {yieldData?.estimated_yield != null ? (

              <>

                <Text className="text-white font-extrabold text-lg">
                  {yieldData.estimated_yield}
                </Text>

                <Text className="text-gray-300 text-xs">
                  Quintals
                </Text>

              </>

            ) : (

              <Text className="text-gray-500 text-xs italic">
                Yield prediction unavailable
              </Text>

            )}

          </TouchableOpacity>


          {/* 8 MARKET */}

          <TouchableOpacity
            onPress={() =>
              farm?.id &&
              router.push(
                `/(farm)/market-price?id=${farm.id}` as any
              )
            }
            className="w-[48%] bg-[#1e293b] p-3 rounded-xl mb-3"
          >

            <View className="flex-row items-center mb-2">

              <MaterialIcons
                name="storefront"
                size={16}
                color="#2563eb"
              />

              <Text className="text-gray-400 text-[10px] font-bold ml-1">
                8. MARKET PRICE
              </Text>

            </View>


            {marketData ? (

              <>

                <Text className="text-green-400 font-extrabold text-lg">

                  ₹
                  {marketData.modal_price
                    ? parseFloat(
                        marketData.modal_price
                      ).toLocaleString(
                        'en-IN'
                      )
                    : '--'}

                </Text>

                <Text
                  className="text-gray-300 text-[10px] mt-1"
                  numberOfLines={1}
                >
                  {marketData.market || '--'}
                </Text>

              </>

            ) : (

              <Text className="text-gray-500 text-xs italic">
                Market data unavailable
              </Text>

            )}

          </TouchableOpacity>


          {/* 9 IRRIGATION */}

          <View className="w-[48%] bg-[#1e293b] p-3 rounded-xl mb-3">

            <View className="flex-row items-center mb-2">

              <MaterialIcons
                name="opacity"
                size={16}
                color="#0ea5e9"
              />

              <Text className="text-gray-400 text-[10px] font-bold ml-1">
                9. IRRIGATION
              </Text>

            </View>


            {moisture !== null ? (

              <>

                <Text className={`text-sm font-bold ${
                  isIrrigationNeeded
                    ? 'text-red-400'
                    : 'text-blue-400'
                }`}>

                  {isIrrigationNeeded
                    ? 'Irrigation Required'
                    : 'No Irrigation Required'}

                </Text>

                <Text className="text-gray-500 text-[10px] mt-1">
                  Soil moisture: {moisture}%
                </Text>

              </>

            ) : (

              <Text className="text-gray-500 text-xs italic">
                Data unavailable
              </Text>

            )}

          </View>


          {/* 10 ACTIONS */}

          <View className="w-[48%] bg-[#1e293b] p-3 rounded-xl mb-3">

            <View className="flex-row items-center mb-2">

              <MaterialIcons
                name="assignment-turned-in"
                size={16}
                color="#f43f5e"
              />

              <Text className="text-gray-400 text-[10px] font-bold ml-1">
                10. ACTIONS
              </Text>

            </View>


            {Array.isArray(
              twinData?.recommendations
            ) &&
            twinData.recommendations.length >
              0 ? (

              twinData.recommendations
                .slice(0, 2)
                .map(
                  (
                    rec: string,
                    index: number
                  ) => (

                    <View
                      key={index}
                      className="flex-row items-start mb-1"
                    >

                      <MaterialIcons
                        name="arrow-right"
                        size={14}
                        color="#f43f5e"
                      />

                      <Text className="text-gray-300 text-[10px] flex-1">
                        {rec}
                      </Text>

                    </View>

                  )
                )

            ) : (

              <Text className="text-gray-500 text-xs italic">
                No actions available
              </Text>

            )}

          </View>

        </View>


        {/* ================================================== */}
        {/* LOCATION MAP */}
        {/* ================================================== */}

        <View className="px-3 pb-8">

          <View className="bg-[#1e293b] p-4 rounded-xl">

            <View className="flex-row items-center mb-3">

              <MaterialIcons
                name="map"
                size={19}
                color="#3b82f6"
              />

              <Text className="text-white font-extrabold text-sm ml-2">
                Farm Location
              </Text>

            </View>


            {/* LOCATION TEXT */}

            <View className="bg-[#0f172a] rounded-xl p-3 mb-3">

              <View className="flex-row items-center">

                <MaterialIcons
                  name="location-on"
                  size={20}
                  color="#ef4444"
                />

                <Text className="text-white font-bold ml-2 flex-1">
                  {farmLocation}
                </Text>

              </View>

            </View>


            {/* MAP */}

            <OpenStreetMap
              location={
                farm?.location || ''
              }
              farmName={
                farm?.farmName ||
                'AgriTwin Farm'
              }
              cropName={
                farmCrop
              }
              areaAcres={
                farm?.size
              }
            />

          </View>

        </View>


      </ScrollView>


      {/* ==================================================== */}
      {/* BOTTOM BAR */}
      {/* ==================================================== */}

      <View className="absolute bottom-0 left-0 right-0 bg-[#0f172a] border-t border-white/10 p-4 pb-6 flex-row items-center justify-between">

        <View className="flex-1 mr-3">

          <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">
            Top Recommendation
          </Text>

          <View className="flex-row items-center">

            <MaterialIcons
              name={
                isIrrigationNeeded
                  ? 'warning'
                  : 'check-circle'
              }
              size={14}
              color={
                isIrrigationNeeded
                  ? '#f59e0b'
                  : '#10b981'
              }
            />

            <Text
              className="text-white text-xs font-bold ml-1"
              numberOfLines={1}
            >

              {isIrrigationNeeded
                ? 'Irrigate crops immediately.'
                : 'Monitor soil after rainfall.'}

            </Text>

          </View>

        </View>


        <TouchableOpacity
          className="bg-green-600 px-4 py-3 rounded-full flex-row items-center"
          onPress={() =>
            farm?.id &&
            router.push(
              `/(farm)/farm-profile?id=${farm.id}` as any
            )
          }
        >

          <Text className="text-white font-bold text-xs mr-1">
            Full Analytics
          </Text>

          <MaterialIcons
            name="chevron-right"
            size={16}
            color="white"
          />

        </TouchableOpacity>

      </View>

    </View>
  );
}