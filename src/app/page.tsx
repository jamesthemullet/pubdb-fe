"use client"; // Needed for client-side hooks

import { useEffect, useState } from "react";
import styles from "./page.module.css";

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
    <div className={styles.page}>
      <main className={styles.main}>
        <h2>Pub DB</h2>
        {loading ? (
          <p>Loading pubs…</p>
        ) : (
          <ul>
            {pubs.map((pub) => (
              <li key={pub.id}>
                <strong>{pub.name}</strong> – {pub.city}
              </li>
            ))}
          </ul>
        )}
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
