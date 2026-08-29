export interface Farm {
  id: number;
  user_id?: number;

  farmerName?: string;
  farmName: string;
  location: string;
  size: number;
  soilType: string;
  waterSource: string;
  currentCrop: string;
  plantingDate: string;

  created_at?: string;

  latestDisease?: string;
  diseaseConfidence?: number;
}
