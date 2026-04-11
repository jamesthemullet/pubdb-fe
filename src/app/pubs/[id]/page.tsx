"use client"; // Needed for client-side hooks

import Image from "next/image";
import { useParams } from "next/navigation";

import { useEffect, useState } from "react";
import Button from "@/app/components/button/button";
import Dropdown from "@/app/components/dropdown/Dropdown";
import Input from "@/app/components/input/Input";
import PubAmenitiesFields from "@/app/components/pub-form/PubAmenitiesFields";
import PubCoreIdentityFields from "@/app/components/pub-form/PubCoreIdentityFields";
import Textarea from "@/app/components/textarea/Textarea";
import Typography from "@/app/components/typography/typography";
import type { PubAmenityKey } from "@/constants/pubFormFields";
import { useBeerTypes } from "@/hooks/useBeerTypes";
import { useCountries } from "@/hooks/useCountries";
import { API_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/auth";
import type { BeerGarden, Pub, SunExposure } from "@/types/pub";
import OpeningHoursEditor from "../../features/opening-hours/opening-hours-editor";
import styles from "./page.module.css";

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
  const { countries, countriesLoading } = useCountries();

  const getCountryName = (code: string) => {
    const country = countries.find((c) => c.code === code);
    return country?.name || code;
  };
  const { beerTypeOptions, beerTypesLoading, beerTypesError } = useBeerTypes();

  useEffect(() => {
    async function fetchPub() {
      try {
        const apiUrl = API_URL;

        const resById = await fetch(`${apiUrl}/pubs/${id}`);
        if (resById.ok) {
          const dataById = await resById.json();
          setPub(dataById || null);
        } else {
          setPub(null);
        }
      } catch (_error) {
        setPub(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchPub();
  }, [id]);

  const handleEditClick = () => {
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
  };

  const handleFieldChange = (field: keyof Pub, value: Pub[keyof Pub]) => {
    setEditFields((prev) => ({ ...prev, [field]: value }));
    if (["name", "city", "address", "postcode", "country"].includes(field)) {
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
  };

  const toggleBeerType = (beerTypeId: string) => {
    setEditFields((prev) => {
      const current = new Set(prev.beerTypeIds ?? []);
      if (current.has(beerTypeId)) {
        current.delete(beerTypeId);
      } else {
        current.add(beerTypeId);
      }
      return { ...prev, beerTypeIds: Array.from(current) };
    });
  };

  const updateBeerGarden = (index: number, patch: Partial<BeerGarden>) => {
    setEditFields((prev) => {
      const gardens = [...(prev.beerGardens ?? [])];
      const current = gardens[index] ?? createEmptyBeerGarden();
      gardens[index] = { ...current, ...patch };
      return { ...prev, beerGardens: gardens };
    });
  };

  const addBeerGarden = () => {
    setEditFields((prev) => ({
      ...prev,
      beerGardens: [...(prev.beerGardens ?? []), createEmptyBeerGarden()],
    }));
  };

  const removeBeerGarden = (index: number) => {
    setEditFields((prev) => {
      const gardens = [...(prev.beerGardens ?? [])];
      gardens.splice(index, 1);
      return { ...prev, beerGardens: gardens };
    });
  };

  const isBeerGarden = (item: unknown): item is BeerGarden => {
    return (
      typeof item === "object" &&
      item !== null &&
      "name" in (item as BeerGarden)
    );
  };

  const handleSave = async () => {
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
      const apiUrl = API_URL;
      const token = localStorage.getItem("token");
      const body: Record<string, unknown> = {};
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
          ...buildAuthHeaders(token),
        },
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
    } catch (_err) {
      setSaveError("Network error");
    }
  };

  const isSaveDisabled =
    Object.values(fieldErrors).some((err) => !!err) ||
    ["name", "city", "address", "postcode", "country"].some(
      (field) =>
        !editFields[field as keyof Pub] ||
        editFields[field as keyof Pub]?.toString().trim() === ""
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
              onEdit={handleEditClick}
              pubId={pub.id}
            />
          )}
          {editing ? (
            <div className={styles.editSection}>
              <PubCoreIdentityFields
                values={{
                  name: editFields.name ?? "",
                  city: editFields.city ?? "",
                  country: editFields.country ?? "",
                  address: editFields.address ?? "",
                  postcode: editFields.postcode ?? "",
                  lat: editFields.lat,
                  lng: editFields.lng,
                }}
                onFieldChange={(field, value) =>
                  handleFieldChange(field as keyof Pub, value)
                }
                countries={countries}
                countriesLoading={countriesLoading}
                fieldErrors={{
                  name: fieldErrors.nameError ? [fieldErrors.nameError] : [],
                  city: fieldErrors.cityError ? [fieldErrors.cityError] : [],
                  country: fieldErrors.countryError
                    ? [fieldErrors.countryError]
                    : [],
                  address: fieldErrors.addressError
                    ? [fieldErrors.addressError]
                    : [],
                  postcode: fieldErrors.postcodeError
                    ? [fieldErrors.postcodeError]
                    : [],
                }}
                showRequiredMarkers={false}
                namePrefix="edit-pub"
              />
              <br />
              <label htmlFor="edit-area">
                Area:{" "}
                <Input
                  id="edit-area"
                  value={editFields.area ?? ""}
                  onChange={(e) => handleFieldChange("area", e.target.value)}
                />
              </label>
              <br />
              <label htmlFor="edit-borough">
                Borough:{" "}
                <Input
                  id="edit-borough"
                  value={editFields.borough ?? ""}
                  onChange={(e) => handleFieldChange("borough", e.target.value)}
                />
              </label>
              <br />
              <label htmlFor="edit-operator">
                Operator:{" "}
                <Input
                  id="edit-operator"
                  value={editFields.operator ?? ""}
                  onChange={(e) =>
                    handleFieldChange("operator", e.target.value)
                  }
                />
              </label>
              <br />
              <label htmlFor="edit-phone">
                Phone:{" "}
                <Input
                  id="edit-phone"
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
                  <Typography as="span" className={styles.errorText}>
                    {fieldErrors.phoneError}
                  </Typography>
                )}
              </label>
              <br />
              <label htmlFor="edit-website">
                Website:{" "}
                <Input
                  id="edit-website"
                  value={editFields.website ?? ""}
                  onChange={(e) => handleFieldChange("website", e.target.value)}
                />
                {fieldErrors.websiteError && (
                  <Typography as="span" className={styles.errorInline}>
                    {fieldErrors.websiteError}
                  </Typography>
                )}
              </label>
              <br />
              <label htmlFor="edit-description">
                Description:{" "}
                <Textarea
                  id="edit-description"
                  value={editFields.description ?? ""}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                />
              </label>
              <br />
              <label htmlFor="edit-chain-name">
                Chain name:{" "}
                <Input
                  id="edit-chain-name"
                  value={editFields.chainName ?? ""}
                  onChange={(e) =>
                    handleFieldChange("chainName", e.target.value)
                  }
                />
              </label>
              <br />
              <PubAmenitiesFields
                values={editFields as Partial<Record<PubAmenityKey, boolean>>}
                onChange={(key, checked) =>
                  handleFieldChange(key as keyof Pub, checked)
                }
              />
              <br />
              <div>
                <span>Beer Types: </span>
                <div className={styles.beerTypesOuter}>
                  {beerTypesLoading ? (
                    <Typography as="span">Loading beer types…</Typography>
                  ) : beerTypeOptions.length > 0 ? (
                    <div className={styles.beerTypeOptions}>
                      {beerTypeOptions.map((type) => (
                        <label
                          htmlFor={`beer-type-${type.id}`}
                          key={type.id}
                          className={styles.beerTypeLabel}
                        >
                          <Input
                            id={`beer-type-${type.id}`}
                            type="checkbox"
                            checked={(editFields.beerTypeIds ?? []).includes(
                              type.id
                            )}
                            onChange={() => toggleBeerType(type.id)}
                          />
                          <Typography as="span" className={styles.beerTypeName}>
                            {type.name}
                            {type.colour ? ` (${type.colour})` : ""}
                          </Typography>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Typography className={styles.emptyMessage}>
                      {beerTypesError || "No beer types available."}
                    </Typography>
                  )}
                </div>
              </div>
              <br />
              <div>
                <Typography as="span">Opening Hours: </Typography>
                <OpeningHoursEditor
                  value={editFields.openingHours}
                  onChange={(val) => handleFieldChange("openingHours", val)}
                />
              </div>
              <br />
              <div className={styles.beerGardenSection}>
                <Typography as="h3" variant="headingSmall">
                  Beer Gardens
                </Typography>
                {(editFields.beerGardens || []).length === 0 && (
                  <Typography className={styles.emptyMessage}>
                    No beer gardens added yet.
                  </Typography>
                )}
                {(editFields.beerGardens || []).map((garden, index) => (
                  <div
                    key={garden.id || `garden-${index}`}
                    className={styles.gardenCard}
                  >
                    <div className={styles.gardenHeader}>
                      <Typography as="span" isBold>
                        Garden {index + 1}
                      </Typography>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => removeBeerGarden(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <label htmlFor={`garden-${index}-name`}>
                      Name:{" "}
                      <Input
                        id={`garden-${index}-name`}
                        value={garden.name}
                        onChange={(e) =>
                          updateBeerGarden(index, { name: e.target.value })
                        }
                        required
                      />
                    </label>
                    <label htmlFor={`garden-${index}-description`}>
                      Description:{" "}
                      <Textarea
                        id={`garden-${index}-description`}
                        value={garden.description ?? ""}
                        onChange={(e) =>
                          updateBeerGarden(index, {
                            description: e.target.value || undefined,
                          })
                        }
                      />
                    </label>
                    <label htmlFor={`garden-${index}-seating`}>
                      Seating capacity:{" "}
                      <Input
                        id={`garden-${index}-seating`}
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
                    <label htmlFor={`garden-${index}-sun-exposure`}>
                      Sun exposure:{" "}
                      <Dropdown
                        id={`garden-${index}-sun-exposure`}
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
                      </Dropdown>
                    </label>
                    <label htmlFor={`garden-${index}-imageUrl`}>
                      Image URL:{" "}
                      <Input
                        id={`garden-${index}-imageUrl`}
                        value={garden.imageUrl ?? ""}
                        onChange={(e) =>
                          updateBeerGarden(index, {
                            imageUrl: e.target.value || undefined,
                          })
                        }
                      />
                    </label>
                    <label htmlFor={`garden-${index}-notes`}>
                      Notes:{" "}
                      <Textarea
                        id={`garden-${index}-notes`}
                        value={garden.notes ?? ""}
                        onChange={(e) =>
                          updateBeerGarden(index, {
                            notes: e.target.value || undefined,
                          })
                        }
                      />
                    </label>
                    <div className={styles.gardenCheckboxes}>
                      <label htmlFor={`garden-${index}-covered`}>
                        <Input
                          id={`garden-${index}-covered`}
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
                      <label htmlFor={`garden-${index}-heated`}>
                        <Input
                          id={`garden-${index}-heated`}
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
                      <label htmlFor={`garden-${index}-family`}>
                        <Input
                          id={`garden-${index}-family`}
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
                      <label htmlFor={`garden-${index}-pet`}>
                        <Input
                          id={`garden-${index}-pet`}
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
                    <div>
                      <Typography as="span">Opening Hours: </Typography>
                      <OpeningHoursEditor
                        value={garden.openingHours}
                        onChange={(val) =>
                          updateBeerGarden(index, { openingHours: val })
                        }
                      />
                    </div>
                  </div>
                ))}
                <Button onClick={addBeerGarden}>Add beer garden</Button>
              </div>
              <br />
              <Button onClick={handleSave} disabled={isSaveDisabled}>
                Save
              </Button>
              {saveError && (
                <Typography className={styles.saveError}>
                  {saveError}
                </Typography>
              )}
              <Button
                variant="secondary"
                onClick={() => setEditing(false)}
                className={styles.cancelButton}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <Typography>
                <Typography as="span" isBold>
                  City:
                </Typography>{" "}
                {pub.city}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Country:
                </Typography>{" "}
                {getCountryName(pub.country)}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Address:
                </Typography>{" "}
                {pub.address}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Postcode:
                </Typography>{" "}
                {pub.postcode}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Area:
                </Typography>{" "}
                {pub.area || "-"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Borough:
                </Typography>{" "}
                {pub.borough || "-"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Operator:
                </Typography>{" "}
                {pub.operator || "-"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Phone:
                </Typography>{" "}
                {pub.phone || "-"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Website:
                </Typography>{" "}
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
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Description:
                </Typography>{" "}
                {pub.description || "-"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Chain name:
                </Typography>{" "}
                {pub.chainName || "-"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Independent:
                </Typography>{" "}
                {pub.isIndependent == null
                  ? "-"
                  : pub.isIndependent
                  ? "Yes"
                  : "No"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Food available:
                </Typography>{" "}
                {pub.hasFood == null ? "-" : pub.hasFood ? "Yes" : "No"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Sunday roast:
                </Typography>{" "}
                {pub.hasSundayRoast == null
                  ? "-"
                  : pub.hasSundayRoast
                  ? "Yes"
                  : "No"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Beer garden:
                </Typography>{" "}
                {pub.hasBeerGarden == null
                  ? "-"
                  : pub.hasBeerGarden
                  ? "Yes"
                  : "No"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Cask ale:
                </Typography>{" "}
                {pub.hasCaskAle == null ? "-" : pub.hasCaskAle ? "Yes" : "No"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Beer-focused:
                </Typography>{" "}
                {pub.isBeerFocused == null
                  ? "-"
                  : pub.isBeerFocused
                  ? "Yes"
                  : "No"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Dog friendly:
                </Typography>{" "}
                {pub.isDogFriendly == null
                  ? "-"
                  : pub.isDogFriendly
                  ? "Yes"
                  : "No"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Family friendly:
                </Typography>{" "}
                {pub.isFamilyFriendly == null
                  ? "-"
                  : pub.isFamilyFriendly
                  ? "Yes"
                  : "No"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Step-free access:
                </Typography>{" "}
                {pub.hasStepFreeAccess == null
                  ? "-"
                  : pub.hasStepFreeAccess
                  ? "Yes"
                  : "No"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Accessible toilet:
                </Typography>{" "}
                {pub.hasAccessibleToilet == null
                  ? "-"
                  : pub.hasAccessibleToilet
                  ? "Yes"
                  : "No"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Live sport:
                </Typography>{" "}
                {pub.hasLiveSport == null
                  ? "-"
                  : pub.hasLiveSport
                  ? "Yes"
                  : "No"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Live music:
                </Typography>{" "}
                {pub.hasLiveMusic == null
                  ? "-"
                  : pub.hasLiveMusic
                  ? "Yes"
                  : "No"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Beer Types:
                </Typography>{" "}
                {getBeerTypeNames(pub).length
                  ? getBeerTypeNames(pub).join(", ")
                  : "-"}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Opening Hours:
                </Typography>
                {pub.openingHours ? (
                  <div className={styles.openingHoursDisplay}>
                    {renderOpeningHours(pub.openingHours)}
                  </div>
                ) : (
                  " -"
                )}
              </Typography>
              <div>
                <Typography as="span" isBold>
                  Beer Gardens:
                </Typography>
                {pub.beerGardens && pub.beerGardens.length > 0 ? (
                  <div className={styles.beerGardensDisplay}>
                    {pub.beerGardens.map((garden, index) => (
                      <div
                        key={garden.id || `garden-${index}`}
                        className={styles.gardenDisplayCard}
                      >
                        <Typography>
                          <Typography as="span" isBold>
                            Name:
                          </Typography>{" "}
                          {garden.name}
                        </Typography>
                        <Typography>
                          <Typography as="span" isBold>
                            Description:
                          </Typography>{" "}
                          {garden.description || "-"}
                        </Typography>
                        <Typography>
                          <Typography as="span" isBold>
                            Seating capacity:
                          </Typography>{" "}
                          {garden.seatingCapacity ?? "-"}
                        </Typography>
                        <Typography>
                          <Typography as="span" isBold>
                            Sun exposure:
                          </Typography>{" "}
                          {garden.sunExposure || "-"}
                        </Typography>
                        <Typography>
                          <Typography as="span" isBold>
                            Covered:
                          </Typography>{" "}
                          {garden.isCovered ? "Yes" : "No"}
                        </Typography>
                        <Typography>
                          <Typography as="span" isBold>
                            Heated:
                          </Typography>{" "}
                          {garden.isHeated ? "Yes" : "No"}
                        </Typography>
                        <Typography>
                          <Typography as="span" isBold>
                            Family friendly:
                          </Typography>{" "}
                          {garden.isFamilyFriendly ? "Yes" : "No"}
                        </Typography>
                        <Typography>
                          <Typography as="span" isBold>
                            Pet friendly:
                          </Typography>{" "}
                          {garden.petFriendly ? "Yes" : "No"}
                        </Typography>
                        <Typography>
                          <Typography as="span" isBold>
                            Image:
                          </Typography>{" "}
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
                        </Typography>
                        <Typography>
                          <Typography as="span" isBold>
                            Notes:
                          </Typography>{" "}
                          {garden.notes || "-"}
                        </Typography>
                        <Typography>
                          <Typography as="span" isBold>
                            Opening Hours:
                          </Typography>
                          {garden.openingHours ? (
                            <div className={styles.openingHoursDisplay}>
                              {renderOpeningHours(garden.openingHours)}
                            </div>
                          ) : (
                            " -"
                          )}
                        </Typography>
                      </div>
                    ))}
                  </div>
                ) : (
                  " -"
                )}
              </div>
              <Typography>
                <Typography as="span" isBold>
                  Latitude:
                </Typography>{" "}
                {pub.lat}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Longitude:
                </Typography>{" "}
                {pub.lng}
              </Typography>
              <Typography>
                <Typography as="span" isBold>
                  Created At:
                </Typography>{" "}
                {new Date(pub.createdAt).toLocaleString()}
              </Typography>
            </>
          )}
        </>
      ) : (
        <Typography>Pub not found</Typography>
      )}
    </>
  );
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
  if (cleaned.id?.startsWith("temp-")) {
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
  const [deleteMessage, setDeleteMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const apiUrl = API_URL;
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
      <div className={styles.editButtonMessage}>
        <a href="/register">Log in to edit this pub</a>
      </div>
    );
  }
  if (!user.approved) {
    return (
      <div className={styles.editButtonMessage}>
        <Typography>Your account is not approved for editing.</Typography>
        <Typography>
          Please email{" "}
          <a href="mailto:hello@thepubdb.com">hello@thepubdb.com</a> to request
          approval.
        </Typography>
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
      const apiUrl = API_URL;
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/pubs/${pubId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });
      if (!res.ok) {
        const data = await res.json();
        setDeleteMessage({
          type: "error",
          text: data.error || "Failed to delete pub",
        });
      } else {
        setDeleteMessage({ type: "success", text: "Pub deleted successfully" });
        window.location.href = "/pubs";
      }
    } catch (_err) {
      setDeleteMessage({ type: "error", text: "Network error" });
    }
  }

  return (
    <div>
      {deleteMessage && (
        <Typography
          className={
            deleteMessage.type === "success"
              ? styles.deleteMessageSuccess
              : styles.deleteMessageError
          }
        >
          {deleteMessage.text}
        </Typography>
      )}
      <Button onClick={onEdit}>Edit this pub</Button>
      {user?.admin && (
        <Button variant="red" onClick={handleDelete}>
          Delete this pub
        </Button>
      )}
    </div>
  );
}

function renderOpeningHours(ohAny: unknown) {
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
    } catch (_e) {
      oh = null;
    }
  } else if (ohAny && typeof ohAny === "object") {
    oh = ohAny as Record<
      string,
      { open?: string; close?: string; closed?: boolean }
    >;
  }

  if (!oh) {
    return (
      <div>
        {weekdays.map((day) => (
          <Typography key={day}>
            <Typography as="span" isBold>
              {day}:
            </Typography>{" "}
            -
          </Typography>
        ))}
      </div>
    );
  }

  // Build case-insensitive map for lookup (handles "monday" or "Monday").
  const map: Record<
    string,
    { open?: string; close?: string; closed?: boolean }
  > = {};
  Object.entries(oh).forEach(([k, v]) => {
    map[k.toLowerCase()] = v;
  });

  return (
    <div>
      {weekdays.map((day) => {
        const entry = map[day.toLowerCase()];
        if (!entry) {
          return (
            <Typography key={day}>
              <Typography as="span" isBold>
                {day}:
              </Typography>{" "}
              -
            </Typography>
          );
        }
        if (entry.closed) {
          return (
            <Typography key={day}>
              <Typography as="span" isBold>
                {day}:
              </Typography>{" "}
              Closed
            </Typography>
          );
        }
        const open = entry.open || "-";
        const close = entry.close || "-";
        return (
          <Typography key={day}>
            <Typography as="span" isBold>
              {day}:
            </Typography>{" "}
            {open} – {close}
          </Typography>
        );
      })}
    </div>
  );
}
