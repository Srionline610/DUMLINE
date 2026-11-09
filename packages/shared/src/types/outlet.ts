export interface OutletSummary {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  minPrepMinutes: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOutletInput {
  name: string;
  slug?: string;
  address: string;
  city?: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm?: number;
  minPrepMinutes?: number;
  isActive?: boolean;
}

export interface UpdateOutletInput {
  name?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  deliveryRadiusKm?: number;
  minPrepMinutes?: number;
  isActive?: boolean;
}

