"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import Link from "next/link";
import type { ReactElement } from "react";
import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Pub } from "@/types/pub";
import styles from "./PubsMap.module.css";

const markerIcon = L.icon({
  iconUrl: iconUrl.src,
  iconRetinaUrl: iconRetinaUrl.src,
  shadowUrl: shadowUrl.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [51.5074, -0.1278];

type PubWithCoords = Pub & { lat: number; lng: number };

function hasCoords(pub: Pub): pub is PubWithCoords {
  return typeof pub.lat === "number" && typeof pub.lng === "number";
}

export default function PubsMap({ pubs }: { pubs: Pub[] }): ReactElement {
  const pinned = useMemo(() => pubs.filter(hasCoords), [pubs]);

  const center = useMemo((): [number, number] => {
    if (pinned.length === 0) return DEFAULT_CENTER;
    const [latSum, lngSum] = pinned.reduce(
      ([lat, lng], pub) => [lat + pub.lat, lng + pub.lng],
      [0, 0]
    );
    return [latSum / pinned.length, lngSum / pinned.length];
  }, [pinned]);

  return (
    <div className={styles.mapWrap}>
      <MapContainer
        key={pinned.length > 0 ? "with-pubs" : "empty"}
        center={center}
        zoom={pinned.length > 0 ? 11 : 6}
        scrollWheelZoom
        className={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pinned.map((pub) => (
          <Marker key={pub.id} position={[pub.lat, pub.lng]} icon={markerIcon}>
            <Popup>
              <div className={styles.popup}>
                <strong>{pub.name}</strong>
                <span>{pub.city}</span>
                <Link href={`/pubs/${pub.id}`}>View details</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
