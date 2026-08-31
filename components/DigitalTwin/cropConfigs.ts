export interface CropStageConfig {
  name: string;
  endDay: number;
}

export interface CropConfig {
  id: string;
  names: string[];
  maxGrowthDays: number;
  spacing: { row: number; plant: number };
  stages: CropStageConfig[];
}

export const CROP_CONFIGS: CropConfig[] = [
  {
    id: 'banana',
    names: ['banana', 'Banana', 'BANANA'],
    maxGrowthDays: 300,
    spacing: { row: 2.0, plant: 2.0 },
    stages: [
      { name: 'Planting', endDay: 30 },
      { name: 'Young Plant', endDay: 90 },
      { name: 'Vegetative Growth', endDay: 180 },
      { name: 'Mature', endDay: 220 },
      { name: 'Flowering', endDay: 245 },
      { name: 'Fruit Development', endDay: 275 },
      { name: 'Harvest Ready', endDay: 300 }
    ]
  },
  {
    id: 'mango',
    names: ['mango', 'Mango', 'MANGO'],
    maxGrowthDays: 365,
    spacing: { row: 4.0, plant: 4.0 },
    stages: [
      { name: 'Seedling', endDay: 30 },
      { name: 'Young Tree', endDay: 100 },
      { name: 'Vegetative Growth', endDay: 180 },
      { name: 'Mature Tree', endDay: 240 },
      { name: 'Flowering', endDay: 270 },
      { name: 'Fruit Development', endDay: 310 },
      { name: 'Fruit Growth', endDay: 350 },
      { name: 'Harvest Ready', endDay: 365 }
    ]
  },
  {
    id: 'jasmine',
    names: ['jasmine', 'Jasmine', 'JASMINE'],
    maxGrowthDays: 130, // Assuming 130 days as requested in the tests ("Jasmine Day 130+ -> Harvest Ready")
    spacing: { row: 1.0, plant: 1.0 },
    stages: [
      { name: 'Early Seedling', endDay: 20 },
      { name: 'Vegetative', endDay: 40 },
      { name: 'Branching / Bush Development', endDay: 70 },
      { name: 'Flower Bud Formation', endDay: 90 },
      { name: 'Flowering / Blooming', endDay: 110 },
      { name: 'Peak Flowering', endDay: 130 }
    ]
  },
  {
    id: 'paddy',
    names: ['paddy', 'rice'],
    maxGrowthDays: 135, // Updated per user request
    spacing: { row: 0.5, plant: 0.5 },
    stages: [
      { name: 'Seedling Stage', endDay: 15 },
      { name: 'Vegetative Stage', endDay: 35 },
      { name: 'Tillering', endDay: 70 },
      { name: 'Reproductive Stage', endDay: 100 },
      { name: 'Grain Filling', endDay: 120 },
      { name: 'Maturity', endDay: 135 }
    ]
  },
  {
    id: 'maize',
    names: ['maize', 'corn'],
    maxGrowthDays: 100,
    spacing: { row: 1.2, plant: 0.6 },
    stages: [
      { name: 'Seedling', endDay: 20 },
      { name: 'Vegetative Growth', endDay: 50 },
      { name: 'Tasseling / Silking', endDay: 75 },
      { name: 'Grain Filling', endDay: 90 },
      { name: 'Maturity', endDay: 100 }
    ]
  },
  {
    id: 'wheat',
    names: ['wheat'],
    maxGrowthDays: 120,
    spacing: { row: 0.5, plant: 0.5 },
    stages: [
      { name: 'Seedling', endDay: 20 },
      { name: 'Tillering', endDay: 50 },
      { name: 'Stem Extension', endDay: 80 },
      { name: 'Heading', endDay: 100 },
      { name: 'Maturity', endDay: 120 }
    ]
  },
  {
    id: 'tomato',
    names: ['tomato'],
    maxGrowthDays: 90,
    spacing: { row: 1.5, plant: 1.0 },
    stages: [
      { name: 'Seedling', endDay: 20 },
      { name: 'Vegetative', endDay: 45 },
      { name: 'Flowering', endDay: 65 },
      { name: 'Fruiting', endDay: 80 },
      { name: 'Maturity', endDay: 90 }
    ]
  },
  {
    id: 'carrot',
    names: ['carrot'],
    maxGrowthDays: 80,
    spacing: { row: 0.8, plant: 0.8 },
    stages: [
      { name: 'Germination', endDay: 15 },
      { name: 'Vegetative Foliage', endDay: 40 },
      { name: 'Root Expansion', endDay: 70 },
      { name: 'Maturity', endDay: 80 }
    ]
  },
  {
    id: 'cotton',
    names: ['cotton'],
    maxGrowthDays: 160,
    spacing: { row: 1.5, plant: 1.0 },
    stages: [
      { name: 'Seedling', endDay: 30 },
      { name: 'Vegetative', endDay: 70 },
      { name: 'Squaring (Buds)', endDay: 100 },
      { name: 'Flowering / Boll Formation', endDay: 140 },
      { name: 'Maturity (Boll Opening)', endDay: 160 }
    ]
  },
  {
    id: 'sugarcane',
    names: ['sugarcane'],
    maxGrowthDays: 365,
    spacing: { row: 1.5, plant: 0.8 },
    stages: [
      { name: 'Germination', endDay: 45 },
      { name: 'Tillering', endDay: 120 },
      { name: 'Grand Growth', endDay: 270 },
      { name: 'Maturity / Ripening', endDay: 365 }
    ]
  },
  {
    id: 'groundnut',
    names: ['groundnut', 'peanut'],
    maxGrowthDays: 120,
    spacing: { row: 0.8, plant: 0.8 },
    stages: [
      { name: 'Seedling', endDay: 20 },
      { name: 'Vegetative', endDay: 45 },
      { name: 'Flowering & Pegging', endDay: 80 },
      { name: 'Pod Development', endDay: 105 },
      { name: 'Maturity', endDay: 120 }
    ]
  },
  {
    id: 'turmeric',
    names: ['turmeric'],
    maxGrowthDays: 240,
    spacing: { row: 0.8, plant: 0.8 },
    stages: [
      { name: 'Sprouting', endDay: 40 },
      { name: 'Vegetative Growth', endDay: 120 },
      { name: 'Rhizome Initiation', endDay: 180 },
      { name: 'Rhizome Maturation', endDay: 240 }
    ]
  },
  {
    id: 'banana',
    names: ['banana'],
    maxGrowthDays: 300,
    spacing: { row: 2.5, plant: 2.5 },
    stages: [
      { name: 'Vegetative Growth', endDay: 150 },
      { name: 'Shooting (Flower Emergence)', endDay: 210 },
      { name: 'Fruit Development', endDay: 270 },
      { name: 'Maturity', endDay: 300 }
    ]
  },
  {
    id: 'onion',
    names: ['onion'],
    maxGrowthDays: 110,
    spacing: { row: 0.4, plant: 0.4 },
    stages: [
      { name: 'Seedling', endDay: 30 },
      { name: 'Vegetative', endDay: 60 },
      { name: 'Bulb Initiation', endDay: 85 },
      { name: 'Bulb Maturation', endDay: 110 }
    ]
  },
  {
    id: 'potato',
    names: ['potato'],
    maxGrowthDays: 100,
    spacing: { row: 0.8, plant: 0.8 },
    stages: [
      { name: 'Sprouting', endDay: 20 },
      { name: 'Vegetative Growth', endDay: 45 },
      { name: 'Tuber Initiation', endDay: 65 },
      { name: 'Tuber Bulking', endDay: 90 },
      { name: 'Maturation', endDay: 100 }
    ]
  },
  {
    id: 'arabian jasmine',
    names: ['arabian jasmine', 'arabian_jasmine', 'arabianjasmine'],
    maxGrowthDays: 130,
    spacing: { row: 1.0, plant: 1.0 },
    stages: [
      { name: 'Early Seedling', endDay: 20 },
      { name: 'Vegetative', endDay: 40 },
      { name: 'Branching / Bush Development', endDay: 70 },
      { name: 'Flower Bud Formation', endDay: 90 },
      { name: 'Flowering / Blooming', endDay: 110 },
      { name: 'Peak Flowering', endDay: 130 }
    ]
  },
  {
    id: 'crossandra',
    names: ['crossandra', 'firecracker flower'],
    maxGrowthDays: 150,
    spacing: { row: 0.6, plant: 0.6 },
    stages: [
      { name: 'Seedling', endDay: 30 },
      { name: 'Vegetative Growth', endDay: 60 },
      { name: 'Branching', endDay: 90 },
      { name: 'Bud Initiation', endDay: 110 },
      { name: 'Continuous Flowering', endDay: 150 }
    ]
  },
  {
    id: 'chrysanthemum',
    names: ['chrysanthemum', 'mums'],
    maxGrowthDays: 120,
    spacing: { row: 0.5, plant: 0.5 },
    stages: [
      { name: 'Rooting / Seedling', endDay: 20 },
      { name: 'Vegetative', endDay: 50 },
      { name: 'Pinching / Branching', endDay: 70 },
      { name: 'Bud Formation', endDay: 90 },
      { name: 'Flowering', endDay: 120 }
    ]
  }
];

export function getCropConfig(cropName: string): CropConfig {
  const name = (cropName || '').toLowerCase();
  for (const config of CROP_CONFIGS) {
    if (config.names.some(n => name.includes(n))) {
      return config;
    }
  }
  return {
    id: 'generic',
    names: ['generic'],
    maxGrowthDays: 120,
    spacing: { row: 1.0, plant: 1.0 },
    stages: [
      { name: 'Seedling', endDay: 30 },
      { name: 'Vegetative', endDay: 60 },
      { name: 'Maturity', endDay: 120 }
    ]
  };
}

export function getCropStageName(config: CropConfig, currentDay: number): string {
  if (currentDay >= config.maxGrowthDays) return 'Harvest Ready';
  for (const stage of config.stages) {
    if (currentDay <= stage.endDay) {
      return stage.name;
    }
  }
  return 'Harvest Ready';
}
