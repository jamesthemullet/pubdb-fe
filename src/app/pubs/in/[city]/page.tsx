import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { buildCityPageMetadata } from "@/lib/cityPageMetadata";
import { findCityBySlug } from "@/lib/citySlug";
import { getServerApiUrl, getTestingApiKeyHeader } from "@/lib/serverApiUrl";
import type { Pub } from "@/types/pub";
import ApiPanel from "./components/ApiPanel";
import HelpImprovePanel from "./components/HelpImprovePanel";
import styles from "./page.module.css";

const PAGE_SIZE = 50;

function pubLocation(pub: Pub): string {
  const area = pub.area || pub.borough || null;
  return area ? `${pub.city} · ${area}` : pub.city;
}

async function fetchCities(): Promise<string[]> {
  try {
    const apiUrl = getServerApiUrl();
    const headers = getTestingApiKeyHeader();
    const res = await fetch(`${apiUrl}/api/v1/filters`, {
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const raw: unknown = await res.json().catch(() => null);
    const cities =
      raw && typeof raw === "object" && "data" in raw
        ? (raw as { data?: { cities?: unknown } }).data?.cities
        : undefined;
    return Array.isArray(cities)
      ? cities.filter((c): c is string => typeof c === "string")
      : [];
  } catch {
    return [];
  }
}

async function fetchPubsForCity(
  city: string
): Promise<{ pubs: Pub[]; total: number }> {
  try {
    const apiUrl = getServerApiUrl();
    const headers = getTestingApiKeyHeader();
    const params = new URLSearchParams({ city, limit: String(PAGE_SIZE) });
    const res = await fetch(`${apiUrl}/api/v1/pubs?${params}`, {
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { pubs: [], total: 0 };
    const raw: unknown = await res.json().catch(() => null);
    if (!raw || typeof raw !== "object") return { pubs: [], total: 0 };
    const data = "data" in raw ? (raw as { data: unknown }).data : null;
    const pagination =
      "pagination" in raw
        ? (raw as { pagination?: { total?: number } }).pagination
        : undefined;
    const pubs = Array.isArray(data) ? (data as Pub[]) : [];
    return { pubs, total: pagination?.total ?? pubs.length };
  } catch {
    return { pubs: [], total: 0 };
  }
}

async function resolveCity(slug: string): Promise<{
  city: string;
  pubs: Pub[];
  total: number;
} | null> {
  const cities = await fetchCities();
  const city = findCityBySlug(cities, slug);
  if (!city) return null;
  const { pubs, total } = await fetchPubsForCity(city);
  if (total === 0) return null;
  return { city, pubs, total };
}

type CityPageParams = { params: Promise<{ city: string }> };

export async function generateMetadata({
  params,
}: CityPageParams): Promise<Metadata> {
  const { city: slug } = await params;
  const resolved = await resolveCity(slug);
  if (!resolved) return { title: "City not found" };

  const { title, description } = buildCityPageMetadata(
    resolved.city,
    resolved.total
  );
  return {
    title,
    description,
    openGraph: { title: `${title} | Pub DB`, description },
    twitter: { card: "summary", title: `${title} | Pub DB`, description },
  };
}

export default async function CityPubsPage({
  params,
}: CityPageParams): Promise<ReactElement> {
  const { city: slug } = await params;
  const resolved = await resolveCity(slug);
  if (!resolved) notFound();

  const { city, pubs, total } = resolved;
  const pubWord = total === 1 ? "pub" : "pubs";

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/pubs" className={styles.breadcrumbLink}>
          Pubs
        </Link>
        <span className={styles.breadcrumbSep} aria-hidden="true">
          /
        </span>
        <span aria-current="page">{city}</span>
      </nav>

      <h1 className={styles.heading}>Pubs in {city}</h1>
      <p className={styles.intro}>
        {total} {pubWord} in {city} on Pub DB.
      </p>

      <div className={styles.grid}>
        {pubs.map((pub) => (
          <Link key={pub.id} href={`/pubs/${pub.id}`} className={styles.card}>
            <span className={styles.cardName}>{pub.name}</span>
            <span className={styles.cardLocation}>{pubLocation(pub)}</span>
          </Link>
        ))}
      </div>

      <HelpImprovePanel city={city} pubs={pubs} />
      <ApiPanel city={city} pubs={pubs} total={total} pageSize={PAGE_SIZE} />
    </div>
  );
}
