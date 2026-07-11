"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthGate from "@/app/components/auth-gate/AuthGate";
import FieldErrorList from "@/app/components/pub-form/FieldErrorList";
import OpeningHoursEditor from "@/app/features/opening-hours/opening-hours-editor";
import { PUB_AMENITY_FIELDS, type PubAmenityKey } from "@/constants/pubFormFields";
import { useCountries } from "@/hooks/useCountries";
import { buildAuthHeaders } from "@/lib/auth";
import type { OpeningHoursMap } from "@/types/pub";
import styles from "./page.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldErrors = Record<string, string[]>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringArray(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((i): i is string => typeof i === "string");
  return [];
}

function parseApiValidationErrors(data: unknown): { formErrors: string[]; fieldErrors: FieldErrors } {
  const rootPayload = isRecord(data) ? data : {};
  const candidates: Record<string, unknown>[] = [rootPayload];
  if (isRecord(rootPayload.error)) candidates.push(rootPayload.error);
  if (isRecord(rootPayload.errors)) candidates.push(rootPayload.errors);

  const formErrors: string[] = [];
  const fieldErrors: FieldErrors = {};

  for (const payload of candidates) {
    const local = toStringArray(payload.formErrors);
    if (local.length > 0) formErrors.push(...local);
    if (isRecord(payload.fieldErrors)) {
      for (const [field, value] of Object.entries(payload.fieldErrors)) {
        const msgs = toStringArray(value);
        if (msgs.length > 0) fieldErrors[field] = [...(fieldErrors[field] ?? []), ...msgs];
      }
    }
  }

  const fallback = [...toStringArray(rootPayload.error), ...toStringArray(rootPayload.errors)];
  if (formErrors.length === 0 && fallback.length > 0) formErrors.push(...fallback);
  return { formErrors, fieldErrors };
}

// Amenity icon map
const AMENITY_ICONS: Partial<Record<PubAmenityKey, React.ReactNode>> = {
  hasFood: <FoodIcon />,
  hasSundayRoast: <RoastIcon />,
  hasBeerGarden: <GardenIcon />,
  hasCaskAle: <CaskIcon />,
  isBeerFocused: <BeerIcon />,
  isDogFriendly: <DogIcon />,
  isFamilyFriendly: <FamilyIcon />,
  hasLiveSport: <SportIcon />,
  hasLiveMusic: <MusicIcon />,
  hasPoolTable: <CheckIcon />,
  hasDartsBoard: <CheckIcon />,
  hasStepFreeAccess: <CheckIcon />,
  hasAccessibleToilet: <CheckIcon />,
};

// Design labels (override defaults for cleaner display)
const AMENITY_LABELS: Partial<Record<PubAmenityKey, string>> = {
  hasFood: "Food",
  hasSundayRoast: "Sunday roast",
  hasBeerGarden: "Beer garden",
  hasCaskAle: "Cask ale",
  isBeerFocused: "Beer-focused",
  isDogFriendly: "Dog friendly",
  isFamilyFriendly: "Family friendly",
  hasLiveSport: "Live sport",
  hasLiveMusic: "Live music",
  hasPoolTable: "Pool Table",
  hasDartsBoard: "Darts Board",
  hasStepFreeAccess: "Step Free Access",
  hasAccessibleToilet: "Accessible Toilet",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AddPubPage() {
  const router = useRouter();

  // Core fields
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("GB");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [area, setArea] = useState("");
  const [borough, setBorough] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [chainName, setChainName] = useState("");
  const [operator, setOperator] = useState("");

  // Ownership toggle — maps to isIndependent amenity
  const [isIndependent, setIsIndependent] = useState(true);

  // Amenities (excludes isIndependent, handled by toggle)
  const [amenities, setAmenities] = useState<Partial<Record<PubAmenityKey, boolean>>>({});
  const [openingHours, setOpeningHours] = useState<OpeningHoursMap | undefined>(undefined);
  const [hoursOpen, setHoursOpen] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [editLink, setEditLink] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; approved?: boolean } | null>(null);

  const { countries, countriesLoading, countriesError } = useCountries();

  const approvalMailto = `mailto:hello@thepubdb.com?subject=${encodeURIComponent(
    "Approval request for PubDB editor access"
  )}&body=${encodeURIComponent(
    `Hi PubDB team,\n\nPlease approve my account for editing pubs.\n\nAccount email: ${user?.email ?? "Unknown"}\n\nThanks!`
  )}`;

  useEffect(() => {
    async function checkAuth(): Promise<void> {
      const token = localStorage.getItem("token");
      if (!token) { setUser(null); return; }
      try {
        const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const d = await res.json(); setUser({ email: d.email, approved: d.approved }); }
        else setUser(null);
      } catch { setUser(null); }
    }
    checkAuth();
    window.addEventListener("authChanged", checkAuth);
    window.addEventListener("storage", checkAuth);
    return () => { window.removeEventListener("authChanged", checkAuth); window.removeEventListener("storage", checkAuth); };
  }, []);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true); setError(null); setFormErrors([]); setFieldErrors({}); setSuccess(null); setEditLink(null);
    try {
      const token = localStorage.getItem("token");
      const body: Record<string, unknown> = {
        name, city, country, address, postcode,
        area: area || undefined,
        borough: borough || undefined,
        website: website || undefined,
        phone: phone || undefined,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        chainName: (!isIndependent && chainName) ? chainName : undefined,
        operator: operator || undefined,
        openingHours,
        isIndependent,
        ...amenities,
      };
      const res = await fetch("/api/pubs", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders(token) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const { formErrors: fe, fieldErrors: fle } = parseApiValidationErrors(data);
        setFormErrors(fe); setFieldErrors(fle);
        if (res.status === 409 && data?.id) {
          setEditLink(`/pubs/${data.id}`);
          if (fe.length === 0) setError("Pub already exists");
        } else if (fe.length === 0 && Object.keys(fle).length === 0) {
          setError("Unknown error");
        }
      } else {
        setSuccess("Pub submitted for review!");
        setTimeout(() => router.push(`/pubs/${data.id}`), 1000);
      }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  // Auth gates
  if (!user) {
    return <AuthGate context="Add pub" />;
  }

  if (!user.approved) {
    return (
      <div className={styles.page}>
        <div className={styles.gateCard}>
          <p className={styles.gateText}>Your account isn't approved for editing yet.</p>
          <a href={approvalMailto} className={styles.gateLink}>Request approval by email</a>
        </div>
      </div>
    );
  }

  const amenityFields = PUB_AMENITY_FIELDS.filter((f) => f.key !== "isIndependent");

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Add pub</h1>
            <span className={styles.endpointBadge}>POST /v1/pubs</span>
          </div>
          <p className={styles.description}>
            Submit a new pub to the directory. It'll go through moderation before appearing in search results.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.push("/pubs")}>
            × Cancel
          </button>
          <button
            type="submit"
            form="add-pub-form"
            className={styles.submitBtn}
            disabled={loading}
          >
            ✓ {loading ? "Submitting…" : "Submit pub"}
          </button>
        </div>
      </div>

      <form id="add-pub-form" onSubmit={handleSubmit} autoComplete="off" className={styles.form}>
        {/* ── Basic information ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}><HouseIcon /></span>
            <div>
              <h2 className={styles.sectionTitle}>Basic information</h2>
              <p className={styles.sectionDesc}>The pub's name and contact details. Only the name is required.</p>
            </div>
          </div>

          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="name">
              Pub name <span className={styles.req}>*</span>
            </label>
            <input
              id="name"
              name="pub-name"
              className={`${styles.textInput} ${fieldErrors.name ? styles.inputError : ""}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Crown & Anchor"
              required
              autoComplete="off"
            />
            <FieldErrorList errors={fieldErrors.name} className={styles.errorText} idPrefix="name" />
          </div>

          <div className={styles.fieldBlock}>
            <fieldset className={styles.ownershipGroup}>
              <legend className={styles.fieldLabel}>Ownership</legend>
              <div className={styles.ownershipToggle}>
                <button
                  type="button"
                  className={`${styles.ownershipBtn} ${isIndependent ? styles.ownershipBtnActive : ""}`}
                  aria-pressed={isIndependent}
                  onClick={() => setIsIndependent(true)}
                >
                  <IndependentIcon /> Independent
                </button>
                <button
                  type="button"
                  className={`${styles.ownershipBtn} ${!isIndependent ? styles.ownershipBtnActive : ""}`}
                  aria-pressed={!isIndependent}
                  onClick={() => setIsIndependent(false)}
                >
                  <ChainIcon /> Chain
                </button>
              </div>
            </fieldset>
          </div>

          {!isIndependent && (
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor="chainName">Chain name</label>
              <input
                id="chainName"
                className={styles.textInput}
                type="text"
                value={chainName}
                onChange={(e) => setChainName(e.target.value)}
                placeholder="e.g. Wetherspoons"
              />
            </div>
          )}

          <div className={styles.fieldGrid2}>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor="website">Website</label>
              <input
                id="website"
                className={styles.textInput}
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
              <FieldErrorList errors={fieldErrors.website} className={styles.errorText} idPrefix="website" />
            </div>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor="phone">Phone</label>
              <input
                id="phone"
                className={styles.textInput}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 20 7946 0958"
                autoComplete="off"
              />
              <FieldErrorList errors={fieldErrors.phone} className={styles.errorText} idPrefix="phone" />
            </div>
          </div>

          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="description">Description <span className={styles.optLabel}>(optional)</span></label>
            <textarea
              id="description"
              className={styles.textarea}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of the pub…"
            />
          </div>

          <div className={styles.fieldGrid2}>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor="imageUrl">Image URL <span className={styles.optLabel}>(optional)</span></label>
              <input
                id="imageUrl"
                className={styles.textInput}
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor="operator">Operator / Owner <span className={styles.optLabel}>(optional)</span></label>
              <input
                id="operator"
                className={styles.textInput}
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="e.g. Greene King"
              />
            </div>
          </div>
        </div>

        {/* ── Location ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}><PinIcon /></span>
            <div>
              <h2 className={styles.sectionTitle}>Location</h2>
              <p className={styles.sectionDesc}>We'll geocode the address automatically for map placement.</p>
            </div>
          </div>

          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="address">
              Street address <span className={styles.req}>*</span>
            </label>
            <input
              id="address"
              name="pub-address"
              className={`${styles.textInput} ${fieldErrors.address ? styles.inputError : ""}`}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 44 Dean Street"
              required
              autoComplete="off"
            />
            <FieldErrorList errors={fieldErrors.address} className={styles.errorText} idPrefix="address" />
          </div>

          <div className={styles.fieldGrid2}>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor="city">
                City <span className={styles.req}>*</span>
              </label>
              <input
                id="city"
                name="pub-city"
                className={`${styles.textInput} ${fieldErrors.city ? styles.inputError : ""}`}
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. London"
                required
                autoComplete="off"
              />
              <FieldErrorList errors={fieldErrors.city} className={styles.errorText} idPrefix="city" />
            </div>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor="area">Area / neighbourhood</label>
              <input
                id="area"
                className={styles.textInput}
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Soho"
                autoComplete="off"
              />
            </div>
          </div>

          <div className={styles.fieldGrid2}>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor="postcode">
                Postcode <span className={styles.req}>*</span>
              </label>
              <input
                id="postcode"
                name="pub-postcode"
                className={`${styles.textInput} ${fieldErrors.postcode ? styles.inputError : ""}`}
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g. W1D 4PX"
                required
                autoComplete="off"
              />
              <FieldErrorList errors={fieldErrors.postcode} className={styles.errorText} idPrefix="postcode" />
            </div>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor="country">Country</label>
              <select
                id="country"
                name="pub-country"
                className={styles.selectInput}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={!!countriesError}
              >
                <option value="">
                  {countriesLoading ? "Loading…" : countriesError ? "Failed to load" : "Select country"}
                </option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <FieldErrorList errors={fieldErrors.country} className={styles.errorText} idPrefix="country" />
            </div>
          </div>

          <div className={styles.fieldGrid2}>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor="borough">Borough <span className={styles.optLabel}>(optional)</span></label>
              <input
                id="borough"
                className={styles.textInput}
                type="text"
                value={borough}
                onChange={(e) => setBorough(e.target.value)}
                placeholder="e.g. Westminster"
              />
            </div>
            <div />
          </div>
        </div>

        {/* ── Amenities ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}><AmenitiesIcon /></span>
            <div>
              <h2 className={styles.sectionTitle}>Amenities</h2>
              <p className={styles.sectionDesc}>Select everything that applies — these power the browse page filters.</p>
            </div>
          </div>

          <div className={styles.amenitiesGrid}>
            {amenityFields.map((field) => {
              const checked = amenities[field.key] ?? false;
              const label = AMENITY_LABELS[field.key] ?? field.label;
              const icon = AMENITY_ICONS[field.key];
              return (
                <label key={field.key} className={`${styles.amenityCard} ${checked ? styles.amenityCardChecked : ""}`}>
                  <span className={styles.amenityCardIcon}>{icon}</span>
                  <span className={styles.amenityCardLabel}>{label}</span>
                  <span className={`${styles.amenityCardCheck} ${checked ? styles.amenityCardCheckOn : ""}`} />
                  <input
                    type="checkbox"
                    className={styles.amenityHiddenInput}
                    checked={checked}
                    onChange={(e) => setAmenities((prev) => ({ ...prev, [field.key]: e.target.checked }))}
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Opening hours ── */}
        <div className={styles.section}>
          <button
            type="button"
            className={styles.sectionHead}
            onClick={() => setHoursOpen((o) => !o)}
            aria-expanded={hoursOpen}
            aria-controls="opening-hours-body"
          >
            <span className={styles.sectionIcon}><ClockIcon /></span>
            <div className={styles.sectionHeadText}>
              <h2 className={styles.sectionTitle}>Opening hours</h2>
              <p className={styles.sectionDesc}>Optional — set the pub's regular weekly schedule.</p>
            </div>
            <span className={`${styles.chevron} ${hoursOpen ? styles.chevronOpen : ""}`}>↓</span>
          </button>
          {hoursOpen && (
            <div id="opening-hours-body" className={styles.openingHoursBody}>
              <OpeningHoursEditor value={openingHours} onChange={(val) => setOpeningHours(val)} />
              <FieldErrorList errors={fieldErrors.openingHours} className={styles.errorText} idPrefix="openingHours" />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className={styles.formFooter}>
          <p className={styles.requiredNote}>* = required field</p>
          <div className={styles.footerActions}>
            {(formErrors.length > 0 || error) && (
              <div className={styles.errorSummary}>
                {formErrors.map((e) => <p key={e} className={styles.errorText}>{e}</p>)}
                {error && <p className={styles.errorText}>{error}</p>}
              </div>
            )}
            {editLink && (
              <button type="button" className={styles.editLinkBtn} onClick={() => router.push(editLink)}>
                Open existing pub →
              </button>
            )}
            {success && <p className={styles.successText}>{success}</p>}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              ✓ {loading ? "Submitting…" : "Submit pub"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function HouseIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 7L7 1.5 13 7v6H9v-3.5H5V13H1V7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>;
}
function PinIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1a4 4 0 014 4c0 3-4 8-4 8S3 8 3 5a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.2" /><circle cx="7" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2" /></svg>;
}
function AmenitiesIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" /></svg>;
}
function ClockIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" /><path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>;
}
function IndependentIcon() {
  return <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 7L7 1.5 13 7v6H9v-3.5H5V13H1V7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>;
}
function ChainIcon() {
  return <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5 7a2 2 0 002 2h4a2 2 0 000-4H9M9 7a2 2 0 00-2-2H3a2 2 0 000 4h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
}
function FoodIcon() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5 1v4M5 7v6M9 1c0 0 0 4-2 4s-2 0-2 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><path d="M10 1v12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>;
}
function RoastIcon() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 10c0-2.761 2.239-5 5-5s5 2.239 5 5H2z" stroke="currentColor" strokeWidth="1.2" /><path d="M7 5V3M5 3h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>;
}
function GardenIcon() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 13V7M7 7C7 4 4 2 1 3c2 1 4 3 4 5M7 7c0-3 3-5 6-4-2 1-4 3-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>;
}
function CaskIcon() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="2" y="4" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.2" /><path d="M5 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.2" /><path d="M5 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>;
}
function BeerIcon() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M4 2h6l1 9H3L4 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M4 5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>;
}
function DogIcon() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2l2 2-1 1 1 3-2 1v3H5V9L3 8l1-3-1-1 2-2h4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>;
}
function FamilyIcon() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="5" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="10" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M2 13v-3a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><path d="M8 13v-2a2 2 0 014 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>;
}
function SportIcon() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="1" y="2" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M5 13h4M7 10v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>;
}
function MusicIcon() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5 10V3l7-1.5V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="3.5" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="10.5" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.2" /></svg>;
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
