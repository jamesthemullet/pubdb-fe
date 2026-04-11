import { useEffect, useState } from "react";

export type CountryOption = {
  name: string;
  code: string;
};

type RestCountryResponse = {
  name: {
    common: string;
  };
  cca2: string;
};

// Module-level cache: countries are static data that never change within a session.
// Populated on first successful fetch; subsequent hook mounts return instantly.
let countriesCache: CountryOption[] | null = null;

/** Reset the module-level cache. Exposed for testing only. */
export function clearCountriesCache(): void {
  countriesCache = null;
}

export function useCountries() {
  const [countries, setCountries] = useState<CountryOption[]>(
    countriesCache ?? []
  );
  const [countriesLoading, setCountriesLoading] = useState(
    countriesCache === null
  );
  const [countriesError, setCountriesError] = useState<string | null>(null);

  useEffect(() => {
    if (countriesCache !== null) {
      setCountries(countriesCache);
      setCountriesLoading(false);
      return;
    }

    let ignore = false;

    async function fetchCountries() {
      setCountriesLoading(true);
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2"
        );
        if (!res.ok) {
          throw new Error(`Failed to fetch countries: ${res.status}`);
        }

        const data: RestCountryResponse[] = await res.json();
        if (!ignore) {
          const options = data
            .map((country) => ({
              name: country.name.common,
              code: country.cca2,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
          countriesCache = options;
          setCountries(options);
        }
      } catch (err) {
        if (!ignore) {
          setCountriesError(
            err instanceof Error ? err.message : "Failed to load countries"
          );
        }
      } finally {
        if (!ignore) {
          setCountriesLoading(false);
        }
      }
    }

    fetchCountries();

    return () => {
      ignore = true;
    };
  }, []);

  return { countries, countriesLoading, countriesError };
}
