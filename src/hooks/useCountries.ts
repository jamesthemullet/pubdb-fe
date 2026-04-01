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

export function useCountries() {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  useEffect(() => {
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
          setCountries(options);
        }
      } catch (err) {
        console.error("Error fetching countries", err);
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

  return { countries, countriesLoading };
}
