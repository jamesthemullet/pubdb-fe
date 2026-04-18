"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Input from "@/app/components/input/Input";
import Typography from "@/app/components/typography/typography";
import { API_URL } from "@/lib/apiConfig";
import type { Pub } from "@/types/pub";
import styles from "./page.module.css";

const PAGE_SIZE = 50;

export default function Pubs() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [total, setTotal] = useState<number | null>(null);
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
          offset: String(page * PAGE_SIZE),
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
        if (typeof data.total === "number") {
          setTotal(data.total);
        } else {
          setTotal(null);
        }
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
  }, [page, debouncedSearchTerm]);

  const hasNextPage = pubs.length === PAGE_SIZE;
  const hasPrevPage = page > 0;
  const start = page * PAGE_SIZE + 1;
  const end = page * PAGE_SIZE + pubs.length;

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
        {pubs.length > 0 && (
          <Typography>
            {total !== null
              ? `Showing ${start}–${end} of ${total} pubs`
              : `Showing ${start}–${end}`}
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
