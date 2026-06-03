"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useEffect, useMemo, useState } from "react";
import Dropdown from "@/app/components/dropdown/Dropdown";
import { PUB_AMENITY_FIELDS, type PubAmenityKey } from "@/constants/pubFormFields";
import { API_URL } from "@/lib/apiConfig";
import { isHttpErrorObject } from "@/lib/errors";
import type { Pub } from "@/types/pub";
import styles from "./page.module.css";

type SortOption = "name-asc" | "name-desc" | "newest" | "oldest";

const SORT_OPTIONS: SortOption[] = ["name-asc", "name-desc", "newest", "oldest"];

function isSortOption(value: string): value is SortOption {
  return (SORT_OPTIONS as string[]).includes(value);
}

type PubsApiResponse = { data: Pub[] };
type PubApiResponse = { data: Pub };
type ApiErrorResponse = { message?: string; error?: string };

const PAGE_SIZE = 50;

const VISIBLE_FILTER_COUNT = 6;

const AMENITY_ICONS: Partial<Record<PubAmenityKey, { svg: string; title: string }>> = {
  isIndependent: {
    title: "Independent",
    svg: '<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="8" cy="8" r="2.5" fill="currentColor"/>',
  },
  hasFood: {
    title: "Food",
    svg: '<path d="M6 3v4a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3M8 9v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  },
  hasBeerGarden: {
    title: "Beer garden",
    svg: '<path d="M8 13V9m0 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 13h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  },
  hasCaskAle: {
    title: "Cask ale",
    svg: '<rect x="5" y="3" width="6" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M5 7h6" stroke="currentColor" stroke-width="1.5"/>',
  },
  isBeerFocused: {
    title: "Beer-focused",
    svg: '<path d="M6 3h4l1 4H5L6 3z" stroke="currentColor" stroke-width="1.3" fill="none"/><rect x="5" y="7" width="6" height="5" rx="1" stroke="currentColor" stroke-width="1.3" fill="none"/>',
  },
  hasSundayRoast: {
    title: "Sunday roast",
    svg: '<circle cx="8" cy="9" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M3 9h10" stroke="currentColor" stroke-width="1.5"/>',
  },
};

const TABLE_AMENITY_KEYS = Object.keys(AMENITY_ICONS) as PubAmenityKey[];

const AmenityIconCell = memo(function AmenityIconCell({ pub }: { pub: Pub }) {
  const active = TABLE_AMENITY_KEYS.filter((k) => pub[k]);
  return (
    <div className={styles.amenityGrid}>
      {TABLE_AMENITY_KEYS.map((key) => {
        const icon = AMENITY_ICONS[key];
        if (!icon) return null;
        const isActive = Boolean(pub[key]);
        return (
          <span
            key={key}
            role="img"
            className={`${styles.amenityDot} ${isActive ? styles.amenityDotActive : ""}`}
            title={isActive ? icon.title : ""}
            aria-label={isActive ? icon.title : undefined}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted internal SVG icon data */}
              <g dangerouslySetInnerHTML={{ __html: icon.svg }} />
            </svg>
          </span>
        );
      })}
      {active.length === 0 && <span className={styles.amenityNone}>—</span>}
    </div>
  );
});

export default function Pubs() {
  const router = useRouter();
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [activeAmenities, setActiveAmenities] = useState<Set<PubAmenityKey>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [responseMs, setResponseMs] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredPubs = useMemo(() => {
    const sorted = [...pubs];
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
  }, [pubs, sortBy]);

  useEffect(() => {
    async function fetchPubs() {
      setLoading(true);
      setError(null);
      const t0 = Date.now();
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          page: String(page + 1),
        });
        if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
        for (const amenity of activeAmenities) {
          params.append(`amenities[${amenity}]`, "true");
        }
        const res = await fetch(`${API_URL}/pubs?${params}`);
        setResponseMs(Date.now() - t0);

        if (!res.ok) {
          const errorData = await res.json() as ApiErrorResponse;
          throw { response: res, data: errorData };
        }

        const data = await res.json() as PubsApiResponse;
        setPubs(data.data);
      } catch (err: unknown) {
        setResponseMs(null);
        if (isHttpErrorObject(err)) {
          setError(err.data.message || err.data.error || `HTTP error! status: ${err.response.status}`);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load pubs");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchPubs();
  }, [page, debouncedSearchTerm, activeAmenities]);

  const hasNextPage = pubs.length === PAGE_SIZE;
  const hasPrevPage = page > 0;

  function toggleAmenity(key: PubAmenityKey) {
    setPage(0);
    setActiveAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function clearAllFilters() {
    setPage(0);
    setSearchTerm("");
    setActiveAmenities(new Set());
    setSortBy("name-asc");
  }

  async function goToRandomPub() {
    setRandomLoading(true);
    try {
      const res = await fetch(`${API_URL}/pubs/random`);
      if (!res.ok) throw new Error("Failed to fetch random pub");
      const data = await res.json() as PubApiResponse;
      router.push(`/pubs/${data.data.id}`);
    } catch {
      setRandomLoading(false);
    }
  }
  const visibleFilters = showAllFilters
    ? PUB_AMENITY_FIELDS
    : PUB_AMENITY_FIELDS.slice(0, VISIBLE_FILTER_COUNT);
  const hiddenCount = PUB_AMENITY_FIELDS.length - VISIBLE_FILTER_COUNT;
  const hasActiveFilters = debouncedSearchTerm || activeAmenities.size > 0 || sortBy !== "name-asc";

  function pubLocation(pub: Pub): string {
    const area = pub.area || pub.borough || null;
    return area ? `${pub.city} · ${area}` : pub.city;
  }

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageTitle}>
            <h1 className={styles.heading}>All pubs</h1>
            <span className={styles.apiBadge}>
              <code>GET /v1/pubs</code>
            </span>
          </div>
          <p className={styles.pageDescription}>
            Browse the live database. Every result here is exactly what the public API returns —
            this view is a thin client over the same endpoint.
          </p>
        </div>
        <div className={styles.pageHeaderActions}>
          <button type="button" className={styles.btnOutline}>
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="2" y="2" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M5 2V1.5A1.5 1.5 0 0 1 6.5 0h4A1.5 1.5 0 0 1 12 1.5V11a1.5 1.5 0 0 1-1.5 1.5H10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            Copy as cURL
          </button>
          <Link href="/add-pub" className={styles.btnPrimary}>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add pub
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              className={styles.searchInput}
              type="search"
              aria-label="Search pubs"
              placeholder="Search by name, city, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.filterChips}>
            {visibleFilters.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleAmenity(key)}
                className={`${styles.chip} ${activeAmenities.has(key) ? styles.chipActive : ""}`}
                aria-pressed={activeAmenities.has(key)}
              >
                {label}
              </button>
            ))}
            {!showAllFilters && hiddenCount > 0 && (
              <button
                type="button"
                className={styles.chipMore}
                onClick={() => setShowAllFilters(true)}
              >
                + {hiddenCount} more
              </button>
            )}
            {showAllFilters && (
              <button
                type="button"
                className={styles.chipMore}
                onClick={() => setShowAllFilters(false)}
              >
                Show less
              </button>
            )}
          </div>

          <div className={styles.filterRight}>
            <Dropdown
              id="sort-select"
              value={sortBy}
              onChange={(e) => {
                const val = e.target.value;
                if (isSortOption(val)) setSortBy(val);
              }}
              fullWidth={false}
            >
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </Dropdown>

            <fieldset className={styles.viewToggle} aria-label="View mode">
              <button type="button" className={`${styles.viewBtn} ${styles.viewBtnActive}`} aria-pressed="true">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                  <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                  <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                  <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                </svg>
                Grid
              </button>
              <button type="button" className={styles.viewBtn} aria-pressed="false">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                List
              </button>
              <button type="button" className={styles.viewBtn} aria-pressed="false">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                  <path d="M7 1.5C7 1.5 4 4 4 7s3 5.5 3 5.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M7 1.5c0 0 3 2.5 3 5.5s-3 5.5-3 5.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M1.5 7h11" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                Map
              </button>
            </fieldset>
          </div>
        </div>

        {hasActiveFilters && (
          <div className={styles.activeFiltersMeta}>
            <button type="button" className={styles.clearFilters} onClick={clearAllFilters}>
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results metadata bar */}
      <div className={styles.resultsMeta}>
        <span className={styles.resultsCount}>
          {loading ? "…" : `${filteredPubs.length} / ${filteredPubs.length} pubs`}
        </span>
        <div className={styles.resultsRight}>
          {responseMs !== null && (
            <span className={styles.responseTime}>
              <span className={styles.responseDot} aria-hidden="true" />
              <code>{responseMs}ms response</code>
            </span>
          )}
          <span className={styles.pageInfo}>page {page + 1}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <output className={styles.stateMsg} aria-live="polite">
          Loading pubs…
        </output>
      ) : error ? (
        <div className={styles.stateMsg} role="alert">
          <span className={styles.errorText}>Error loading pubs: {error}</span>
          <button type="button" onClick={() => window.location.reload()}>Try again</button>
        </div>
      ) : filteredPubs.length === 0 ? (
        <div className={styles.stateMsg}>
          No pubs found{debouncedSearchTerm ? " matching your search" : ""}.
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thName}>NAME</th>
                <th className={styles.thLocation}>LOCATION</th>
                <th className={styles.thAmenities}>AMENITIES</th>
                <th className={styles.thArrow} aria-label="View" />
              </tr>
            </thead>
            <tbody>
              {filteredPubs.map((pub) => (
                <tr
                  key={pub.id}
                  className={styles.tableRow}
                  onClick={() => router.push(`/pubs/${pub.id}`)}
                >
                  <td className={styles.tdName}>
                    <Link href={`/pubs/${pub.id}`} className={styles.pubName}>{pub.name}</Link>
                    {(pub.isIndependent || pub.chainName) && (
                      <span className={styles.pubType}>
                        {pub.isIndependent ? "Independent" : pub.chainName}
                      </span>
                    )}
                  </td>
                  <td className={styles.tdLocation}>
                    <span className={styles.pubLocation}>{pubLocation(pub)}</span>
                  </td>
                  <td className={styles.tdAmenities}>
                    <AmenityIconCell pub={pub} />
                  </td>
                  <td className={styles.tdArrow}>
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrevPage}
            >
              ← Previous
            </button>
            <span className={styles.pageNum}>Page {page + 1}</span>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
