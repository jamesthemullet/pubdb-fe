"use client"; // Needed for client-side hooks

import { useParams } from "next/navigation";

import { useEffect, useState } from "react";
import OpeningHoursEditor from "../../components/OpeningHoursEditor";

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
  openingHours?: Record<
    string,
    { open?: string; close?: string; closed?: boolean }
  >;
};

export default function PubPage() {
  const { id } = useParams();
  const [pub, setPub] = useState<Pub | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<Partial<Pub>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchPub() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

        const resById = await fetch(`${apiUrl}/pubs/${id}`);
        if (resById.ok) {
          const dataById = await resById.json();
          setPub(dataById || null);
        } else {
          setPub(null);
        }
      } catch (error) {
        console.error("Error fetching pub:", error);
        setPub(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchPub();
  }, [id]);

  function handleEditClick() {
    if (pub) {
      setEditFields({ ...pub });
      // Initialize errors for required fields
      const requiredFields: (keyof Pub)[] = [
        "name",
        "city",
        "address",
        "postcode",
        "country",
      ];
      const initialErrors: Record<string, string> = {};
      requiredFields.forEach((field) => {
        const value = pub[field];
        initialErrors[`${field}Error`] =
          !value || value.toString().trim() === ""
            ? `${field} is required`
            : "";
      });
      setFieldErrors(initialErrors);
      setEditing(true);
    }
  }

  function handleFieldChange(field: keyof Pub, value: any) {
    setEditFields((prev) => ({ ...prev, [field]: value }));
    if (["name", "city", "address", "postcode", "country"].includes(field)) {
      setFieldErrors((prev) => ({
        ...prev,
        [`${field}Error`]:
          !value || value.trim() === "" ? `${field} is required` : "",
      }));
    }
  }

  async function handleSave() {
    if (!pub) return;

    const requiredFields: (keyof Pub)[] = [
      "name",
      "city",
      "address",
      "postcode",
      "country",
    ];
    const missingFields = requiredFields.filter(
      (field) =>
        !editFields[field] || editFields[field]?.toString().trim() === ""
    );

    // Set errors for missing fields
    if (missingFields.length > 0) {
      const newErrors: Record<string, string> = { ...fieldErrors };
      missingFields.forEach((field) => {
        newErrors[`${field}Error`] = `${field} is required`;
      });
      setFieldErrors(newErrors);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");
      const body: any = {};
      Object.entries(editFields).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          (Array.isArray(value) ? value.length > 0 : value !== "")
        ) {
          body[key] = value;
        }
      });

      body.id = pub.id;
      if (pub.tags) {
        body.tags = pub.tags;
      }
      if (pub.createdAt) {
        body.createdAt = pub.createdAt;
      }

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
                {fieldErrors.nameError && (
                  <span style={{ color: "red", marginLeft: "0.5rem" }}>
                    {fieldErrors.nameError}
                  </span>
                )}
              </label>
              <br />
              <label>
                City:{" "}
                <input
                  value={editFields.city ?? ""}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                  required
                />
                {fieldErrors.cityError && (
                  <span style={{ color: "red", marginLeft: "0.5rem" }}>
                    {fieldErrors.cityError}
                  </span>
                )}
              </label>
              <br />
              <label>
                Country:{" "}
                <input
                  value={editFields.country ?? ""}
                  onChange={(e) => handleFieldChange("country", e.target.value)}
                  required
                />
                {fieldErrors.countryError && (
                  <span style={{ color: "red", marginLeft: "0.5rem" }}>
                    {fieldErrors.countryError}
                  </span>
                )}
              </label>
              <br />
              <label>
                Address:{" "}
                <input
                  value={editFields.address ?? ""}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  required
                />
                {fieldErrors.addressError && (
                  <span style={{ color: "red", marginLeft: "0.5rem" }}>
                    {fieldErrors.addressError}
                  </span>
                )}
              </label>
              <br />
              <label>
                Postcode:{" "}
                <input
                  value={editFields.postcode ?? ""}
                  onChange={(e) =>
                    handleFieldChange("postcode", e.target.value)
                  }
                />
                {fieldErrors.postcodeError && (
                  <span style={{ color: "red", marginLeft: "0.5rem" }}>
                    {fieldErrors.postcodeError}
                  </span>
                )}
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
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\+?[0-9\-\s]*$/.test(value) || value === "") {
                      handleFieldChange("phone", value);
                    } else {
                      setEditFields((prev) => ({
                        ...prev,
                        phoneError:
                          "Invalid phone number format. Only numbers, spaces, and dashes are allowed.",
                      }));
                    }
                  }}
                />
                {editFields.phoneError && (
                  <span style={{ color: "red" }}>{editFields.phoneError}</span>
                )}
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
                <OpeningHoursEditor
                  value={editFields.openingHours}
                  onChange={(val) => handleFieldChange("openingHours", val)}
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
              <button
                onClick={handleSave}
                disabled={
                  Object.values(fieldErrors).some((err) => !!err) ||
                  ["name", "city", "address", "postcode", "country"].some(
                    (field) =>
                      !editFields[field as keyof Pub] ||
                      editFields[field as keyof Pub]?.toString().trim() === ""
                  )
                }
              >
                Save
              </button>
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
                <strong>Opening Hours:</strong>
                {pub.openingHours ? (
                  <div style={{ marginTop: "0.5rem" }}>
                    {renderOpeningHours(pub.openingHours)}
                  </div>
                ) : (
                  " -"
                )}
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

function renderOpeningHours(ohAny: any) {
  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  let oh: Record<
    string,
    { open?: string; close?: string; closed?: boolean }
  > | null = null;
  if (typeof ohAny === "string") {
    try {
      oh = JSON.parse(ohAny);
    } catch (e) {
      console.warn("Invalid openingHours JSON:", e, ohAny);
      oh = null;
    }
  } else if (ohAny && typeof ohAny === "object") {
    oh = ohAny;
  }

  if (!oh) {
    return (
      <div>
        {weekdays.map((day) => (
          <div key={day}>
            <strong>{day}:</strong> -
          </div>
        ))}
      </div>
    );
  }

  // Build case-insensitive map for lookup (handles "monday" or "Monday").
  const map: Record<string, any> = {};
  Object.entries(oh).forEach(([k, v]) => {
    map[k.toLowerCase()] = v;
  });

  return (
    <div>
      {weekdays.map((day) => {
        const entry = map[day.toLowerCase()];
        if (!entry) {
          return (
            <div key={day}>
              <strong>{day}:</strong> -
            </div>
          );
        }
        if (entry.closed) {
          return (
            <div key={day}>
              <strong>{day}:</strong> Closed
            </div>
          );
        }
        const open = entry.open || "-";
        const close = entry.close || "-";
        return (
          <div key={day}>
            <strong>{day}:</strong> {open} – {close}
          </div>
        );
      })}
    </div>
  );
}
