"use client";

import { useEffect, useState } from "react";
import StandardLayout from "./StandardLayout";
import Link from "next/link";

type Pub = {
  id: string;
  name: string;
  city: string;
  address: string;
  tags: string[];
};

export default function Home() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPubs() {
      try {
        const res = await fetch("http://localhost:4000/pubs");
        const data = await res.json();
        setPubs(data);
      } catch (error) {
        console.error("Error fetching pubs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPubs();
  }, []);

  return (
    <StandardLayout>
      <h2>Pub DB</h2>
      {loading ? (
        <p>Loading pubs…</p>
      ) : (
        <ul>
          {pubs.map((pub) => (
            <li key={pub.id}>
              <Link href={`/pubs/${pub.name}`}>
                <strong>{pub.name}</strong>
              </Link>{" "}
              – {pub.city}
            </li>
          ))}
        </ul>
      )}
    </StandardLayout>
  );
}
