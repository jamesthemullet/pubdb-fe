'use client';

import { useEffect, useState } from "react";
import { buildAuthHeaders } from "@/lib/auth";
import type { BeerType } from "@/types/pub";

export type { BeerType };

let beerTypesCache: BeerType[] | null = null;

export function clearBeerTypesCache(): void {
	beerTypesCache = null;
}

function isBeerType(item: unknown): item is BeerType {
	if (typeof item !== "object" || item === null) return false;
	const obj = item as Record<string, unknown>;
	return typeof obj.id === "string" && typeof obj.name === "string";
}

function normalizeBeerTypes(payload: unknown): BeerType[] {
	if (!payload) return [];
	if (Array.isArray(payload)) {
		return payload.filter(isBeerType);
	}
	if (typeof payload === "object") {
		const record = payload as Record<string, unknown>;
		if (Array.isArray(record.data)) {
			return record.data.filter(isBeerType);
		}
		if (Array.isArray(record.beerTypes)) {
			return record.beerTypes.filter(isBeerType);
		}
	}
	return [];
}

export function useBeerTypes(): {
	beerTypeOptions: BeerType[];
	beerTypesLoading: boolean;
	beerTypesError: string | null;
} {
	const [beerTypeOptions, setBeerTypeOptions] = useState<BeerType[]>(
		beerTypesCache ?? [],
	);
	const [beerTypesLoading, setBeerTypesLoading] = useState(
		beerTypesCache === null,
	);
	const [beerTypesError, setBeerTypesError] = useState<string | null>(null);

	useEffect(() => {
		if (beerTypesCache !== null) {
			return;
		}

		let ignore = false;
		const controller = new AbortController();

		async function fetchBeerTypes(): Promise<void> {
			setBeerTypesLoading(true);
			setBeerTypesError(null);

			const token =
				typeof window !== "undefined"
					? localStorage.getItem("token")
					: null;

			try {
				const res = await fetch("/api/beer-types", {
					headers: buildAuthHeaders(token),
					signal: controller.signal,
				});
				if (!res.ok) {
					throw new Error(`Failed to fetch beer types: ${res.status}`);
				}
				const payload: unknown = await res.json();
				const list = normalizeBeerTypes(payload);
				const sorted = list
					.filter((type) => type.isActive ?? true)
					.sort((a, b) => a.name.localeCompare(b.name));

				beerTypesCache = sorted;

				if (!ignore) {
					setBeerTypeOptions(sorted);
				}
			} catch (err) {
				if (!ignore) {
					setBeerTypesError(
						err instanceof Error ? err.message : "Unable to load beer types.",
					);
				}
			} finally {
				if (!ignore) {
					setBeerTypesLoading(false);
				}
			}
		}

		fetchBeerTypes();
		return () => {
			ignore = true;
			controller.abort();
		};
	}, []);

	return { beerTypeOptions, beerTypesLoading, beerTypesError };
}
