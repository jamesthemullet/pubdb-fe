export type OpeningHoursEntry = {
  open?: string;
  close?: string;
  closed?: boolean;
};

export type OpeningHoursMap = Record<string, OpeningHoursEntry>;

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
};
