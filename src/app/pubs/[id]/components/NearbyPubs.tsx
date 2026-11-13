"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getNearbyPubs, type NearbyPub } from "@/lib/nearbyPubs";
import type { Pub } from "@/types/pub";
import styles from "./NearbyPubs.module.css";

type Props = {
  pub: Pub;
};

type PubsApiResponse = { data: Pub[] };

export default function NearbyPubs({ pub }: Props): React.JSX.Element | null {
  const [nearby, setNearby] = useState<NearbyPub[]>([]);
  const { lat, lng } = pub;

  useEffect(() => {
    if (lat == null || lng == null) {
      setNearby([]);
      return;
    }

    let ignore = false;
    async function fetchNearby(): Promise<void> {
      try {
        const params = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          limit: "20",
        });
        const res = await fetch(`/api/pubs?${params}`);
        if (!res.ok) return;
        const data = (await res.json()) as PubsApiResponse;
        if (!ignore) setNearby(getNearbyPubs(pub, data.data ?? [], 5));
      } catch {
        if (!ignore) setNearby([]);
      }
    }
    fetchNearby();

    return () => {
      ignore = true;
    };
  }, [pub, lat, lng]);

  if (nearby.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Nearby pubs">
      <h2 className={styles.heading}>Nearby pubs</h2>
      <ul className={styles.list}>
        {nearby.map((nearbyPub) => (
          <li key={nearbyPub.id} className={styles.item}>
            <Link href={`/pubs/${nearbyPub.id}`} className={styles.link}>
              <span className={styles.name}>{nearbyPub.name}</span>
              <span className={styles.distance}>{nearbyPub.distance.toFixed(1)} km</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
