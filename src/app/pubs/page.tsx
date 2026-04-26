"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Input from "@/app/components/input/Input";
import Typography from "@/app/components/typography/typography";
import { API_URL } from "@/lib/apiConfig";
import { isHttpErrorObject } from "@/lib/errors";
import type { Pub } from "@/types/pub";
import styles from "./page.module.css";

const PAGE_SIZE = 50;

export default function Pubs() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    async function fetchPubs() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          page: String(page + 1),
        });
        if (debouncedSearchTerm) {
          params.set("search", debouncedSearchTerm);
        }
        const res = await fetch(`${API_URL}/pubs?${params}`);

        if (!res.ok) {
          const errorData = await res.json();
          throw { response: res, data: errorData };
        }

        const data = await res.json();
        setPubs(data.data);
      } catch (error: unknown) {
        if (isHttpErrorObject(error)) {
          setError(
            error.data.message ||
              error.data.error ||
              `HTTP error! status: ${error.response.status}`
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
  }, [page, debouncedSearchTerm]);

  const hasNextPage = pubs.length === PAGE_SIZE;
  const hasPrevPage = page > 0;

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
        {debouncedSearchTerm && pubs.length > 0 && (
          <Typography>{`Showing ${pubs.length} pubs`}</Typography>
        )}
      </div>

      {loading ? (
        <Typography role="status" aria-live="polite">Loading pubs…</Typography>
      ) : error ? (
        <div role="alert">
          <Typography className={styles.errorText}>
            Error loading pubs: {error}
          </Typography>
          <button type="button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      ) : pubs.length === 0 ? (
        <Typography>
          No pubs found
          {debouncedSearchTerm ? " matching your search" : " in the database"}.
        </Typography>
      ) : (
        <div>
          <Link href="/add-pub">
            <button type="button">Add Pub</button>
          </Link>
          <ul>
            {pubs.map((pub) => (
              <li key={pub.id}>
                <Link href={`/pubs/${pub.id}`} prefetch={false}>
                  <strong>{pub.name}</strong>
                </Link>{" "}
                – {pub.city}
              </li>
            ))}
          </ul>
          <div>
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrevPage}
            >
              Previous
            </button>
            <span>Page {page + 1}</span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
