"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type Pub = {
  id: string;
  name: string;
  city: string;
  address: string;
  country: string;
  tags: string[];
};

export default function Pubs() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 100);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredPubs = useMemo(() => {
    if (!debouncedSearchTerm) return pubs;

    const searchLower = debouncedSearchTerm.toLowerCase();

    return pubs.filter(
      (pub) =>
        pub.name.toLowerCase().includes(searchLower) ||
        pub.city.toLowerCase().includes(searchLower) ||
        pub.address.toLowerCase().includes(searchLower) ||
        pub.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  }, [pubs, debouncedSearchTerm]);

  useEffect(() => {
    async function fetchPubs() {
      try {
        setError(null);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(
          `${apiUrl}/api/v1/pubs?api_key=${process.env.NEXT_PUBLIC_TESTING_API_KEY}`
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw { response: res, data: errorData };
        }

        const data = await res.json();
        console.log(298, data.data);
        setPubs(data.data);
      } catch (error: any) {
        console.error("Error fetching pubs:", error);

        if (error.response && error.data) {
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
  }, []);

  return (
    <>
      <h2>Pub DB</h2>

      <div>
        <input
          type="text"
          placeholder="Search pubs by name, city, country, address, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {debouncedSearchTerm && (
          <p>
            Showing {filteredPubs.length} of {pubs.length} pubs
          </p>
        )}
      </div>

      {loading ? (
        <p>Loading pubs…</p>
      ) : error ? (
        <div>
          <p style={{ color: "red" }}>Error loading pubs: {error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      ) : pubs.length === 0 ? (
        <p>No pubs found in the database.</p>
      ) : (
        <div>
          <Link href="/add-pub">
            <button>Add Pub</button>
          </Link>
          {filteredPubs.length && (
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
          )}
        </div>
      )}
    </>
  );
}
