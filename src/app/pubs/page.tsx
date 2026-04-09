"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Input from "@/app/components/input/Input";
import { API_BASE_URL } from "@/lib/apiUrl";
import styles from "./page.module.css";

type Pub = {
  id: string;
  name: string;
  city: string;
  address: string;
  country: string;
};

export default function Pubs() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 100);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredPubs = useMemo(() => {
    if (!debouncedSearchTerm) return pubs;

    const searchLower = debouncedSearchTerm.toLowerCase();

    return pubs.filter(
      (pub) =>
        pub.name.toLowerCase().includes(searchLower) ||
        pub.city.toLowerCase().includes(searchLower) ||
        pub.address.toLowerCase().includes(searchLower)
    );
  }, [pubs, debouncedSearchTerm]);

  useEffect(() => {
    async function fetchPubs() {
      const apiUrl = API_BASE_URL;
      try {
        setError(null);
        const res = await fetch(`${apiUrl}/pubs?limit=10000`);

        if (!res.ok) {
          const errorData = await res.json();
          throw { response: res, data: errorData };
        }

        const data = await res.json();
        setPubs(data.data);
      } catch (error: unknown) {
        const err = error as {
          response?: Response;
          data?: { message?: string; error?: string };
          message?: string;
        };
        if (err.response && err.data) {
          setError(
            err.data.message ||
              err.data.error ||
              `HTTP error! status: ${err.response.status}`
          );
        } else {
          setError(
            error instanceof Error ? error.message : "Failed to load pubs"
          );
        }
      } finally {
        setLoading(false);
      }
    }

    fetchPubs();
  }, []);

  return (
    <>
      <h2>Pub DB</h2>

      <div>
        <Input
          type="text"
          placeholder="Search pubs by name, city, country, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {debouncedSearchTerm && (
          <p>
            Showing {filteredPubs.length} of {pubs.length} pubs
          </p>
        )}
      </div>

      {loading ? (
        <p>Loading pubs…</p>
      ) : error ? (
        <div>
          <p className={styles.errorText}>Error loading pubs: {error}</p>
          <button type="button" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      ) : !pubs || pubs.length === 0 ? (
        <p>No pubs found in the database.</p>
      ) : (
        <div>
          <Link href="/add-pub">
            <button type="button">Add Pub</button>
          </Link>
          {filteredPubs.length && (
            <ul>
              {filteredPubs.map((pub) => (
                <li key={pub.id}>
                  <Link href={`/pubs/${pub.id}`} prefetch={false}>
                    <strong>{pub.name}</strong>
                  </Link>{" "}
                  – {pub.city}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
