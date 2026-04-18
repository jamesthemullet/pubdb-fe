"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/app/components/button/button";
import Input from "@/app/components/input/Input";
import FieldErrorList from "@/app/components/pub-form/FieldErrorList";
import PubAmenitiesFields from "@/app/components/pub-form/PubAmenitiesFields";
import PubCoreIdentityFields from "@/app/components/pub-form/PubCoreIdentityFields";
import Textarea from "@/app/components/textarea/Textarea";
import Typography from "@/app/components/typography/typography";
import type { PubAmenityKey } from "@/constants/pubFormFields";
import { useCountries } from "@/hooks/useCountries";
import { API_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/auth";
import styles from "./page.module.css";

type FieldErrors = Record<string, string[]>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

function parseApiValidationErrors(data: unknown): {
  formErrors: string[];
  fieldErrors: FieldErrors;
} {
  const rootPayload = isRecord(data) ? data : {};
  const candidates: Record<string, unknown>[] = [rootPayload];

  if (isRecord(rootPayload.error)) {
    candidates.push(rootPayload.error);
  }

  if (isRecord(rootPayload.errors)) {
    candidates.push(rootPayload.errors);
  }

  const formErrors: string[] = [];
  const fieldErrors: FieldErrors = {};

  for (const payload of candidates) {
    const localFormErrors = toStringArray(payload.formErrors);
    if (localFormErrors.length > 0) {
      formErrors.push(...localFormErrors);
    }

    if (isRecord(payload.fieldErrors)) {
      for (const [field, value] of Object.entries(payload.fieldErrors)) {
        const messages = toStringArray(value);
        if (messages.length > 0) {
          fieldErrors[field] = [...(fieldErrors[field] ?? []), ...messages];
        }
      }
    }
  }

  const fallbackMessages = [
    ...toStringArray(rootPayload.error),
    ...toStringArray(rootPayload.errors),
  ];

  if (formErrors.length === 0 && fallbackMessages.length > 0) {
    formErrors.push(...fallbackMessages);
  }

  return { formErrors, fieldErrors };
}

const AddPubPage = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [website, setWebsite] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [chainName, setChainName] = useState<string | undefined>(undefined);
  const [operator, setOperator] = useState<string | undefined>(undefined);
  const [area, setArea] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [borough, setBorough] = useState<string | undefined>(undefined);
  const [amenities, setAmenities] = useState<
    Partial<Record<PubAmenityKey, boolean>>
  >({});
  const [openingHours, setOpeningHours] = useState<string | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [editLink, setEditLink] = useState<string | null>(null);

  const [user, setUser] = useState<{
    email: string;
    approved?: boolean;
  } | null>(null);
  const { countries, countriesLoading, countriesError } = useCountries();

  const approvalRequestMailto = `mailto:hello@thepubdb.com?subject=${encodeURIComponent(
    "Approval request for PubDB editor access"
  )}&body=${encodeURIComponent(
    `Hi PubDB team,\n\nPlease approve my account for editing pubs.\n\nAccount email: ${
      user?.email ?? "Unknown"
    }\n\nThanks!`
  )}`;

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const apiUrl = API_URL;
          const res = await fetch(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser({ email: data.email, approved: data.approved });
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    checkAuth();
    window.addEventListener("authChanged", checkAuth);
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("authChanged", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFormErrors([]);
    setFieldErrors({});
    setSuccess(null);
    setEditLink(null);
    try {
      const apiUrl = API_URL;
      const token = localStorage.getItem("token");
      const body: Record<string, unknown> = {
        name,
        city,
        country,
        address,
        postcode,
        lat,
        lng,
        website,
        description,
        imageUrl,
        chainName,
        operator,
        area,
        phone,
        borough,
        openingHours,
        ...amenities,
      };
      const res = await fetch(`${apiUrl}/pubs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        const { formErrors: nextFormErrors, fieldErrors: nextFieldErrors } =
          parseApiValidationErrors(data);

        setFormErrors(nextFormErrors);
        setFieldErrors(nextFieldErrors);

        if (res.status === 409 && data && data.id) {
          setEditLink(`/pubs/${data.id}`);
          if (nextFormErrors.length === 0) {
            setError("Pub already exists");
          }
        } else {
          const hasFieldErrors = Object.keys(nextFieldErrors).length > 0;
          if (nextFormErrors.length === 0 && !hasFieldErrors) {
            setError("Unknown error");
          }
        }
      } else {
        setEditLink(null);
        setFormErrors([]);
        setFieldErrors({});
        setSuccess("Pub added successfully!");
        setTimeout(() => {
          router.push(`/pubs/${data.id}`);
        }, 1000);
      }
    } catch (_err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography variant="headingMedium">Add a Pub</Typography>

      {!user ? (
        <div>
          <Typography variant="bodyMedium">
            You must be logged in to add a pub.
          </Typography>
          <Link href="/register">Register or Login</Link>
        </div>
      ) : !user.approved ? (
        <div>
          <Typography variant="bodyMedium">
            Your account is not approved for editing - all accounts need to be
            manually approved.
          </Typography>
          <Typography variant="bodyMedium">
            <a href={approvalRequestMailto}>Request approval by email</a>
          </Typography>
          <Typography variant="bodyMedium">
            Please email{" "}
            <a href="mailto:hello@thepubdb.com">hello@thepubdb.com</a> to
            request approval.
          </Typography>
        </div>
      ) : (
        <>
          <Typography variant="bodyMedium">
            Please fill out the form below to add a pub to the database.
          </Typography>
          <form onSubmit={handleSubmit} autoComplete="off">
            <PubCoreIdentityFields
              values={{
                name,
                city,
                country,
                address,
                postcode,
                lat,
                lng,
              }}
              onFieldChange={(field, value) => {
                switch (field) {
                  case "name": setName(value as string); break;
                  case "city": setCity(value as string); break;
                  case "country": setCountry(value as string); break;
                  case "address": setAddress(value as string); break;
                  case "postcode": setPostcode(value as string); break;
                  case "lat": setLat(value as number | undefined); break;
                  default: setLng(value as number | undefined);
                }
              }}
              countries={countries}
              countriesLoading={countriesLoading}
              countriesError={countriesError}
              fieldErrors={{
                name: fieldErrors.name,
                city: fieldErrors.city,
                country: fieldErrors.country,
                address: fieldErrors.address,
                postcode: fieldErrors.postcode,
                lat: fieldErrors.lat,
                lng: fieldErrors.lng,
              }}
              requiredAsteriskClassName={styles.requiredAsterisk}
              errorClassName={styles.errorText}
              showPlaceholders
            />
            <div>
              <label htmlFor="website">Website:</label>
              <Input
                id="website"
                name="website"
                value={website ?? ""}
                onChange={(e) => setWebsite(e.target.value || undefined)}
              />
              <FieldErrorList
                errors={fieldErrors.website}
                className={styles.errorText}
                idPrefix="website"
              />
            </div>
            <div>
              <label htmlFor="description">Description:</label>
              <Textarea
                id="description"
                name="description"
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value || undefined)}
              />
              <FieldErrorList
                errors={fieldErrors.description}
                className={styles.errorText}
                idPrefix="description"
              />
            </div>
            <div>
              <label htmlFor="imageUrl">Image URL:</label>
              <Input
                id="imageUrl"
                name="imageUrl"
                value={imageUrl ?? ""}
                onChange={(e) => setImageUrl(e.target.value || undefined)}
              />
              <FieldErrorList
                errors={fieldErrors.imageUrl}
                className={styles.errorText}
                idPrefix="imageUrl"
              />
            </div>
            <details className={styles.advancedSection}>
              <summary className={styles.advancedSummary}>
                Advanced details (optional)
              </summary>
              <div className={styles.advancedContent}>
                <div>
                  <label htmlFor="chainName">Chain name:</label>
                  <Input
                    id="chainName"
                    name="chainName"
                    value={chainName ?? ""}
                    onChange={(e) => setChainName(e.target.value || undefined)}
                  />
                  <FieldErrorList
                    errors={fieldErrors.chainName}
                    className={styles.errorText}
                    idPrefix="chainName"
                  />
                </div>
                <PubAmenitiesFields
                  values={amenities}
                  onChange={(key, checked) =>
                    setAmenities((prev) => ({
                      ...prev,
                      [key]: checked,
                    }))
                  }
                  containerClassName={styles.amenitiesGrid}
                  labelClassName={styles.amenityLabel}
                  idPrefix="amenity"
                />
              </div>
            </details>
            <div>
              <label htmlFor="operator">Operator/Owner:</label>
              <Input
                id="operator"
                name="operator"
                value={operator ?? ""}
                onChange={(e) => setOperator(e.target.value || undefined)}
              />
              <FieldErrorList
                errors={fieldErrors.operator}
                className={styles.errorText}
                idPrefix="operator"
              />
            </div>
            <div>
              <label htmlFor="area">Area:</label>
              <Input
                id="area"
                name="area"
                value={area ?? ""}
                onChange={(e) => setArea(e.target.value || undefined)}
                autoComplete="pub-area"
              />
              <FieldErrorList
                errors={fieldErrors.area}
                className={styles.errorText}
                idPrefix="area"
              />
            </div>
            <div>
              <label htmlFor="phone">Phone:</label>
              <Input
                id="phone"
                name="phone"
                value={phone ?? ""}
                onChange={(e) => setPhone(e.target.value || undefined)}
                autoComplete="pub-phone"
              />
              <FieldErrorList
                errors={fieldErrors.phone}
                className={styles.errorText}
                idPrefix="phone"
              />
            </div>
            <div>
              <label htmlFor="borough">Borough:</label>
              <Input
                id="borough"
                name="borough"
                value={borough ?? ""}
                onChange={(e) => setBorough(e.target.value || undefined)}
              />
              <FieldErrorList
                errors={fieldErrors.borough}
                className={styles.errorText}
                idPrefix="borough"
              />
            </div>
            <div>
              <label htmlFor="openingHours">Opening Hours:</label>
              <Input
                id="openingHours"
                name="openingHours"
                value={openingHours ?? ""}
                onChange={(e) => setOpeningHours(e.target.value || undefined)}
              />
              <FieldErrorList
                errors={fieldErrors.openingHours}
                className={styles.errorText}
                idPrefix="openingHours"
              />
            </div>
            <Button type="submit" disabled={loading} aria-busy={loading}>
              <Typography as="span" variant="bodySmall">
                {loading ? "Submitting..." : "Add Pub"}
              </Typography>
            </Button>
            {(formErrors.length > 0 || error || editLink) && (
              <div className={styles.feedbackPanel}>
                {!editLink &&
                  formErrors.map((formError) => (
                    <Typography
                      key={`form-error-${formError}`}
                      variant="bodySmall"
                      className={styles.errorText}
                    >
                      {formError}
                    </Typography>
                  ))}
                {error && (
                  <Typography variant="bodySmall" className={styles.errorText}>
                    {error}
                  </Typography>
                )}
                {editLink && (
                  <div className={styles.editLinkContainer}>
                    <Typography
                      variant="bodySmall"
                      className={styles.editLinkLead}
                    >
                      A matching pub already exists.
                    </Typography>
                    <Button
                      type="button"
                      className={styles.editLinkAction}
                      onClick={() => router.push(editLink)}
                    >
                      <Typography as="span" variant="bodySmall">
                        Open existing pub to edit
                      </Typography>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </form>
        </>
      )}
      {success && <Typography variant="bodyMedium">{success}</Typography>}
    </>
  );
};

export default AddPubPage;
