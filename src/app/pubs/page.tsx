"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Input from "@/app/components/input/Input";
import Typography from "@/app/components/typography/typography";
import { API_URL } from "@/lib/apiConfig";
import type { Pub } from "@/types/pub";
import styles from "./page.module.css";

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
      const apiUrl = API_URL;
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
      <Typography variant="headingMedium">Pub DB</Typography>

      <div>
        <Input
          type="text"
          aria-label="Search pubs"
          placeholder="Search pubs by name, city, country, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {debouncedSearchTerm && (
          <Typography>
            Showing {filteredPubs.length} of {pubs.length} pubs
          </Typography>
        )}
      </div>

      {loading ? (
        <Typography>Loading pubs…</Typography>
      ) : error ? (
        <div role="alert">
          <Typography className={styles.errorText}>Error loading pubs: {error}</Typography>
          <button type="button" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      ) : !pubs || pubs.length === 0 ? (
        <Typography>No pubs found in the database.</Typography>
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
