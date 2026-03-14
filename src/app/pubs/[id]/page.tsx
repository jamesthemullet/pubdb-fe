"use client"; // Needed for client-side hooks

import { useParams } from "next/navigation";

import { useEffect, useState } from "react";
import Input from "@/app/components/input/Input";
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
  chainName?: string;
  isIndependent?: boolean;
  hasFood?: boolean;
  hasSundayRoast?: boolean;
  hasBeerGarden?: boolean;
  hasCaskAle?: boolean;
  isBeerFocused?: boolean;
  isDogFriendly?: boolean;
  isFamilyFriendly?: boolean;
  hasStepFreeAccess?: boolean;
  hasAccessibleToilet?: boolean;
  hasLiveSport?: boolean;
  hasLiveMusic?: boolean;
  createdAt: string;
  operator?: string;
  area?: string;
  phone?: string;
  borough?: string;
  openingHours?: Record<
    string,
    { open?: string; close?: string; closed?: boolean }
  >;
  beerGardens?: BeerGarden[];
  beerTypes?: Array<BeerType | PubBeerType>;
  beerTypeIds?: string[];
  beerType?: BeerType | string | null;
};

type SunExposure = "FULL_SUN" | "PARTIAL_SUN" | "SHADED";

type BeerColour = "PALE" | "GOLDEN" | "AMBER" | "BROWN" | "DARK" | "BLACK";

type BeerType = {
  id: string;
  name: string;
  description?: string | null;
  colour?: BeerColour | null;
  isSystem?: boolean;
  isActive?: boolean;
};

type PubBeerType = {
  beerTypeId: string;
  beerType?: BeerType | null;
};

type BeerGarden = {
  id?: string;
  pubId?: string;
  name: string;
  description?: string;
  seatingCapacity?: number;
  sunExposure?: SunExposure;
  isCovered?: boolean;
  isHeated?: boolean;
  isFamilyFriendly?: boolean;
  petFriendly?: boolean;
  openingHours?: Record<
    string,
    { open?: string; close?: string; closed?: boolean }
  >;
  imageUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

const SUN_EXPOSURE_OPTIONS: Array<{ label: string; value: SunExposure }> = [
  { label: "Full sun", value: "FULL_SUN" },
  { label: "Partial sun", value: "PARTIAL_SUN" },
  { label: "Shaded", value: "SHADED" },
];

export default function PubPage() {
  const { id } = useParams();
  const [pub, setPub] = useState<Pub | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<Partial<Pub>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [countries, setCountries] = useState<{ name: string; code: string }[]>(
    []
  );
  const [countriesLoading, setCountriesLoading] = useState(false);

  const getCountryName = (code: string) => {
    const country = countries.find((c) => c.code === code);
    return country?.name || code;
  };
  const [beerTypeOptions, setBeerTypeOptions] = useState<BeerType[]>([]);
  const [beerTypesLoading, setBeerTypesLoading] = useState(false);
  const [beerTypesError, setBeerTypesError] = useState<string | null>(null);

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
        const data: Array<{ name: { common: string }; cca2: string }> =
          await res.json();
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

  useEffect(() => {
    let ignore = false;
    async function fetchBeerTypes() {
      setBeerTypesLoading(true);
      setBeerTypesError(null);
      const token = localStorage.getItem("token");

      try {
        const res = await fetch("/api/beer-types", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch beer types: ${res.status}`);
        }
        const payload = await res.json();
        const list = normalizeBeerTypes(payload);
        if (!ignore) {
          const sorted = list
            .filter((type) => type && (type.isActive ?? true))
            .sort((a, b) => a.name.localeCompare(b.name));
          setBeerTypeOptions(sorted);
        }
      } catch (err) {
        if (!ignore) {
          setBeerTypesError(
            err instanceof Error ? err.message : "Unable to load beer types."
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
      setEditFields({
        ...pub,
        beerGardens: pub.beerGardens ? [...pub.beerGardens] : [],
        beerTypeIds: getBeerTypeIdsFromPub(pub),
      });
      setSaveError(null);
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
      initialErrors.websiteError = "";
      initialErrors.phoneError = "";
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
    if (field === "website") {
      const trimmed = typeof value === "string" ? value.trim() : "";
      const errorMessage =
        trimmed && !isValidHttpUrl(trimmed)
          ? "Please enter a valid URL (include http:// or https://)"
          : "";
      setFieldErrors((prev) => ({
        ...prev,
        websiteError: errorMessage,
      }));
    }
    if (field === "phone") {
      setFieldErrors((prev) => ({
        ...prev,
        phoneError: "",
      }));
    }
  }

  function toggleBeerType(beerTypeId: string) {
    setEditFields((prev) => {
      const current = new Set(prev.beerTypeIds ?? []);
      if (current.has(beerTypeId)) {
        current.delete(beerTypeId);
      } else {
        current.add(beerTypeId);
      }
      return { ...prev, beerTypeIds: Array.from(current) };
    });
  }

  function updateBeerGarden(index: number, patch: Partial<BeerGarden>) {
    setEditFields((prev) => {
      const gardens = [...(prev.beerGardens ?? [])];
      const current = gardens[index] ?? createEmptyBeerGarden();
      gardens[index] = { ...current, ...patch };
      return { ...prev, beerGardens: gardens };
    });
  }

  function addBeerGarden() {
    setEditFields((prev) => ({
      ...prev,
      beerGardens: [...(prev.beerGardens ?? []), createEmptyBeerGarden()],
    }));
  }

  function removeBeerGarden(index: number) {
    setEditFields((prev) => {
      const gardens = [...(prev.beerGardens ?? [])];
      gardens.splice(index, 1);
      return { ...prev, beerGardens: gardens };
    });
  }

  function isBeerGarden(item: unknown): item is BeerGarden {
    return (
      typeof item === "object" &&
      item !== null &&
      "name" in (item as BeerGarden)
    );
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
      setSaveError("Please fill out all required fields.");
      return;
    }

    if (fieldErrors.websiteError || fieldErrors.phoneError) {
      setSaveError(fieldErrors.websiteError || fieldErrors.phoneError);
      return;
    }

    try {
      setSaveError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");
      const body: any = {};
      if (Array.isArray(editFields.beerTypeIds)) {
        body.beerTypes = editFields.beerTypeIds.map((beerTypeId) => ({
          beerTypeId,
        }));
      }
      Object.entries(editFields).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === "beerType") return;
        if (Array.isArray(value)) {
          if (key === "beerGardens") {
            const gardens = value.filter(isBeerGarden);
            body[key] = gardens.map((garden) => sanitizeBeerGarden(garden));
          } else if (key === "beerTypes") {
            return;
          } else if (key === "beerTypeIds") {
            return;
          } else if (value.length > 0) {
            body[key] = value;
          }
          return;
        }
        if (value !== "") {
          body[key] = value;
        }
      });

      body.id = pub.id;

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
        console.log(10, data.errors);
        setSaveError(extractErrorMessage(data));
      } else {
        setPub(data);
        setEditing(false);
        setSaveError(null);
      }
    } catch (err) {
      setSaveError("Network error");
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
                <Input
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
                <Input
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
                <select
                  value={editFields.country ?? ""}
                  onChange={(e) => handleFieldChange("country", e.target.value)}
                  required
                >
                  <option value="">
                    {countriesLoading && countries.length === 0
                      ? "Loading countries…"
                      : "Select a country"}
                  </option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.countryError && (
                  <span style={{ color: "red", marginLeft: "0.5rem" }}>
                    {fieldErrors.countryError}
                  </span>
                )}
              </label>
              <br />
              <label>
                Address:{" "}
                <Input
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
                <Input
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
                <Input
                  value={editFields.area ?? ""}
                  onChange={(e) => handleFieldChange("area", e.target.value)}
                />
              </label>
              <br />
              <label>
                Borough:{" "}
                <Input
                  value={editFields.borough ?? ""}
                  onChange={(e) => handleFieldChange("borough", e.target.value)}
                />
              </label>
              <br />
              <label>
                Operator:{" "}
                <Input
                  value={editFields.operator ?? ""}
                  onChange={(e) =>
                    handleFieldChange("operator", e.target.value)
                  }
                />
              </label>
              <br />
              <label>
                Phone:{" "}
                <Input
                  value={editFields.phone ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\+?[0-9\-\s]*$/.test(value) || value === "") {
                      handleFieldChange("phone", value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        phoneError: "",
                      }));
                    } else {
                      setFieldErrors((prev) => ({
                        ...prev,
                        phoneError:
                          "Invalid phone number format. Only numbers, spaces, and dashes are allowed.",
                      }));
                    }
                  }}
                />
                {fieldErrors.phoneError && (
                  <span style={{ color: "red" }}>{fieldErrors.phoneError}</span>
                )}
              </label>
              <br />
              <label>
                Website:{" "}
                <Input
                  value={editFields.website ?? ""}
                  onChange={(e) => handleFieldChange("website", e.target.value)}
                />
                {fieldErrors.websiteError && (
                  <span style={{ color: "red", marginLeft: "0.5rem" }}>
                    {fieldErrors.websiteError}
                  </span>
                )}
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
                Chain name:{" "}
                <Input
                  value={editFields.chainName ?? ""}
                  onChange={(e) =>
                    handleFieldChange("chainName", e.target.value)
                  }
                />
              </label>
              <br />
              <div style={{ display: "grid", gap: "0.35rem" }}>
                <label>
                  <Input
                    type="checkbox"
                    checked={editFields.isIndependent ?? false}
                    onChange={(e) =>
                      handleFieldChange("isIndependent", e.target.checked)
                    }
                  />{" "}
                  Independent
                </label>
                <label>
                  <Input
                    type="checkbox"
                    checked={editFields.hasFood ?? false}
                    onChange={(e) =>
                      handleFieldChange("hasFood", e.target.checked)
                    }
                  />{" "}
                  Food available
                </label>
                <label>
                  <Input
                    type="checkbox"
                    checked={editFields.hasSundayRoast ?? false}
                    onChange={(e) =>
                      handleFieldChange("hasSundayRoast", e.target.checked)
                    }
                  />{" "}
                  Sunday roast
                </label>
                <label>
                  <Input
                    type="checkbox"
                    checked={editFields.hasBeerGarden ?? false}
                    onChange={(e) =>
                      handleFieldChange("hasBeerGarden", e.target.checked)
                    }
                  />{" "}
                  Beer garden
                </label>
                <label>
                  <Input
                    type="checkbox"
                    checked={editFields.hasCaskAle ?? false}
                    onChange={(e) =>
                      handleFieldChange("hasCaskAle", e.target.checked)
                    }
                  />{" "}
                  Cask ale
                </label>
                <label>
                  <Input
                    type="checkbox"
                    checked={editFields.isBeerFocused ?? false}
                    onChange={(e) =>
                      handleFieldChange("isBeerFocused", e.target.checked)
                    }
                  />{" "}
                  Beer-focused
                </label>
                <label>
                  <Input
                    type="checkbox"
                    checked={editFields.isDogFriendly ?? false}
                    onChange={(e) =>
                      handleFieldChange("isDogFriendly", e.target.checked)
                    }
                  />{" "}
                  Dog friendly
                </label>
                <label>
                  <Input
                    type="checkbox"
                    checked={editFields.isFamilyFriendly ?? false}
                    onChange={(e) =>
                      handleFieldChange("isFamilyFriendly", e.target.checked)
                    }
                  />{" "}
                  Family friendly
                </label>
                <label>
                  <Input
                    type="checkbox"
                    checked={editFields.hasStepFreeAccess ?? false}
                    onChange={(e) =>
                      handleFieldChange("hasStepFreeAccess", e.target.checked)
                    }
                  />{" "}
                  Step-free access
                </label>
                <label>
                  <Input
                    type="checkbox"
                    checked={editFields.hasAccessibleToilet ?? false}
                    onChange={(e) =>
                      handleFieldChange("hasAccessibleToilet", e.target.checked)
                    }
                  />{" "}
                  Accessible toilet
                </label>
                <label>
                  <Input
                    type="checkbox"
                    checked={editFields.hasLiveSport ?? false}
                    onChange={(e) =>
                      handleFieldChange("hasLiveSport", e.target.checked)
                    }
                  />{" "}
                  Live sport
                </label>
                <label>
                  <Input
                    type="checkbox"
                    checked={editFields.hasLiveMusic ?? false}
                    onChange={(e) =>
                      handleFieldChange("hasLiveMusic", e.target.checked)
                    }
                  />{" "}
                  Live music
                </label>
              </div>
              <br />
              <label>
                Beer Types:{" "}
                <div style={{ marginTop: "0.35rem", display: "grid" }}>
                  {beerTypesLoading ? (
                    <span>Loading beer types…</span>
                  ) : beerTypeOptions.length > 0 ? (
                    <div style={{ display: "grid", gap: "0.35rem" }}>
                      {beerTypeOptions.map((type) => (
                        <label key={type.id} style={{ display: "flex" }}>
                          <Input
                            type="checkbox"
                            checked={(editFields.beerTypeIds ?? []).includes(
                              type.id
                            )}
                            onChange={() => toggleBeerType(type.id)}
                          />
                          <span style={{ marginLeft: "0.5rem" }}>
                            {type.name}
                            {type.colour ? ` (${type.colour})` : ""}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: "#666" }}>
                      {beerTypesError || "No beer types available."}
                    </span>
                  )}
                </div>
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
              <div style={{ marginTop: "1rem" }}>
                <h3>Beer Gardens</h3>
                {(editFields.beerGardens || []).length === 0 && (
                  <p style={{ color: "#666" }}>No beer gardens added yet.</p>
                )}
                {(editFields.beerGardens || []).map((garden, index) => (
                  <div
                    key={garden.id || `garden-${index}`}
                    style={{
                      border: "1px solid #ddd",
                      padding: "0.75rem",
                      borderRadius: 6,
                      marginBottom: "0.75rem",
                      display: "grid",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <strong>Garden {index + 1}</strong>
                      <button
                        type="button"
                        onClick={() => removeBeerGarden(index)}
                        className="secondary"
                      >
                        Remove
                      </button>
                    </div>
                    <label>
                      Name:{" "}
                      <Input
                        value={garden.name}
                        onChange={(e) =>
                          updateBeerGarden(index, { name: e.target.value })
                        }
                        required
                      />
                    </label>
                    <label>
                      Description:{" "}
                      <textarea
                        value={garden.description ?? ""}
                        onChange={(e) =>
                          updateBeerGarden(index, {
                            description: e.target.value || undefined,
                          })
                        }
                      />
                    </label>
                    <label>
                      Seating capacity:{" "}
                      <Input
                        type="number"
                        value={garden.seatingCapacity ?? ""}
                        onChange={(e) =>
                          updateBeerGarden(index, {
                            seatingCapacity:
                              e.target.value === ""
                                ? undefined
                                : Number.parseInt(e.target.value, 10),
                          })
                        }
                        min={0}
                      />
                    </label>
                    <label>
                      Sun exposure:{" "}
                      <select
                        value={garden.sunExposure ?? ""}
                        onChange={(e) =>
                          updateBeerGarden(index, {
                            sunExposure:
                              (e.target.value as SunExposure) || undefined,
                          })
                        }
                      >
                        <option value="">Select sun exposure</option>
                        {SUN_EXPOSURE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Image URL:{" "}
                      <Input
                        value={garden.imageUrl ?? ""}
                        onChange={(e) =>
                          updateBeerGarden(index, {
                            imageUrl: e.target.value || undefined,
                          })
                        }
                      />
                    </label>
                    <label>
                      Notes:{" "}
                      <textarea
                        value={garden.notes ?? ""}
                        onChange={(e) =>
                          updateBeerGarden(index, {
                            notes: e.target.value || undefined,
                          })
                        }
                      />
                    </label>
                    <div style={{ display: "grid", gap: "0.35rem" }}>
                      <label>
                        <Input
                          type="checkbox"
                          checked={garden.isCovered ?? false}
                          onChange={(e) =>
                            updateBeerGarden(index, {
                              isCovered: e.target.checked,
                            })
                          }
                        />{" "}
                        Covered
                      </label>
                      <label>
                        <Input
                          type="checkbox"
                          checked={garden.isHeated ?? false}
                          onChange={(e) =>
                            updateBeerGarden(index, {
                              isHeated: e.target.checked,
                            })
                          }
                        />{" "}
                        Heated
                      </label>
                      <label>
                        <Input
                          type="checkbox"
                          checked={garden.isFamilyFriendly ?? false}
                          onChange={(e) =>
                            updateBeerGarden(index, {
                              isFamilyFriendly: e.target.checked,
                            })
                          }
                        />{" "}
                        Family friendly
                      </label>
                      <label>
                        <Input
                          type="checkbox"
                          checked={garden.petFriendly ?? false}
                          onChange={(e) =>
                            updateBeerGarden(index, {
                              petFriendly: e.target.checked,
                            })
                          }
                        />{" "}
                        Pet friendly
                      </label>
                    </div>
                    <label>
                      Opening Hours:{" "}
                      <OpeningHoursEditor
                        value={garden.openingHours}
                        onChange={(val) =>
                          updateBeerGarden(index, { openingHours: val })
                        }
                      />
                    </label>
                  </div>
                ))}
                <button type="button" onClick={addBeerGarden}>
                  Add beer garden
                </button>
              </div>
              <br />
              <label>
                Latitude:{" "}
                <Input
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
                <Input
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
              {saveError && (
                <p style={{ color: "red", marginTop: "0.5rem" }}>{saveError}</p>
              )}
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
                <strong>Country:</strong> {getCountryName(pub.country)}
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
                <strong>Chain name:</strong> {pub.chainName || "-"}
              </p>
              <p>
                <strong>Independent:</strong>{" "}
                {pub.isIndependent == null
                  ? "-"
                  : pub.isIndependent
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                <strong>Food available:</strong>{" "}
                {pub.hasFood == null ? "-" : pub.hasFood ? "Yes" : "No"}
              </p>
              <p>
                <strong>Sunday roast:</strong>{" "}
                {pub.hasSundayRoast == null
                  ? "-"
                  : pub.hasSundayRoast
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                <strong>Beer garden:</strong>{" "}
                {pub.hasBeerGarden == null
                  ? "-"
                  : pub.hasBeerGarden
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                <strong>Cask ale:</strong>{" "}
                {pub.hasCaskAle == null ? "-" : pub.hasCaskAle ? "Yes" : "No"}
              </p>
              <p>
                <strong>Beer-focused:</strong>{" "}
                {pub.isBeerFocused == null
                  ? "-"
                  : pub.isBeerFocused
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                <strong>Dog friendly:</strong>{" "}
                {pub.isDogFriendly == null
                  ? "-"
                  : pub.isDogFriendly
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                <strong>Family friendly:</strong>{" "}
                {pub.isFamilyFriendly == null
                  ? "-"
                  : pub.isFamilyFriendly
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                <strong>Step-free access:</strong>{" "}
                {pub.hasStepFreeAccess == null
                  ? "-"
                  : pub.hasStepFreeAccess
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                <strong>Accessible toilet:</strong>{" "}
                {pub.hasAccessibleToilet == null
                  ? "-"
                  : pub.hasAccessibleToilet
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                <strong>Live sport:</strong>{" "}
                {pub.hasLiveSport == null
                  ? "-"
                  : pub.hasLiveSport
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                <strong>Live music:</strong>{" "}
                {pub.hasLiveMusic == null
                  ? "-"
                  : pub.hasLiveMusic
                  ? "Yes"
                  : "No"}
              </p>
              <p>
                <strong>Beer Types:</strong>{" "}
                {getBeerTypeNames(pub).length
                  ? getBeerTypeNames(pub).join(", ")
                  : "-"}
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
              <div>
                <strong>Beer Gardens:</strong>
                {pub.beerGardens && pub.beerGardens.length > 0 ? (
                  <div style={{ marginTop: "0.5rem", display: "grid" }}>
                    {pub.beerGardens.map((garden, index) => (
                      <div
                        key={garden.id || `garden-${index}`}
                        style={{
                          border: "1px solid #ddd",
                          padding: "0.75rem",
                          borderRadius: 6,
                          marginBottom: "0.75rem",
                        }}
                      >
                        <p>
                          <strong>Name:</strong> {garden.name}
                        </p>
                        <p>
                          <strong>Description:</strong>{" "}
                          {garden.description || "-"}
                        </p>
                        <p>
                          <strong>Seating capacity:</strong>{" "}
                          {garden.seatingCapacity ?? "-"}
                        </p>
                        <p>
                          <strong>Sun exposure:</strong>{" "}
                          {garden.sunExposure || "-"}
                        </p>
                        <p>
                          <strong>Covered:</strong>{" "}
                          {garden.isCovered ? "Yes" : "No"}
                        </p>
                        <p>
                          <strong>Heated:</strong>{" "}
                          {garden.isHeated ? "Yes" : "No"}
                        </p>
                        <p>
                          <strong>Family friendly:</strong>{" "}
                          {garden.isFamilyFriendly ? "Yes" : "No"}
                        </p>
                        <p>
                          <strong>Pet friendly:</strong>{" "}
                          {garden.petFriendly ? "Yes" : "No"}
                        </p>
                        <p>
                          <strong>Image:</strong>{" "}
                          {garden.imageUrl ? (
                            <a
                              href={garden.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {garden.imageUrl}
                            </a>
                          ) : (
                            "-"
                          )}
                        </p>
                        <p>
                          <strong>Notes:</strong> {garden.notes || "-"}
                        </p>
                        <p>
                          <strong>Opening Hours:</strong>
                          {garden.openingHours ? (
                            <div style={{ marginTop: "0.5rem" }}>
                              {renderOpeningHours(garden.openingHours)}
                            </div>
                          ) : (
                            " -"
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  " -"
                )}
              </div>
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

function getBeerTypeIdsFromPub(pub: Pub): string[] {
  if (Array.isArray(pub.beerTypeIds) && pub.beerTypeIds.length > 0) {
    return pub.beerTypeIds;
  }
  if (Array.isArray(pub.beerTypes) && pub.beerTypes.length > 0) {
    return pub.beerTypes
      .map((entry) => {
        if (!entry) return undefined;
        if ("beerTypeId" in entry) return entry.beerTypeId;
        return entry.id;
      })
      .filter(Boolean) as string[];
  }
  if (pub.beerType) {
    if (typeof pub.beerType === "string") {
      return [pub.beerType];
    }
    return pub.beerType.id ? [pub.beerType.id] : [];
  }
  return [];
}

function getBeerTypeNames(pub: Pub): string[] {
  if (Array.isArray(pub.beerTypes) && pub.beerTypes.length > 0) {
    return pub.beerTypes
      .map((entry) => {
        if (!entry) return undefined;
        if ("beerType" in entry) {
          return entry.beerType?.name || entry.beerTypeId;
        }
        if ("beerTypeId" in entry) {
          return entry.beerTypeId;
        }
        return entry.name || entry.id;
      })
      .filter(Boolean) as string[];
  }
  if (pub.beerType) {
    if (typeof pub.beerType === "string") {
      return [pub.beerType];
    }
    return [pub.beerType.name || pub.beerType.id].filter(Boolean);
  }
  if (Array.isArray(pub.beerTypeIds) && pub.beerTypeIds.length > 0) {
    return pub.beerTypeIds;
  }
  return [];
}

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function extractErrorMessage(errorPayload: unknown): string {
  if (!errorPayload) {
    return "Unknown error";
  }

  if (typeof errorPayload === "string") {
    const trimmed = errorPayload.trim();
    return trimmed || "Unknown error";
  }

  if (typeof errorPayload === "object") {
    const record = errorPayload as Record<string, unknown>;

    if (record.errors && typeof record.errors === "object") {
      const flattened = record.errors as {
        fieldErrors?: Record<string, string[]>;
        formErrors?: string[];
      };

      if (flattened.fieldErrors && typeof flattened.fieldErrors === "object") {
        const firstFieldMessage = Object.entries(flattened.fieldErrors)
          .map(([field, messages]) => {
            if (Array.isArray(messages) && messages.length) {
              return `${field}: ${messages[0]}`;
            }
            return undefined;
          })
          .filter((msg): msg is string => Boolean(msg));
        if (firstFieldMessage.length) {
          return firstFieldMessage.join("\n");
        }
      }

      if (
        Array.isArray(flattened.formErrors) &&
        flattened.formErrors.length &&
        typeof flattened.formErrors[0] === "string"
      ) {
        return flattened.formErrors[0];
      }
    }

    if (typeof record.error === "string" && record.error.trim()) {
      return record.error.trim();
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message.trim();
    }

    try {
      return JSON.stringify(record);
    } catch {
      return "Unknown error";
    }
  }

  return String(errorPayload);
}

function createEmptyBeerGarden(): BeerGarden {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: "",
    description: "",
    seatingCapacity: undefined,
    sunExposure: undefined,
    isCovered: false,
    isHeated: false,
    isFamilyFriendly: false,
    petFriendly: false,
    openingHours: undefined,
    imageUrl: "",
    notes: "",
  };
}

function sanitizeBeerGarden(garden: BeerGarden): BeerGarden {
  const cleaned: BeerGarden = { ...garden };
  Object.keys(cleaned).forEach((key) => {
    const value = cleaned[key as keyof BeerGarden];
    if (value === null) {
      delete cleaned[key as keyof BeerGarden];
    }
  });
  if (cleaned.id && cleaned.id.startsWith("temp-")) {
    delete cleaned.id;
  }
  if (typeof cleaned.name === "string") {
    cleaned.name = cleaned.name.trim();
  } else if (cleaned.name === undefined) {
    cleaned.name = "";
  }
  if (typeof cleaned.description === "string") {
    cleaned.description = cleaned.description.trim() || undefined;
  }
  if (typeof cleaned.imageUrl === "string") {
    cleaned.imageUrl = cleaned.imageUrl.trim() || undefined;
  }
  if (typeof cleaned.notes === "string") {
    cleaned.notes = cleaned.notes.trim() || undefined;
  }
  if (cleaned.openingHours === null) {
    cleaned.openingHours = undefined;
  }
  if (cleaned.sunExposure === null) {
    cleaned.sunExposure = undefined;
  }
  if (
    cleaned.seatingCapacity === null ||
    Number.isNaN(cleaned.seatingCapacity)
  ) {
    cleaned.seatingCapacity = undefined;
  }
  if (cleaned.isCovered === null) {
    cleaned.isCovered = undefined;
  }
  if (cleaned.isHeated === null) {
    cleaned.isHeated = undefined;
  }
  if (cleaned.isFamilyFriendly === null) {
    cleaned.isFamilyFriendly = undefined;
  }
  if (cleaned.petFriendly === null) {
    cleaned.petFriendly = undefined;
  }
  if (cleaned.pubId === null) {
    cleaned.pubId = undefined;
  }
  return cleaned;
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
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser({
            email: data.email,
            approved: data.approved,
            admin: data.admin,
          });
          return;
        }
      } catch {
        // Fall through to token decoding fallback.
      }

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
    };

    void checkAuth();
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
