"use client";

import { useEffect, useState } from "react";
import StandardLayout from "../StandardLayout";
import Link from "next/link";

type Pub = {
  id: string;
  name: string;
  city: string;
  address: string;
  tags: string[];
};

export default function Pubs() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPubs() {
      try {
        console.log(10, process.env.NEXT_PUBLIC_API_URL);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiUrl}/pubs`);
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
          <Link href="/add-pub">
            <button>Add Pub</button>
          </Link>
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
