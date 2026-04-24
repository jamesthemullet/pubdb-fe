"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Input from "@/app/components/input/Input";
import Typography from "@/app/components/typography/typography";
import { API_URL } from "@/lib/apiConfig";
import { isHttpErrorObject } from "@/lib/errors";
import type { Pub } from "@/types/pub";
import styles from "./page.module.css";

const PAGE_SIZE = 50;

type SortOrder = "default" | "name_asc" | "name_desc";

type AmenityKey =
  | "isDogFriendly"
  | "hasBeerGarden"
  | "hasFood"
  | "isFamilyFriendly"
  | "hasCaskAle"
  | "hasLiveMusic"
  | "hasLiveSport"
  | "hasStepFreeAccess"
  | "hasAccessibleToilet"
  | "isIndependent";

const AMENITY_LABELS: Record<AmenityKey, string> = {
  isDogFriendly: "Dog friendly",
  hasBeerGarden: "Beer garden",
  hasFood: "Food served",
  isFamilyFriendly: "Family friendly",
  hasCaskAle: "Cask ale",
  hasLiveMusic: "Live music",
  hasLiveSport: "Live sport",
  hasStepFreeAccess: "Step-free access",
  hasAccessibleToilet: "Accessible toilet",
  isIndependent: "Independent",
};

const AMENITY_KEYS = Object.keys(AMENITY_LABELS) as AmenityKey[];

type AmenityFilters = Partial<Record<AmenityKey, boolean>>;

export default function Pubs() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [amenityFilters, setAmenityFilters] = useState<AmenityFilters>({});
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = AMENITY_KEYS.filter((k) => amenityFilters[k]).length;

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(0);
  }, [amenityFilters]);

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
        for (const key of AMENITY_KEYS) {
          if (amenityFilters[key]) {
            params.set(key, "true");
          }
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
  }, [page, debouncedSearchTerm, amenityFilters]);

  const sortedPubs = useMemo(() => {
    if (sortOrder === "default") return pubs;
    return [...pubs].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === "name_asc" ? cmp : -cmp;
    });
  }, [pubs, sortOrder]);

  const hasNextPage = pubs.length === PAGE_SIZE;
  const hasPrevPage = page > 0;
  const isFiltered = !!debouncedSearchTerm || activeFilterCount > 0;

  function toggleAmenity(key: AmenityKey) {
    setAmenityFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function clearFilters() {
    setAmenityFilters({});
    setSortOrder("default");
  }

  return (
    <>
      <Typography variant="headingMedium">Pub DB</Typography>

      <div className={styles.searchBar}>
        <Input
          type="text"
          aria-label="Search pubs"
          placeholder="Search pubs by name, city, country, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={styles.filterToggle}
          aria-expanded={showFilters}
          aria-controls="filter-panel"
        >
          Filters
          {activeFilterCount > 0 && (
            <span className={styles.filterBadge} aria-label={`${activeFilterCount} active`}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div id="filter-panel" className={styles.filterPanel}>
          <fieldset className={styles.filterFieldset}>
            <legend className={styles.filterLegend}>Amenities</legend>
            <div className={styles.filterGrid}>
              {AMENITY_KEYS.map((key) => (
                <label key={key} className={styles.filterLabel}>
                  <Input
                    type="checkbox"
                    checked={!!amenityFilters[key]}
                    onChange={() => toggleAmenity(key)}
                  />
                  {AMENITY_LABELS[key]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className={styles.filterActions}>
            <label className={styles.sortLabel} htmlFor="sort-select">
              Sort:
            </label>
            <select
              id="sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className={styles.sortSelect}
            >
              <option value="default">Default</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
            </select>
            {(activeFilterCount > 0 || sortOrder !== "default") && (
              <button
                type="button"
                onClick={clearFilters}
                className={styles.clearButton}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {isFiltered && !loading && sortedPubs.length > 0 && (
        <Typography>{`Showing ${sortedPubs.length} pub${sortedPubs.length === 1 ? "" : "s"}`}</Typography>
      )}

      {loading ? (
        <Typography>Loading pubs…</Typography>
      ) : error ? (
        <div role="alert">
          <Typography className={styles.errorText}>
            Error loading pubs: {error}
          </Typography>
          <button type="button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      ) : sortedPubs.length === 0 ? (
        <Typography>
          No pubs found
          {debouncedSearchTerm
            ? " matching your search"
            : activeFilterCount > 0
              ? " matching your filters"
              : " in the database"}
          .
        </Typography>
      ) : (
        <div>
          <Link href="/add-pub">
            <button type="button">Add Pub</button>
          </Link>
          <ul>
            {sortedPubs.map((pub) => (
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
