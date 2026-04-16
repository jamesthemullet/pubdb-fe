import { useEffect, useState } from "react";
import type { BeerType } from "@/types/pub";

export type { BeerType };

let beerTypesCache: BeerType[] | null = null;

export function clearBeerTypesCache() {
	beerTypesCache = null;
}

function normalizeBeerTypes(payload: unknown): BeerType[] {
	if (!payload) return [];
	if (Array.isArray(payload)) {
		return payload as BeerType[];
	}
	if (typeof payload === "object") {
		const record = payload as Record<string, unknown>;
		if (Array.isArray(record.data)) {
			return record.data as BeerType[];
		}
		if (Array.isArray(record.beerTypes)) {
			return record.beerTypes as BeerType[];
		}
	}
	return [];
}

export function useBeerTypes() {
	const [beerTypeOptions, setBeerTypeOptions] = useState<BeerType[]>(
		beerTypesCache ?? [],
	);
	const [beerTypesLoading, setBeerTypesLoading] = useState(
		beerTypesCache === null,
	);
	const [beerTypesError, setBeerTypesError] = useState<string | null>(null);

	useEffect(() => {
		if (beerTypesCache !== null) {
			setBeerTypeOptions(beerTypesCache);
			setBeerTypesLoading(false);
			return;
		}

		let ignore = false;

		async function fetchBeerTypes() {
			setBeerTypesLoading(true);
			setBeerTypesError(null);

			try {
				const res = await fetch("/api/beer-types");
				if (!res.ok) {
					throw new Error(`Failed to fetch beer types: ${res.status}`);
				}
				const payload = await res.json();
				const list = normalizeBeerTypes(payload);
				const sorted = list
					.filter((type) => type && (type.isActive ?? true))
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
		};
	}, []);

	return { beerTypeOptions, beerTypesLoading, beerTypesError };
}
