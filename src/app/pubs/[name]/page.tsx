"use client"; // Needed for client-side hooks

import { useParams } from "next/navigation";

import { useEffect, useState } from "react";

type Pub = {
  id: string;
  name: string;
  city: string;
  address: string;
  postcode: string;
  country: string;
  lat?: number;
  lng?: number;
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
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<Partial<Pub>>({});

  useEffect(() => {
    async function fetchPub() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiUrl}/pubs?name=${name}`);
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

  function handleEditClick() {
    if (pub) {
      setEditFields({ ...pub });
      setEditing(true);
    }
  }

  function handleFieldChange(field: keyof Pub, value: any) {
    setEditFields((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!pub) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");
      const body: any = {};
      Object.entries(editFields).forEach(([key, value]) => {
        if (
          key !== "id" &&
          key !== "createdAt" &&
          value !== undefined &&
          value !== null &&
          (Array.isArray(value) ? value.length > 0 : value !== "")
        ) {
          body[key] = value;
        }
      });
      const res = await fetch(`${apiUrl}/pubs/${pub.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || data.errors || "Unknown error");
      } else {
        setPub(data);
        setEditing(false);
      }
    } catch (err) {
      alert("Network error");
    }
  }

  return (
    <>
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
          <EditButton
            pubName={pub.name}
            onEdit={handleEditClick}
            pubId={pub.id}
          />
          {editing ? (
            <div style={{ marginTop: "1rem" }}>
              <label>
                Name:{" "}
                <input
                  value={editFields.name ?? ""}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  required
                />
              </label>
              <br />
              <label>
                City:{" "}
                <input
                  value={editFields.city ?? ""}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                  required
                />
              </label>
              <br />
              <label>
                Country:{" "}
                <input
                  value={editFields.country ?? ""}
                  onChange={(e) => handleFieldChange("country", e.target.value)}
                  required
                />
              </label>
              <br />
              <label>
                Address:{" "}
                <input
                  value={editFields.address ?? ""}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  required
                />
              </label>
              <br />
              <label>
                Postcode:{" "}
                <input
                  value={editFields.postcode ?? ""}
                  onChange={(e) =>
                    handleFieldChange("postcode", e.target.value)
                  }
                  required
                />
              </label>
              <br />
              <label>
                Area:{" "}
                <input
                  value={editFields.area ?? ""}
                  onChange={(e) => handleFieldChange("area", e.target.value)}
                />
              </label>
              <br />
              <label>
                Borough:{" "}
                <input
                  value={editFields.borough ?? ""}
                  onChange={(e) => handleFieldChange("borough", e.target.value)}
                />
              </label>
              <br />
              <label>
                Operator:{" "}
                <input
                  value={editFields.operator ?? ""}
                  onChange={(e) =>
                    handleFieldChange("operator", e.target.value)
                  }
                />
              </label>
              <br />
              <label>
                Phone:{" "}
                <input
                  value={editFields.phone ?? ""}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                />
              </label>
              <br />
              <label>
                Website:{" "}
                <input
                  value={editFields.website ?? ""}
                  onChange={(e) => handleFieldChange("website", e.target.value)}
                />
              </label>
              <br />
              <label>
                Description:{" "}
                <textarea
                  value={editFields.description ?? ""}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                />
              </label>
              <br />
              <label>
                Opening Hours:{" "}
                <input
                  value={editFields.openingHours ?? ""}
                  onChange={(e) =>
                    handleFieldChange("openingHours", e.target.value)
                  }
                />
              </label>
              <br />
              <label>
                Tags:{" "}
                <input
                  value={editFields.tags ? editFields.tags.join(", ") : ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((t: string) => t.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </label>
              <br />
              <label>
                Latitude:{" "}
                <input
                  type="number"
                  value={editFields.lat ?? ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "lat",
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value)
                    )
                  }
                />
              </label>
              <br />
              <label>
                Longitude:{" "}
                <input
                  type="number"
                  value={editFields.lng ?? ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "lng",
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value)
                    )
                  }
                />
              </label>
              <br />
              <button onClick={handleSave}>Save</button>
              <button
                onClick={() => setEditing(false)}
                style={{ marginLeft: "1rem" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <p>
                <strong>City:</strong> {pub.city}
              </p>
              <p>
                <strong>Country:</strong> {pub.country}
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
                  <a
                    href={pub.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
                <strong>Tags:</strong>{" "}
                {pub.tags.length ? pub.tags.join(", ") : "-"}
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
          )}
        </>
      ) : (
        <p>Pub not found</p>
      )}
    </>
  );
}

function EditButton({
  pubName,
  onEdit,
  pubId,
}: {
  pubName: string;
  onEdit: () => void;
  pubId: string;
}) {
  const [user, setUser] = useState<{
    email: string;
    approved?: boolean;
    admin?: boolean;
  } | null>(null);
  console.log(10, user);
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUser({
            email: payload.email,
            approved: payload.approved,
            admin: payload.admin,
          });
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    checkAuth();
    // Listen for auth changes
    window.addEventListener("authChanged", checkAuth);
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("authChanged", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  if (!user) {
    return (
      <div style={{ marginTop: "1rem" }}>
        <a href="/register">Log in to edit this pub</a>
      </div>
    );
  }
  if (!user.approved) {
    return (
      <div style={{ marginTop: "1rem" }}>
        <p>Your account is not approved for editing.</p>
        <p>
          Please email{" "}
          <a href="mailto:hello@thepubdb.com">hello@thepubdb.com</a> to request
          approval.
        </p>
      </div>
    );
  }

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete "${pubName}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/pubs/${pubId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete pub");
      } else {
        alert("Pub deleted successfully");
        window.location.href = "/pubs";
      }
    } catch (err) {
      alert("Network error");
    }
  }

  return (
    <div>
      <button onClick={onEdit}>Edit this pub</button>
      {user?.admin && <button onClick={handleDelete}>Delete this pub</button>}
    </div>
  );
}
