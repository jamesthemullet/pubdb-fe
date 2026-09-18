"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Dropdown from "@/app/components/dropdown/Dropdown";
import {
  getPubTypeLabel,
  PUB_AMENITY_FIELDS,
  PUB_TYPE_OPTIONS,
  type PubAmenityKey,
} from "@/constants/pubFormFields";
import { useAuth } from "@/hooks/useAuth";
import { isHttpErrorObject } from "@/lib/errors";
import { pubCompletenessScore } from "@/lib/pubCompletenessScore";
import type { Pub, PubType } from "@/types/pub";
import styles from "./page.module.css";

type SortOption =
  | "name-asc"
  | "name-desc"
  | "newest"
  | "oldest"
  | "needs-attention";
type EditStatusFilter = "all" | "edited" | "not-edited";
type ViewMode = "list" | "grid";

function pubLocation(pub: Pub): string {
  const area = pub.area || pub.borough || null;
  return area ? `${pub.city} · ${area}` : pub.city;
}

const SORT_OPTIONS: SortOption[] = [
  "name-asc",
  "name-desc",
  "newest",
  "oldest",
  "needs-attention",
];

function isSortOption(value: string): value is SortOption {
  return SORT_OPTIONS.some((opt) => opt === value);
}

type PubsApiResponse = { data: Pub[] };
type ApiErrorResponse = { message?: string; error?: string };

const PAGE_SIZE = 50;

const VISIBLE_FILTER_COUNT = 6;

// Keyed by the full query string sent to /api/pubs. Lets a back-navigation to
// this page reuse the results it already fetched instead of calling the API
// again for filters/page the user just saw.
const PUBS_RESPONSE_CACHE = new Map<
  string,
  { data: Pub[]; responseMs: number }
>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const pubsCacheTimestamps = new Map<string, number>();

function getCachedPubsResponse(
  key: string
): { data: Pub[]; responseMs: number } | undefined {
  const timestamp = pubsCacheTimestamps.get(key);
  if (timestamp === undefined || Date.now() - timestamp > CACHE_TTL_MS) {
    return undefined;
  }
  return PUBS_RESPONSE_CACHE.get(key);
}

function setCachedPubsResponse(
  key: string,
  value: { data: Pub[]; responseMs: number }
): void {
  PUBS_RESPONSE_CACHE.set(key, value);
  pubsCacheTimestamps.set(key, Date.now());
}

/** Test-only: the cache is module-scoped, so specs must reset it between runs. */
export function __clearPubsResponseCacheForTests(): void {
  PUBS_RESPONSE_CACHE.clear();
  pubsCacheTimestamps.clear();
}

const PubRow = memo(function PubRow({
  pub,
  completenessScore,
}: {
  pub: Pub;
  completenessScore?: number;
}): ReactElement {
  return (
    <tr
      data-id={pub.id}
      className={styles.tableRow}
    >
      <td className={styles.tdName}>
        <Link href={`/pubs/${pub.id}`} className={styles.pubName}>
          {pub.name}
        </Link>
        {completenessScore !== undefined && (
          <span className={styles.completenessPill}>
            {completenessScore}% complete
          </span>
        )}
        {(pub.isIndependent || pub.chainName) && (
          <span className={styles.pubType}>
            {pub.isIndependent ? "Independent" : pub.chainName}
          </span>
        )}
        <span className={styles.pubType}>{getPubTypeLabel(pub.type)}</span>
      </td>
      <td className={styles.tdLocation}>
        <span className={styles.pubLocation}>{pubLocation(pub)}</span>
      </td>
      {pub.distance !== undefined && (
        <td className={styles.tdDistance}>
          <span className={styles.pubDistance}>{pub.distance.toFixed(1)} km</span>
        </td>
      )}
      {/* <td className={styles.tdAmenities}>
        <AmenityIconCell pub={pub} />
      </td> */}
      <td className={styles.tdArrow}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M4 8h8M9 5l3 3-3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </td>
    </tr>
  );
});

const CARD_AMENITY_COUNT = 3;

const PubCard = memo(function PubCard({
  pub,
  completenessScore,
}: {
  pub: Pub;
  completenessScore?: number;
}): ReactElement {
  const activeAmenities = PUB_AMENITY_FIELDS.filter(
    ({ key }) => pub[key]
  );
  const visible = activeAmenities.slice(0, CARD_AMENITY_COUNT);
  const remaining = activeAmenities.length - visible.length;
  const initials = pub.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <Link href={`/pubs/${pub.id}`} className={styles.pubCard} data-id={pub.id}>
      <div className={styles.cardImage}>
        {pub.imageUrl ? (
          <Image
            src={pub.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className={styles.cardImagePhoto}
          />
        ) : (
          <span className={styles.cardImageInitials}>{initials}</span>
        )}
        {(pub.area || pub.borough) && (
          <span className={styles.cardAreaTag}>{pub.area || pub.borough}</span>
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitleRow}>
          <span className={styles.cardName}>{pub.name}</span>
        </div>
        <span className={styles.cardLocation}>{pubLocation(pub)}</span>
        {completenessScore !== undefined && (
          <span className={styles.completenessPill}>
            {completenessScore}% complete
          </span>
        )}
        <div className={styles.cardBadges}>
          {visible.map(({ key, label }) => (
            <span key={key} className={styles.cardBadge}>
              {label}
            </span>
          ))}
          {remaining > 0 && (
            <span className={styles.cardBadge}>+{remaining}</span>
          )}
        </div>
      </div>
    </Link>
  );
});

function PubsContent(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const urlSort = searchParams.get("sort") ?? "";
  const urlAmenities = searchParams.get("amenities") ?? "";
  const urlType = searchParams.get("type") ?? "";
  const urlEdit = searchParams.get("edited") ?? "";
  const urlView = searchParams.get("view") ?? "";
  const urlPage = searchParams.get("page") ?? "";
  const urlLat = searchParams.get("lat") ?? "";
  const urlLng = searchParams.get("lng") ?? "";
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [page, setPage] = useState(() => {
    const parsed = Number.parseInt(urlPage, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed - 1 : 0;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(urlQuery);
  const [activeAmenities, setActiveAmenities] = useState<Set<PubAmenityKey>>(
    () => new Set(urlAmenities.split(",").filter(Boolean) as PubAmenityKey[])
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    isSortOption(urlSort) ? urlSort : "name-asc"
  );
  const [editStatusFilter, setEditStatusFilter] = useState<EditStatusFilter>(
    urlEdit === "edited" || urlEdit === "not-edited" ? urlEdit : "all"
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    urlView === "grid" ? "grid" : "list"
  );
  const [typeFilter, setTypeFilter] = useState<PubType | "">(
    (urlType as PubType | "") || ""
  );
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [responseMs, setResponseMs] = useState<number | null>(null);
  const [surpriseState, setSurpriseState] = useState<
    "idle" | "loading" | "not-found"
  >("idle");
  const getInitialCoords = () => {
    const lat = Number.parseFloat(urlLat);
    const lng = Number.parseFloat(urlLng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  };
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "granted" | "denied" | "unsupported"
  >(() => (getInitialCoords() ? "granted" : "idle"));
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    getInitialCoords
  );
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const buildFilterParams = useCallback((): URLSearchParams => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    for (const amenity of activeAmenities) {
      params.append(`amenities[${amenity}]`, "true");
    }
    if (typeFilter) params.set("type", typeFilter);
    return params;
  }, [debouncedSearchTerm, activeAmenities, typeFilter]);

  async function handleSurpriseMe(): Promise<void> {
    setSurpriseState("loading");
    try {
      const params = buildFilterParams();
      const res = await fetch(`/api/pubs/random?${params}`);

      if (res.status === 404) {
        setSurpriseState("not-found");
        return;
      }
      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        setError(
          errorData.message || errorData.error || "Failed to find a random pub"
        );
        setSurpriseState("idle");
        return;
      }

      const data = (await res.json()) as { data: Pub };
      router.push(`/pubs/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find a random pub");
      setSurpriseState("idle");
    }
  }

  function handleNearMe() {
    if (coords) {
      setCoords(null);
      setLocationStatus("idle");
      setPage(0);
      return;
    }
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("granted");
        setPage(0);
      },
      () => setLocationStatus("denied")
    );
  }

  useEffect(() => {
    if (!isLoggedIn && editStatusFilter !== "all") {
      setEditStatusFilter("all");
    }
  }, [isLoggedIn, editStatusFilter]);

  const isFirstQuerySync = useRef(true);
  useEffect(() => {
    if (isFirstQuerySync.current) {
      isFirstQuerySync.current = false;
      return;
    }
    setSearchTerm(urlQuery);
    setDebouncedSearchTerm(urlQuery);
    setPage(0);
  }, [urlQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredPubs = useMemo(() => {
    if (coords) return pubs;
    const sorted = [...pubs];
    switch (sortBy) {
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "newest":
      case "oldest": {
        const ts = new Map(pubs.map((p) => [p.id, Date.parse(p.createdAt ?? "")]));
        const dir = sortBy === "newest" ? -1 : 1;
        sorted.sort((a, b) => dir * ((ts.get(a.id) ?? 0) - (ts.get(b.id) ?? 0)));
        break;
      }
      case "needs-attention": {
        const scores = new Map(
          pubs.map((p) => [p.id, pubCompletenessScore(p).score])
        );
        sorted.sort(
          (a, b) => (scores.get(a.id) ?? 0) - (scores.get(b.id) ?? 0)
        );
        break;
      }
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [pubs, sortBy, coords]);

  const completenessScores = useMemo(
    () =>
      sortBy === "needs-attention"
        ? new Map(pubs.map((p) => [p.id, pubCompletenessScore(p).score]))
        : null,
    [pubs, sortBy]
  );

  useEffect(() => {
    async function fetchPubs() {
      setError(null);
      setSurpriseState("idle");

      const params = buildFilterParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("page", String(page + 1));
      if (editStatusFilter !== "all") {
        params.set("editedByMe", editStatusFilter === "edited" ? "true" : "false");
      }
      if (coords) {
        params.set("lat", String(coords.lat));
        params.set("lng", String(coords.lng));
      }
      const cacheKey = params.toString();
      const cached = getCachedPubsResponse(cacheKey);
      if (cached) {
        setPubs(cached.data);
        setResponseMs(cached.responseMs);
        setLoading(false);
        return;
      }

      setLoading(true);
      const t0 = Date.now();
      try {
        const res = await fetch(`/api/pubs?${params}`);
        const responseMs = Date.now() - t0;
        setResponseMs(responseMs);

        if (!res.ok) {
          const errorData = (await res.json()) as ApiErrorResponse;
          throw { response: res, data: errorData };
        }

        const data = (await res.json()) as PubsApiResponse;
        const pubsData = data.data ?? [];
        setPubs(pubsData);
        setCachedPubsResponse(cacheKey, { data: pubsData, responseMs });
      } catch (err: unknown) {
        setResponseMs(null);
        if (isHttpErrorObject(err)) {
          setError(
            err.data.message ||
              err.data.error ||
              `HTTP error! status: ${err.response.status}`
          );
        } else {
          setError(err instanceof Error ? err.message : "Failed to load pubs");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchPubs();
  }, [page, buildFilterParams, editStatusFilter, coords]);

  // Keep the URL in sync with the current filters so that navigating to a
  // pub's detail page and back restores this exact filtered/sorted view
  // instead of resetting to the defaults.
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set("q", debouncedSearchTerm);
    if (activeAmenities.size > 0) {
      params.set("amenities", Array.from(activeAmenities).join(","));
    }
    if (typeFilter) params.set("type", typeFilter);
    if (sortBy !== "name-asc") params.set("sort", sortBy);
    if (editStatusFilter !== "all") params.set("edited", editStatusFilter);
    if (viewMode !== "list") params.set("view", viewMode);
    if (page > 0) params.set("page", String(page + 1));
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }

    const query = params.toString();
    router.replace(query ? `/pubs?${query}` : "/pubs", { scroll: false });
  }, [
    router,
    debouncedSearchTerm,
    activeAmenities,
    typeFilter,
    sortBy,
    editStatusFilter,
    viewMode,
    page,
    coords,
  ]);

  const hasNextPage = pubs.length === PAGE_SIZE;
  const hasPrevPage = page > 0;

  function toggleAmenity(key: PubAmenityKey): void {
    setPage(0);
    setActiveAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function clearAllFilters(): void {
    setPage(0);
    setSearchTerm("");
    setActiveAmenities(new Set());
    setSortBy("name-asc");
    setEditStatusFilter("all");
    setTypeFilter("");
    setCoords(null);
    setLocationStatus("idle");
  }

  const visibleFilters = useMemo(
    () =>
      showAllFilters
        ? PUB_AMENITY_FIELDS
        : PUB_AMENITY_FIELDS.slice(0, VISIBLE_FILTER_COUNT),
    [showAllFilters]
  );
  const hiddenCount = PUB_AMENITY_FIELDS.length - VISIBLE_FILTER_COUNT;
  const hasActiveFilters =
    debouncedSearchTerm ||
    activeAmenities.size > 0 ||
    sortBy !== "name-asc" ||
    editStatusFilter !== "all" ||
    !!typeFilter ||
    !!coords;

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageTitle}>
            <h1 className={styles.heading}>All pubs</h1>
            <span className={styles.apiBadge}>
              <code>GET /pubs</code>
            </span>
          </div>
          <p className={styles.pageDescription}>
            Browse the live database. This view calls the same backend data
            as the public API, plus authenticated filters (like "Edited by
            me") that aren't part of the public contract.
          </p>
        </div>
        <div className={styles.pageHeaderActions}>
          <Link href="/add-pub" className={styles.btnPrimary}>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M6 1v10M1 6h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Add pub
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <svg
              className={styles.searchIcon}
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="6"
                cy="6"
                r="4.5"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M10 10l2.5 2.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
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

          <div className={styles.filterChips} id="filter-chips-list">
            {visibleFilters.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleAmenity(key)}
                className={`${styles.chip} ${
                  activeAmenities.has(key) ? styles.chipActive : ""
                }`}
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
                aria-expanded={false}
                aria-controls="filter-chips-list"
              >
                Show {hiddenCount} more filters
              </button>
            )}
            {showAllFilters && (
              <button
                type="button"
                className={styles.chipMore}
                onClick={() => setShowAllFilters(false)}
                aria-expanded={true}
                aria-controls="filter-chips-list"
              >
                Show less
              </button>
            )}
          </div>

          <div className={styles.filterRight}>
            <label htmlFor="type-select" className={styles.srOnly}>Filter by type</label>
            <Dropdown
              id="type-select"
              aria-label="Filter by type"
              value={typeFilter}
              onChange={(e) => {
                setPage(0);
                setTypeFilter(e.target.value as PubType | "");
              }}
              fullWidth={false}
            >
              <option value="">All types</option>
              {PUB_TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Dropdown>

            <label htmlFor="sort-select" className={styles.srOnly}>Sort by</label>
            <Dropdown
              id="sort-select"
              aria-label="Sort pubs"
              value={coords ? "distance" : sortBy}
              disabled={!!coords}
              onChange={(e) => {
                const val = e.target.value;
                if (isSortOption(val)) setSortBy(val);
              }}
              fullWidth={false}
            >
              {coords && <option value="distance">Distance (nearest)</option>}
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="needs-attention">Needs attention</option>
            </Dropdown>

            <fieldset className={styles.viewToggle} aria-label="View mode">
              <button
                type="button"
                className={`${styles.viewBtn} ${
                  viewMode === "grid" ? styles.viewBtnActive : ""
                }`}
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  aria-hidden="true"
                >
                  <rect
                    x="1"
                    y="1"
                    width="5"
                    height="5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    fill="none"
                  />
                  <rect
                    x="8"
                    y="1"
                    width="5"
                    height="5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    fill="none"
                  />
                  <rect
                    x="1"
                    y="8"
                    width="5"
                    height="5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    fill="none"
                  />
                  <rect
                    x="8"
                    y="8"
                    width="5"
                    height="5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    fill="none"
                  />
                </svg>
                Grid
              </button>
              <button
                type="button"
                className={`${styles.viewBtn} ${
                  viewMode === "list" ? styles.viewBtnActive : ""
                }`}
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  aria-hidden="true"
                >
                  <path
                    d="M1 3h12M1 7h12M1 11h12"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
                List
              </button>
            </fieldset>
          </div>
        </div>

        {hasActiveFilters && (
          <div className={styles.activeFiltersMeta}>
            <button
              type="button"
              className={styles.clearFilters}
              onClick={clearAllFilters}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Secondary actions bar */}
      <div className={styles.actionsBar}>
        <div className={styles.actionsBarLeft}>
          <button
            type="button"
            className={`${styles.btnOutline} ${coords ? styles.btnOutlineActive : ""}`}
            onClick={handleNearMe}
            disabled={locationStatus === "loading"}
            aria-pressed={!!coords}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <circle cx="6" cy="6" r="1.6" fill="currentColor" />
              <path
                d="M6 1v1.6M6 9.4V11M1 6h1.6M9.4 6H11"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            {locationStatus === "loading"
              ? "Locating…"
              : coords
                ? <>Near me <span aria-hidden="true">✕</span></>
                : "Near me"}
          </button>
          {locationStatus === "denied" && (
            <span className={styles.locationMessage}>
              Location permission denied
            </span>
          )}
          {locationStatus === "unsupported" && (
            <span className={styles.locationMessage}>
              Location isn&apos;t supported in this browser
            </span>
          )}

          <button
            type="button"
            className={styles.btnOutline}
            onClick={handleSurpriseMe}
            disabled={surpriseState === "loading"}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <rect
                x="1"
                y="1"
                width="10"
                height="10"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.3"
                fill="none"
              />
              <circle cx="4" cy="4" r="0.9" fill="currentColor" />
              <circle cx="8" cy="4" r="0.9" fill="currentColor" />
              <circle cx="6" cy="6" r="0.9" fill="currentColor" />
              <circle cx="4" cy="8" r="0.9" fill="currentColor" />
              <circle cx="8" cy="8" r="0.9" fill="currentColor" />
            </svg>
            {surpriseState === "loading" ? "Finding a pub…" : "Surprise me"}
          </button>
          {surpriseState === "not-found" && (
            <span className={styles.locationMessage}>
              No pub matches your current filters
            </span>
          )}
        </div>

        {isLoggedIn && (
          <div className={styles.actionsBarRight}>
            <span className={styles.showLabel}>Show:</span>
            <fieldset className={styles.segmentedControl} aria-label="Filter by edit status">
              {(
                [
                  { value: "all", label: "All" },
                  { value: "edited", label: "Edited" },
                  { value: "not-edited", label: "Not edited" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.segmentBtn} ${
                    editStatusFilter === value ? styles.segmentBtnActive : ""
                  }`}
                  aria-pressed={editStatusFilter === value}
                  onClick={() => {
                    setPage(0);
                    setEditStatusFilter(value);
                  }}
                >
                  {label}
                </button>
              ))}
            </fieldset>
          </div>
        )}
      </div>

      {/* Results metadata bar */}
      <div className={styles.resultsMeta}>
        {/* TODO: show real result count (current page / total) once API returns a total count field */}
        {/* <span className={styles.resultsCount}>
          {loading
            ? "…"
            : `${filteredPubs.length} / ${filteredPubs.length} pubs`}
        </span> */}
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
          <button type="button" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      ) : filteredPubs.length === 0 ? (
        <output className={styles.stateMsg} aria-live="polite">
          No pubs found{debouncedSearchTerm ? " matching your search" : ""}.
        </output>
      ) : viewMode === "grid" ? (
        <div className={styles.tableWrap}>
          <div className={styles.pubGrid}>
            {filteredPubs.map((pub) => (
              <PubCard
                key={pub.id}
                pub={pub}
                completenessScore={completenessScores?.get(pub.id)}
              />
            ))}
          </div>

          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrevPage}
            >
              <span aria-hidden="true">←</span> Previous
            </button>
            <span className={styles.pageNum}>Page {page + 1}</span>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage}
            >
              Next <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>Pub results</caption>
            <thead>
              <tr>
                <th className={styles.thName} scope="col">NAME</th>
                <th className={styles.thLocation} scope="col">LOCATION</th>
                {coords && (
                  <th className={styles.thDistance} scope="col">DISTANCE</th>
                )}
                {/* TODO: improve amenity display (icons unclear, title tooltip unreliable) before re-enabling */}
                {/* <th className={styles.thAmenities}>AMENITIES</th> */}
                <th className={styles.thArrow} scope="col" aria-label="View" />
              </tr>
            </thead>
            <tbody
              onClick={(e) => {
                const tr = (e.target as Element).closest("tr[data-id]");
                if (tr) router.push(`/pubs/${(tr as HTMLElement).dataset.id}`);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const tr = (e.target as Element).closest("tr[data-id]");
                  if (tr) {
                    e.preventDefault();
                    router.push(`/pubs/${(tr as HTMLElement).dataset.id}`);
                  }
                }
              }}
            >
              {filteredPubs.map((pub) => (
                <PubRow
                  key={pub.id}
                  pub={pub}
                  completenessScore={completenessScores?.get(pub.id)}
                />
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
              <span aria-hidden="true">←</span> Previous
            </button>
            <span className={styles.pageNum}>Page {page + 1}</span>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage}
            >
              Next <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Pubs(): ReactElement {
  return (
    <Suspense>
      <PubsContent />
    </Suspense>
  );
}
