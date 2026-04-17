"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Button from "@/app/components/button/button";
import Dropdown from "@/app/components/dropdown/Dropdown";
import Input from "@/app/components/input/Input";
import Typography from "@/app/components/typography/typography";
import { PUB_AMENITY_FIELDS, type PubAmenityKey } from "@/constants/pubFormFields";
import { API_URL } from "@/lib/apiConfig";
import type { Pub } from "@/types/pub";
import styles from "./page.module.css";

type SortOption = "name-asc" | "name-desc" | "newest" | "oldest";

export default function Pubs() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [activeAmenities, setActiveAmenities] = useState<Set<PubAmenityKey>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 100);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredPubs = useMemo(() => {
    let result = pubs;

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      result = result.filter(
        (pub) =>
          pub.name.toLowerCase().includes(searchLower) ||
          pub.city.toLowerCase().includes(searchLower) ||
          pub.address.toLowerCase().includes(searchLower)
      );
    }

    if (activeAmenities.size > 0) {
      result = result.filter((pub) =>
        [...activeAmenities].every((amenity) => pub[amenity] === true)
      );
    }

    const sorted = [...result];
    switch (sortBy) {
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  }, [pubs, debouncedSearchTerm, activeAmenities, sortBy]);

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

  function toggleAmenity(key: PubAmenityKey) {
    setActiveAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function clearAllFilters() {
    setSearchTerm("");
    setActiveAmenities(new Set());
    setSortBy("name-asc");
  }

  const isFiltered = debouncedSearchTerm || activeAmenities.size > 0;
  const hasActiveFilters = isFiltered || sortBy !== "name-asc";

  return (
    <>
      <Typography variant="headingMedium">Pub DB</Typography>

      <div className={styles.controls}>
        <div className={styles.searchRow}>
          <Input
            type="text"
            placeholder="Search pubs by name, city, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={styles.sortRow}>
            <label htmlFor="sort-select" className={styles.sortLabel}>
              Sort by
            </label>
            <Dropdown
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              fullWidth={false}
            >
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </Dropdown>
          </div>
        </div>

        <fieldset className={styles.filters}>
          <legend className={styles.filtersLegend}>Filter by amenity</legend>
          <div className={styles.filterGrid}>
            {PUB_AMENITY_FIELDS.map(({ key, label }) => (
              <label key={key} className={styles.filterLabel}>
                <Input
                  type="checkbox"
                  checked={activeAmenities.has(key)}
                  onChange={() => toggleAmenity(key)}
                  fullWidth={false}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {hasActiveFilters && (
          <div className={styles.filterMeta}>
            {isFiltered && (
              <Typography>
                Showing {filteredPubs.length} of {pubs.length} pubs
              </Typography>
            )}
            <Button variant="secondary" size="sm" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <Typography>Loading pubs…</Typography>
      ) : error ? (
        <div>
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
          {filteredPubs.length > 0 ? (
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
          ) : (
            <Typography>No pubs match your current filters.</Typography>
          )}
        </div>
      )}
    </>
  );
}
