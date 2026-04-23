"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Button from "@/app/components/button/button";
import Typography from "@/app/components/typography/typography";
import { useAuth } from "@/hooks/useAuth";
import { useBeerTypes } from "@/hooks/useBeerTypes";
import { useCountries } from "@/hooks/useCountries";
import { API_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/auth";
import type { BeerGarden, Pub } from "@/types/pub";
import EditButton from "./components/EditButton";
import PubDisplayView from "./components/PubDisplayView";
import PubEditView from "./components/PubEditView";
import styles from "./page.module.css";

export default function PubPage() {
  const { id } = useParams();
  const [pub, setPub] = useState<Pub | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<Partial<Pub>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const { user, isApproved } = useAuth();
  const { countries, countriesLoading, countriesError } = useCountries();
  const { beerTypeOptions, beerTypesLoading, beerTypesError } = useBeerTypes();

  const getCountryName = useCallback(
    (code: string) => countries.find((c) => c.code === code)?.name ?? code,
    [countries]
  );

  useEffect(() => {
    async function fetchPub() {
      try {
        const res = await fetch(`${API_URL}/pubs/${id}`);
        setPub(res.ok ? (await res.json()) || null : null);
      } catch {
        setPub(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchPub();
  }, [id]);

  const handleEditClick = useCallback(() => {
    if (!pub) return;
    setEditFields({
      ...pub,
      beerGardens: pub.beerGardens ? [...pub.beerGardens] : [],
      beerTypeIds: getBeerTypeIdsFromPub(pub),
    });
    setSaveError(null);
    const requiredFields: (keyof Pub)[] = [
      "name", "city", "address", "postcode", "country",
    ];
    const initialErrors: Record<string, string> = {};
    for (const field of requiredFields) {
      const value = pub[field];
      initialErrors[`${field}Error`] =
        !value || value.toString().trim() === "" ? `${field} is required` : "";
    }
    initialErrors.websiteError = "";
    initialErrors.phoneError = "";
    setFieldErrors(initialErrors);
    setEditing(true);
  }, [pub]);

  const handleFieldChange = useCallback(
    (field: keyof Pub, value: Pub[keyof Pub]) => {
      setEditFields((prev) => ({ ...prev, [field]: value }));
      if (["name", "city", "address", "postcode", "country"].includes(field as string)) {
        setFieldErrors((prev) => ({
          ...prev,
          [`${field}Error`]:
            !value || (typeof value === "string" && value.trim() === "")
              ? `${field} is required`
              : "",
        }));
      }
      if (field === "website") {
        const trimmed = typeof value === "string" ? value.trim() : "";
        setFieldErrors((prev) => ({
          ...prev,
          websiteError:
            trimmed && !isValidHttpUrl(trimmed)
              ? "Please enter a valid URL (include http:// or https://)"
              : "",
        }));
      }
      if (field === "phone") {
        setFieldErrors((prev) => ({ ...prev, phoneError: "" }));
      }
    },
    []
  );

  const toggleBeerType = useCallback((beerTypeId: string) => {
    setEditFields((prev) => {
      const current = new Set(prev.beerTypeIds ?? []);
      if (current.has(beerTypeId)) current.delete(beerTypeId);
      else current.add(beerTypeId);
      return { ...prev, beerTypeIds: Array.from(current) };
    });
  }, []);

  const updateBeerGarden = useCallback(
    (index: number, patch: Partial<BeerGarden>) => {
      setEditFields((prev) => {
        const gardens = [...(prev.beerGardens ?? [])];
        gardens[index] = { ...(gardens[index] ?? createEmptyBeerGarden()), ...patch };
        return { ...prev, beerGardens: gardens };
      });
    },
    []
  );

  const addBeerGarden = useCallback(() => {
    setEditFields((prev) => ({
      ...prev,
      beerGardens: [...(prev.beerGardens ?? []), createEmptyBeerGarden()],
    }));
  }, []);

  const removeBeerGarden = useCallback((index: number) => {
    setEditFields((prev) => {
      const gardens = [...(prev.beerGardens ?? [])];
      gardens.splice(index, 1);
      return { ...prev, beerGardens: gardens };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!pub) return;

    const requiredFields: (keyof Pub)[] = [
      "name", "city", "address", "postcode", "country",
    ];
    const missingFields = requiredFields.filter(
      (f) => !editFields[f] || editFields[f]?.toString().trim() === ""
    );
    if (missingFields.length > 0) {
      const newErrors = { ...fieldErrors };
      for (const f of missingFields) newErrors[`${f}Error`] = `${f} is required`;
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
      const token = localStorage.getItem("token");
      const body: Record<string, unknown> = {};
      if (Array.isArray(editFields.beerTypeIds)) {
        body.beerTypes = editFields.beerTypeIds.map((beerTypeId) => ({ beerTypeId }));
      }
      for (const [key, value] of Object.entries(editFields)) {
        if (value === undefined || value === null) continue;
        if (key === "beerType") continue;
        if (Array.isArray(value)) {
          if (key === "beerGardens") {
            body[key] = value.filter(isBeerGarden).map((g) => sanitizeBeerGarden(g));
          } else if (key !== "beerTypes" && key !== "beerTypeIds" && value.length > 0) {
            body[key] = value;
          }
          continue;
        }
        if (value !== "") body[key] = value;
      }
      body.id = pub.id;
      if (pub.createdAt) body.createdAt = pub.createdAt;

      const res = await fetch(`${API_URL}/pubs/${pub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders(token) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(extractErrorMessage(data));
      } else {
        setPub(data);
        setEditing(false);
        setSaveError(null);
      }
    } catch {
      setSaveError("Network error");
    }
  }, [pub, editFields, fieldErrors]);

  const handleInlineSave = useCallback(async (
    field: keyof Pub,
    value: unknown
  ): Promise<string | null> => {
    if (!pub) return "No pub loaded";
    try {
      const token = localStorage.getItem("token");

      // Build the same full body as handleSave, using current pub data as the
      // base, then override the one field being edited.
      const merged: Partial<Pub> = {
        ...pub,
        beerGardens: pub.beerGardens ? [...pub.beerGardens] : [],
        beerTypeIds: getBeerTypeIdsFromPub(pub),
        [field]: value,
      };

      if ((field === "lat" || field === "lng") && typeof value === "string") {
        (merged as Record<string, unknown>)[field] =
          value === "" ? null : isNaN(parseFloat(value)) ? null : parseFloat(value);
      }

      const body: Record<string, unknown> = {};
      if (Array.isArray(merged.beerTypeIds)) {
        body.beerTypes = merged.beerTypeIds.map((beerTypeId) => ({ beerTypeId }));
      }
      for (const [key, val] of Object.entries(merged)) {
        if (val === undefined || val === null) continue;
        if (key === "beerType") continue;
        if (Array.isArray(val)) {
          if (key === "beerGardens") {
            body[key] = val.filter(isBeerGarden).map((g) => sanitizeBeerGarden(g));
          } else if (key !== "beerTypes" && key !== "beerTypeIds" && val.length > 0) {
            body[key] = val;
          }
          continue;
        }
        if (val !== "") body[key] = val;
      }
      body.id = pub.id;
      if (pub.createdAt) body.createdAt = pub.createdAt;

      const res = await fetch(`${API_URL}/pubs/${pub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders(token) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return extractErrorMessage(data);
      setPub(data);
      return null;
    } catch {
      return "Network error";
    }
  }, [pub]);

  const isSaveDisabled =
    Object.values(fieldErrors).some(Boolean) ||
    (["name", "city", "address", "postcode", "country"] as (keyof Pub)[]).some(
      (f) => !editFields[f] || editFields[f]?.toString().trim() === ""
    );

  return (
    <>
      {loading ? (
        <Typography>Loading pub details…</Typography>
      ) : pub ? (
        <>
          <Typography as="h2" variant="headingMedium">
            {pub.name}
          </Typography>
          {pub.imageUrl && (
            <Image
              src={pub.imageUrl}
              alt={pub.name}
              width={400}
              height={300}
              priority
              sizes="(max-width: 480px) 100vw, 400px"
              className={styles.pubImage}
            />
          )}
          {editing ? (
            <div className={styles.topButtonGroup}>
              <Button onClick={handleSave} disabled={isSaveDisabled}>
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => setEditing(false)}
                className={styles.cancelButton}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <EditButton
              pubName={pub.name}
              pubId={pub.id}
              user={user}
              onEdit={handleEditClick}
            />
          )}
          {editing ? (
            <PubEditView
              editFields={editFields}
              fieldErrors={fieldErrors}
              saveError={saveError}
              isSaveDisabled={isSaveDisabled}
              onFieldChange={handleFieldChange}
              onToggleBeerType={toggleBeerType}
              onUpdateBeerGarden={updateBeerGarden}
              onAddBeerGarden={addBeerGarden}
              onRemoveBeerGarden={removeBeerGarden}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
              countries={countries}
              countriesLoading={countriesLoading}
              countriesError={countriesError ?? null}
              beerTypeOptions={beerTypeOptions}
              beerTypesLoading={beerTypesLoading}
              beerTypesError={beerTypesError}
              setFieldErrors={setFieldErrors}
            />
          ) : (
            <PubDisplayView
              pub={pub}
              getCountryName={getCountryName}
              canEdit={isApproved}
              onInlineSave={handleInlineSave}
            />
          )}
        </>
      ) : (
        <Typography>Pub not found</Typography>
      )}
    </>
  );
}

// ─── Utilities ───────────────────────────────────────────────────────────────

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
      .filter((s): s is string => typeof s === "string" && s.length > 0);
  }
  if (pub.beerType) {
    if (typeof pub.beerType === "string") return [pub.beerType];
    return pub.beerType.id ? [pub.beerType.id] : [];
  }
  return [];
}

function isValidHttpUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function extractErrorMessage(errorPayload: unknown): string {
  if (!errorPayload) return "Unknown error";
  if (typeof errorPayload === "string") return errorPayload.trim() || "Unknown error";
  if (typeof errorPayload === "object") {
    const record = errorPayload as Record<string, unknown>;
    if (record.errors && typeof record.errors === "object") {
      const flattened = record.errors as {
        fieldErrors?: Record<string, string[]>;
        formErrors?: string[];
      };
      if (flattened.fieldErrors) {
        const msgs = Object.entries(flattened.fieldErrors).flatMap(
          ([field, messages]) =>
            Array.isArray(messages) && messages.length ? [`${field}: ${messages[0]}`] : []
        );
        if (msgs.length) return msgs.join("\n");
      }
      if (Array.isArray(flattened.formErrors) && flattened.formErrors.length) {
        return flattened.formErrors[0];
      }
    }
    if (typeof record.error === "string" && record.error.trim()) return record.error.trim();
    if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
    try { return JSON.stringify(record); } catch { return "Unknown error"; }
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

function isBeerGarden(item: unknown): item is BeerGarden {
  return typeof item === "object" && item !== null && "name" in item;
}

function sanitizeBeerGarden(garden: BeerGarden): BeerGarden {
  const cleaned: BeerGarden = { ...garden };
  for (const key of Object.keys(cleaned)) {
    if (cleaned[key as keyof BeerGarden] === null) {
      delete cleaned[key as keyof BeerGarden];
    }
  }
  if (cleaned.id?.startsWith("temp-")) delete cleaned.id;
  if (typeof cleaned.name === "string") cleaned.name = cleaned.name.trim();
  else if (cleaned.name === undefined) cleaned.name = "";
  if (typeof cleaned.description === "string")
    cleaned.description = cleaned.description.trim() || undefined;
  if (typeof cleaned.imageUrl === "string")
    cleaned.imageUrl = cleaned.imageUrl.trim() || undefined;
  if (typeof cleaned.notes === "string")
    cleaned.notes = cleaned.notes.trim() || undefined;
  if (cleaned.openingHours === null) cleaned.openingHours = undefined;
  if (cleaned.sunExposure === null) cleaned.sunExposure = undefined;
  if (cleaned.seatingCapacity === null || Number.isNaN(cleaned.seatingCapacity))
    cleaned.seatingCapacity = undefined;
  if (cleaned.isCovered === null) cleaned.isCovered = undefined;
  if (cleaned.isHeated === null) cleaned.isHeated = undefined;
  if (cleaned.isFamilyFriendly === null) cleaned.isFamilyFriendly = undefined;
  if (cleaned.petFriendly === null) cleaned.petFriendly = undefined;
  if (cleaned.pubId === null) cleaned.pubId = undefined;
  return cleaned;
}
