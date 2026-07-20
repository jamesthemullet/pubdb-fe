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

type PubBeerType = {
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
  isIndependent?: boolean | null;
  hasFood?: boolean | null;
  hasSundayRoast?: boolean | null;
  hasBeerGarden?: boolean | null;
  hasCaskAle?: boolean | null;
  isBeerFocused?: boolean | null;
  isDogFriendly?: boolean | null;
  isFamilyFriendly?: boolean | null;
  hasStepFreeAccess?: boolean | null;
  hasAccessibleToilet?: boolean | null;
  hasLiveSport?: boolean | null;
  hasLiveMusic?: boolean | null;
  hasPoolTable?: boolean | null;
  hasDartsBoard?: boolean | null;
  closedDown?: boolean | null;
  createdAt: string;
  updatedAt?: string;
  operator?: string;
  area?: string;
  phone?: string;
  borough?: string;
  openingHours?: OpeningHoursMap;
  beerGardens?: BeerGarden[];
  beerTypes?: Array<BeerType | PubBeerType>;
  beerTypeIds?: string[];
  beerType?: BeerType | string | null;
  distance?: number;
};
