import type { Pub } from "@/types/pub";

const EARTH_RADIUS_KM = 6371;

function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export type NearbyPub = Pub & { distance: number };

export function getNearbyPubs(
  currentPub: Pub,
  pubs: Pub[],
  limit = 5
): NearbyPub[] {
  if (currentPub.lat == null || currentPub.lng == null) return [];
  const currentLat = currentPub.lat;
  const currentLng = currentPub.lng;

  return pubs
    .filter(
      (pub): pub is Pub & { lat: number; lng: number } =>
        pub.id !== currentPub.id && pub.lat != null && pub.lng != null
    )
    .map((pub) => ({
      ...pub,
      distance:
        Math.round(
          haversineDistanceKm(currentLat, currentLng, pub.lat, pub.lng) * 100
        ) / 100,
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}
