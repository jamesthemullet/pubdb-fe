"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Typography from "@/app/components/typography/typography";
import type { Pub } from "@/types/pub";

export default function Pubs() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPubs() {
      try {
        const res = await fetch("/api/pubs");
        const raw: unknown = await res.json();
        setPubs(Array.isArray(raw) ? (raw as Pub[]) : []);
      } catch (_error) {
      } finally {
        setLoading(false);
      }
    }

    fetchPubs();
  }, []);

  return (
    <>
      <Typography variant="headingMedium">Pub DB</Typography>
      {loading ? (
        <Typography>Loading pubs…</Typography>
      ) : (
        <ul>
          {pubs.map((pub) => (
            <li key={pub.id}>
              <Link href={`/pubs/${pub.id}`}>
                <strong>{pub.name}</strong>
              </Link>{" "}
              – {pub.city}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
