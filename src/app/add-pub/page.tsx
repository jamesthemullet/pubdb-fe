"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/components/input/Input";
import Textarea from "@/app/components/textarea/Textarea";
import Button from "@/app/components/button/button";
import Typography from "@/app/components/typography/typography";
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
  const [operator, setOperator] = useState<string | undefined>(undefined);
  const [area, setArea] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [borough, setBorough] = useState<string | undefined>(undefined);
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
  const [countries, setCountries] = useState<{ name: string; code: string }[]>(
    []
  );
  const [countriesLoading, setCountriesLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
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
            .map((countryOption) => ({
              name: countryOption.name.common,
              code: countryOption.cca2,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFormErrors([]);
    setFieldErrors({});
    setSuccess(null);
    setEditLink(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const token = localStorage.getItem("token");
      const body: any = {
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
        operator,
        area,
        phone,
        borough,
        openingHours,
      };
      const res = await fetch(`${apiUrl}/pubs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    } catch (err) {
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
          <a href="/register">Register or Login</a>
        </div>
      ) : !user.approved ? (
        <div>
          <Typography variant="bodyMedium">
            Your account is not approved for editing - all accounts need to be
            manually approved.
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
            <div>
              <label htmlFor="name">
                Name: <span className={styles.requiredAsterisk}>*</span>
              </label>
              <Input
                id="name"
                name="pub-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="pub-name"
                placeholder="Enter pub name"
              />
              {fieldErrors.name?.map((fieldError, index) => (
                <Typography
                  key={`name-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
            </div>
            <div>
              <label htmlFor="city">
                City: <span className={styles.requiredAsterisk}>*</span>
              </label>
              <Input
                id="city"
                name="pub-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                autoComplete="pub-city"
                placeholder="Enter city"
              />
              {fieldErrors.city?.map((fieldError, index) => (
                <Typography
                  key={`city-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
            </div>
            <div>
              <label htmlFor="country">
                Country: <span className={styles.requiredAsterisk}>*</span>
              </label>
              <select
                id="country"
                name="pub-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              >
                <option value="">
                  {countriesLoading && countries.length === 0
                    ? "Loading countries..."
                    : "Select a country"}
                </option>
                {countries.map((countryOption) => (
                  <option key={countryOption.code} value={countryOption.code}>
                    {countryOption.name}
                  </option>
                ))}
              </select>
              {fieldErrors.country?.map((fieldError, index) => (
                <Typography
                  key={`country-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
            </div>
            <div>
              <label htmlFor="address">
                Address: <span className={styles.requiredAsterisk}>*</span>
              </label>
              <Input
                id="address"
                name="pub-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                autoComplete="pub-address"
                placeholder="Enter address"
              />
              {fieldErrors.address?.map((fieldError, index) => (
                <Typography
                  key={`address-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
            </div>
            <div>
              <label htmlFor="postcode">
                Postcode: <span className={styles.requiredAsterisk}>*</span>
              </label>
              <Input
                id="postcode"
                name="pub-postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                required
                autoComplete="pub-postcode"
                placeholder="Enter postcode"
              />
              {fieldErrors.postcode?.map((fieldError, index) => (
                <Typography
                  key={`postcode-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
            </div>
            <div>
              <label htmlFor="lat">Latitude:</label>
              <Input
                id="lat"
                name="lat"
                value={lat ?? ""}
                onChange={(e) =>
                  setLat(
                    e.target.value === ""
                      ? undefined
                      : parseFloat(e.target.value)
                  )
                }
                type="number"
                step="any"
              />
              {fieldErrors.lat?.map((fieldError, index) => (
                <Typography
                  key={`lat-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
            </div>
            <div>
              <label htmlFor="lng">Longitude:</label>
              <Input
                id="lng"
                name="lng"
                value={lng ?? ""}
                onChange={(e) =>
                  setLng(
                    e.target.value === ""
                      ? undefined
                      : parseFloat(e.target.value)
                  )
                }
                type="number"
                step="any"
              />
              {fieldErrors.lng?.map((fieldError, index) => (
                <Typography
                  key={`lng-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
            </div>
            <div>
              <label htmlFor="website">Website:</label>
              <Input
                id="website"
                name="website"
                value={website ?? ""}
                onChange={(e) => setWebsite(e.target.value || undefined)}
              />
              {fieldErrors.website?.map((fieldError, index) => (
                <Typography
                  key={`website-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
            </div>
            <div>
              <label htmlFor="description">Description:</label>
              <Textarea
                id="description"
                name="description"
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value || undefined)}
              />
              {fieldErrors.description?.map((fieldError, index) => (
                <Typography
                  key={`description-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
            </div>
            <div>
              <label htmlFor="imageUrl">Image URL:</label>
              <Input
                id="imageUrl"
                name="imageUrl"
                value={imageUrl ?? ""}
                onChange={(e) => setImageUrl(e.target.value || undefined)}
              />
              {fieldErrors.imageUrl?.map((fieldError, index) => (
                <Typography
                  key={`imageUrl-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
            </div>
            <div>
              <label htmlFor="operator">Operator/Owner:</label>
              <Input
                id="operator"
                name="operator"
                value={operator ?? ""}
                onChange={(e) => setOperator(e.target.value || undefined)}
              />
              {fieldErrors.operator?.map((fieldError, index) => (
                <Typography
                  key={`operator-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
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
              {fieldErrors.area?.map((fieldError, index) => (
                <Typography
                  key={`area-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
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
              {fieldErrors.phone?.map((fieldError, index) => (
                <Typography
                  key={`phone-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
            </div>
            <div>
              <label htmlFor="borough">Borough:</label>
              <Input
                id="borough"
                name="borough"
                value={borough ?? ""}
                onChange={(e) => setBorough(e.target.value || undefined)}
              />
              {fieldErrors.borough?.map((fieldError, index) => (
                <Typography
                  key={`borough-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
            </div>
            <div>
              <label htmlFor="openingHours">Opening Hours:</label>
              <Input
                id="openingHours"
                name="openingHours"
                value={openingHours ?? ""}
                onChange={(e) => setOpeningHours(e.target.value || undefined)}
              />
              {fieldErrors.openingHours?.map((fieldError, index) => (
                <Typography
                  key={`openingHours-error-${index}`}
                  variant="bodySmall"
                  className={styles.errorText}
                >
                  {fieldError}
                </Typography>
              ))}
            </div>
            <Button type="submit" disabled={loading}>
              <Typography as="span" variant="bodySmall">
                {loading ? "Submitting..." : "Add Pub"}
              </Typography>
            </Button>
            {(formErrors.length > 0 || error || editLink) && (
              <div className={styles.feedbackPanel}>
                {!editLink &&
                  formErrors.map((formError, index) => (
                    <Typography
                      key={`form-error-${index}`}
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
