export type OpeningHoursEntry = {
  open?: string;
  close?: string;
  closed?: boolean;
};

export type OpeningHoursMap = Record<string, OpeningHoursEntry>;

export type SunExposure = "FULL_SUN" | "PARTIAL_SUN" | "SHADED";

export type BeerGarden = {
  id?: string;
  pubId?: string;
  name: string;
  description?: string;
  seatingCapacity?: number;
  sunExposure?: SunExposure;
  isCovered?: boolean;
  isHeated?: boolean;
  isFamilyFriendly?: boolean;
  petFriendly?: boolean;
  openingHours?: OpeningHoursMap;
  imageUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Pub = {
  id: string;
  name: string;
  city: string;
  address: string;
  postcode: string;
  country: string;
  lat?: number;
  lng?: number;
  website?: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  operator?: string;
  area?: string;
  phone?: string;
  borough?: string;
  openingHours?: OpeningHoursMap;
  beerGardens?: BeerGarden[];
};
