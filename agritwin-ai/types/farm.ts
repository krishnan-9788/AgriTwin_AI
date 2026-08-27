export interface Farm {
  id?: string | number;
  userId?: string | number;
  farmerName: string;
  farmName: string;
  location: string;
  size: number; // in acres
  soilType: string;
  waterSource: string;
  currentCrop: string;
  plantingDate: string; // ISO string or Date
  createdAt?: string;
  updatedAt?: string;
}
