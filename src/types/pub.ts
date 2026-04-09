export type OpeningHoursEntry = {
  open?: string;
  close?: string;
  closed?: boolean;
};

export type OpeningHoursMap = Record<string, OpeningHoursEntry>;

export type SunExposure = "FULL_SUN" | "PARTIAL_SUN" | "SHADED";

export type BeerType = {
  id: string;
  name: string;
  description?: string | null;
  colour?: string | null;
  isSystem?: boolean;
  isActive?: boolean;
};

export type PubBeerType = {
  beerTypeId: string;
  beerType?: BeerType | null;
};

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
  chainName?: string;
  isIndependent?: boolean;
  hasFood?: boolean;
  hasSundayRoast?: boolean;
  hasBeerGarden?: boolean;
  hasCaskAle?: boolean;
  isBeerFocused?: boolean;
  isDogFriendly?: boolean;
  isFamilyFriendly?: boolean;
  hasStepFreeAccess?: boolean;
  hasAccessibleToilet?: boolean;
  hasLiveSport?: boolean;
  hasLiveMusic?: boolean;
  createdAt: string;
  operator?: string;
  area?: string;
  phone?: string;
  borough?: string;
  openingHours?: OpeningHoursMap;
  beerGardens?: BeerGarden[];
  beerTypes?: Array<BeerType | PubBeerType>;
  beerTypeIds?: string[];
  beerType?: BeerType | string | null;
};
