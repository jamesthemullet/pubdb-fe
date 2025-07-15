"use client"; // Needed for client-side hooks

import { useParams } from "next/navigation";
import StandardLayout from "../../StandardLayout";

import { useEffect, useState } from "react";

type Pub = {
  id: string;
  name: string;
  city: string;
  address: string;
  postcode: string;
  lat: number;
  lng: number;
  website?: string;
  description?: string;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  operator?: string;
  area?: string;
  phone?: string;
  borough?: string;
  openingHours?: string;
};

export default function PubPage() {
  const { name } = useParams();
  const [pub, setPub] = useState<Pub | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPub() {
      try {
        const res = await fetch(`http://localhost:4000/pubs?name=${name}`);
        const data = await res.json();
        setPub(data[0] || null);
      } catch (error) {
        console.error("Error fetching pub:", error);
        setPub(null);
      } finally {
        setLoading(false);
      }
    }
    if (name) fetchPub();
  }, [name]);

  return (
    <StandardLayout>
      {loading ? (
        <p>Loading pub details…</p>
      ) : pub ? (
        <>
          <h2>{pub.name}</h2>
          {pub.imageUrl && (
            <img
              src={pub.imageUrl}
              alt={pub.name}
              style={{ maxWidth: "400px", marginBottom: "1rem" }}
            />
          )}
          <p>
            <strong>City:</strong> {pub.city}
          </p>
          <p>
            <strong>Address:</strong> {pub.address}
          </p>
          <p>
            <strong>Postcode:</strong> {pub.postcode}
          </p>
          <p>
            <strong>Area:</strong> {pub.area || "-"}
          </p>
          <p>
            <strong>Borough:</strong> {pub.borough || "-"}
          </p>
          <p>
            <strong>Operator:</strong> {pub.operator || "-"}
          </p>
          <p>
            <strong>Phone:</strong> {pub.phone || "-"}
          </p>
          <p>
            <strong>Website:</strong>{" "}
            {pub.website ? (
              <a href={pub.website} target="_blank" rel="noopener noreferrer">
                {pub.website}
              </a>
            ) : (
              "-"
            )}
          </p>
          <p>
            <strong>Description:</strong> {pub.description || "-"}
          </p>
          <p>
            <strong>Opening Hours:</strong> {pub.openingHours || "-"}
          </p>
          <p>
            <strong>Tags:</strong> {pub.tags.length ? pub.tags.join(", ") : "-"}
          </p>
          <p>
            <strong>Latitude:</strong> {pub.lat}
          </p>
          <p>
            <strong>Longitude:</strong> {pub.lng}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {new Date(pub.createdAt).toLocaleString()}
          </p>
        </>
      ) : (
        <p>Pub not found.</p>
      )}
    </StandardLayout>
  );
}
