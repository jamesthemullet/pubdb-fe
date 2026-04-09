"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Pub = {
  id: string;
  name: string;
  city: string;
  address: string;
};

export default function Pubs() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPubs() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiUrl}/pubs?`);
        const data = await res.json();
        setPubs(data);
      } catch (_error) {
      } finally {
        setLoading(false);
      }
    }

    fetchPubs();
  }, []);

  return (
    <>
      <h2>Pub DB</h2>
      {loading ? (
        <p>Loading pubs…</p>
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
