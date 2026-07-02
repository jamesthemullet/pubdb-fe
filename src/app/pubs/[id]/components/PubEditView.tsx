"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import FieldErrorList from "@/app/components/pub-form/FieldErrorList";
import { PUB_AMENITY_FIELDS, type PubAmenityKey } from "@/constants/pubFormFields";
import type { BeerType } from "@/hooks/useBeerTypes";
import type { CountryOption } from "@/hooks/useCountries";
import type { BeerGarden, Pub } from "@/types/pub";
import OpeningHoursEditor from "../../../features/opening-hours/opening-hours-editor";
import BeerGardenEditCard from "./BeerGardenEditCard";
import BeerTypeSelector from "./BeerTypeSelector";
import styles from "./PubEditView.module.css";

type Props = {
  pub: Pub;
  pubDisplayId: string;
  editFields: Partial<Pub>;
  fieldErrors: Record<string, string>;
  saveError: string | null;
  isSaveDisabled: boolean;
  isAdmin: boolean;
  onFieldChange: (field: keyof Pub, value: Pub[keyof Pub]) => void;
  onToggleBeerType: (id: string) => void;
  onUpdateBeerGarden: (index: number, patch: Partial<BeerGarden>) => void;
  onAddBeerGarden: () => void;
  onRemoveBeerGarden: (index: number) => void;
  onSave: () => void;
  onDelete: () => Promise<void>;
  countries: CountryOption[];
  countriesLoading: boolean;
  countriesError: string | null;
  beerTypeOptions: BeerType[];
  beerTypesLoading: boolean;
  beerTypesError: string | null;
  setFieldErrors: Dispatch<SetStateAction<Record<string, string>>>;
};

const AMENITY_FIELDS_NO_INDEPENDENT = PUB_AMENITY_FIELDS.filter(
  (f) => f.key !== "isIndependent"
);

const AMENITY_ICONS: Partial<Record<PubAmenityKey, React.ReactNode>> = {
  hasFood: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5 1v4M5 7v6M9 1c0 0 0 4-2 4s-2 0-2 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><path d="M10 1v12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>,
  hasSundayRoast: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 10c0-2.761 2.239-5 5-5s5 2.239 5 5H2z" stroke="currentColor" strokeWidth="1.2" /><path d="M7 5V3M5 3h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>,
  hasBeerGarden: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 13V7M7 7C7 4 4 2 1 3c2 1 4 3 4 5M7 7c0-3 3-5 6-4-2 1-4 3-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>,
  hasCaskAle: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="2" y="4" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.2" /><path d="M5 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.2" /><path d="M5 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>,
  isBeerFocused: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M4 2h6l1 9H3L4 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M4 5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>,
  isDogFriendly: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 2l2 2-1 1 1 3-2 1v3H5V9L3 8l1-3-1-1 2-2h4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>,
  isFamilyFriendly: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="5" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="10" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M2 13v-3a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><path d="M8 13v-2a2 2 0 014 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>,
  hasLiveSport: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="1" y="2" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M5 13h4M7 10v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>,
  hasLiveMusic: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5 10V3l7-1.5V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="3.5" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="10.5" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.2" /></svg>,
  hasPoolTable: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  hasDartsBoard: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  hasStepFreeAccess: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  hasAccessibleToilet: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
};

export default function PubEditView({
  pub,
  pubDisplayId,
  editFields,
  fieldErrors,
  saveError,
  isSaveDisabled,
  isAdmin,
  onFieldChange,
  onToggleBeerType,
  onUpdateBeerGarden,
  onAddBeerGarden,
  onRemoveBeerGarden,
  onSave,
  onDelete,
  countries,
  countriesLoading,
  countriesError,
  beerTypeOptions,
  beerTypesLoading,
  beerTypesError,
  setFieldErrors,
}: Props) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const [beerTypesOpen, setBeerTypesOpen] = useState(false);
  const [beerGardensOpen, setBeerGardensOpen] = useState(false);

  const activeAmenityCount = AMENITY_FIELDS_NO_INDEPENDENT.filter(
    (f) => Boolean(editFields[f.key as keyof Pub])
  ).length;

  return (
    <div className={styles.form}>

      {/* ── Basic information ── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 7L7 1.5 13 7v6H9v-3.5H5V13H1V7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <h2 className={styles.sectionTitle}>Basic information</h2>
            <p className={styles.sectionDesc}>The pub's name and contact details.</p>
          </div>
        </div>

        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="edit-name">
            Pub name <span className={styles.req}>*</span>
          </label>
          <input
            id="edit-name"
            name="edit-pub-name"
            className={`${styles.textInput} ${fieldErrors.nameError ? styles.inputError : ""}`}
            type="text"
            value={editFields.name ?? ""}
            onChange={(e) => onFieldChange("name", e.target.value)}
          />
          {fieldErrors.nameError && (
            <FieldErrorList errors={[fieldErrors.nameError]} className={styles.errorText} idPrefix="edit-name" />
          )}
        </div>

        <div className={styles.fieldBlock}>
          <p className={styles.fieldLabel}>Ownership</p>
          <div className={styles.ownershipToggle}>
            <button
              type="button"
              className={`${styles.ownershipBtn} ${editFields.isIndependent !== false ? styles.ownershipBtnActive : ""}`}
              onClick={() => onFieldChange("isIndependent", true)}
              aria-pressed={editFields.isIndependent !== false}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 7L7 1.5 13 7v6H9v-3.5H5V13H1V7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
              Independent
            </button>
            <button
              type="button"
              className={`${styles.ownershipBtn} ${editFields.isIndependent === false ? styles.ownershipBtnActive : ""}`}
              onClick={() => onFieldChange("isIndependent", false)}
              aria-pressed={editFields.isIndependent === false}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 7a2 2 0 002 2h4a2 2 0 000-4H9M9 7a2 2 0 00-2-2H3a2 2 0 000 4h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Chain
            </button>
          </div>
        </div>

        {editFields.isIndependent === false && (
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="edit-chain-name">Chain name</label>
            <input
              id="edit-chain-name"
              className={styles.textInput}
              type="text"
              value={editFields.chainName ?? ""}
              onChange={(e) => onFieldChange("chainName", e.target.value)}
              placeholder="e.g. Wetherspoons"
            />
          </div>
        )}

        <div className={styles.fieldGrid2}>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="edit-website">Website</label>
            <input
              id="edit-website"
              className={`${styles.textInput} ${fieldErrors.websiteError ? styles.inputError : ""}`}
              type="url"
              value={editFields.website ?? ""}
              onChange={(e) => onFieldChange("website", e.target.value)}
              placeholder="https://..."
            />
            {fieldErrors.websiteError && (
              <FieldErrorList errors={[fieldErrors.websiteError]} className={styles.errorText} idPrefix="edit-website" />
            )}
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="edit-phone">Phone</label>
            <input
              id="edit-phone"
              className={`${styles.textInput} ${fieldErrors.phoneError ? styles.inputError : ""}`}
              type="tel"
              value={editFields.phone ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\+?[0-9\-\s]*$/.test(value) || value === "") {
                  onFieldChange("phone", value);
                  setFieldErrors((prev) => ({ ...prev, phoneError: "" }));
                } else {
                  setFieldErrors((prev) => ({
                    ...prev,
                    phoneError: "Only numbers, spaces, and dashes are allowed.",
                  }));
                }
              }}
              placeholder="+44 20 7946 0958"
            />
            {fieldErrors.phoneError && (
              <FieldErrorList errors={[fieldErrors.phoneError]} className={styles.errorText} idPrefix="edit-phone" />
            )}
          </div>
        </div>

        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="edit-description">
            Description <span className={styles.optLabel}>(optional)</span>
          </label>
          <textarea
            id="edit-description"
            className={styles.textarea}
            rows={3}
            value={editFields.description ?? ""}
            onChange={(e) => onFieldChange("description", e.target.value)}
            placeholder="A brief description of the pub…"
          />
        </div>

        <div className={styles.fieldGrid2}>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="edit-operator">
              Operator <span className={styles.optLabel}>(optional)</span>
            </label>
            <input
              id="edit-operator"
              className={styles.textInput}
              type="text"
              value={editFields.operator ?? ""}
              onChange={(e) => onFieldChange("operator", e.target.value)}
              placeholder="e.g. Greene King"
            />
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="edit-image-url">
              Image URL <span className={styles.optLabel}>(optional)</span>
            </label>
            <input
              id="edit-image-url"
              className={styles.textInput}
              type="url"
              value={editFields.imageUrl ?? ""}
              onChange={(e) => onFieldChange("imageUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className={styles.fieldBlock}>
          <label className={styles.closedDownLabel}>
            <input
              id="edit-closed-down"
              name="closedDown"
              type="checkbox"
              checked={editFields.closedDown ?? false}
              onChange={(e) => onFieldChange("closedDown", e.target.checked)}
              className={styles.closedDownCheckbox}
            />
            Mark as permanently closed
          </label>
        </div>
      </div>

      {/* ── Location ── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1a4 4 0 014 4c0 3-4 8-4 8S3 8 3 5a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="7" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <div>
            <h2 className={styles.sectionTitle}>Location</h2>
            <p className={styles.sectionDesc}>We'll re-geocode the address if you change it.</p>
          </div>
        </div>

        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="edit-address">
            Street address <span className={styles.req}>*</span>
          </label>
          <input
            id="edit-address"
            name="edit-pub-address"
            className={`${styles.textInput} ${fieldErrors.addressError ? styles.inputError : ""}`}
            type="text"
            value={editFields.address ?? ""}
            onChange={(e) => onFieldChange("address", e.target.value)}
            placeholder="e.g. 44 Dean Street"
          />
          {fieldErrors.addressError && (
            <FieldErrorList errors={[fieldErrors.addressError]} className={styles.errorText} idPrefix="edit-address" />
          )}
        </div>

        <div className={styles.fieldGrid2}>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="edit-city">
              City <span className={styles.req}>*</span>
            </label>
            <input
              id="edit-city"
              name="edit-pub-city"
              className={`${styles.textInput} ${fieldErrors.cityError ? styles.inputError : ""}`}
              type="text"
              value={editFields.city ?? ""}
              onChange={(e) => onFieldChange("city", e.target.value)}
            />
            {fieldErrors.cityError && (
              <FieldErrorList errors={[fieldErrors.cityError]} className={styles.errorText} idPrefix="edit-city" />
            )}
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="edit-area">
              Area / neighbourhood
            </label>
            <input
              id="edit-area"
              className={styles.textInput}
              type="text"
              value={editFields.area ?? ""}
              onChange={(e) => onFieldChange("area", e.target.value)}
            />
          </div>
        </div>

        <div className={styles.fieldGrid2}>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="edit-postcode">
              Postcode <span className={styles.req}>*</span>
            </label>
            <input
              id="edit-postcode"
              name="edit-pub-postcode"
              className={`${styles.textInput} ${fieldErrors.postcodeError ? styles.inputError : ""}`}
              type="text"
              value={editFields.postcode ?? ""}
              onChange={(e) => onFieldChange("postcode", e.target.value)}
            />
            {fieldErrors.postcodeError && (
              <FieldErrorList errors={[fieldErrors.postcodeError]} className={styles.errorText} idPrefix="edit-postcode" />
            )}
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="edit-country">Country</label>
            <select
              id="edit-country"
              name="edit-pub-country"
              className={styles.selectInput}
              value={editFields.country ?? ""}
              onChange={(e) => onFieldChange("country", e.target.value)}
              disabled={!!countriesError}
            >
              <option value="">
                {countriesLoading ? "Loading…" : countriesError ? "Failed to load" : "Select country"}
              </option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            {fieldErrors.countryError && (
              <FieldErrorList errors={[fieldErrors.countryError]} className={styles.errorText} idPrefix="edit-country" />
            )}
          </div>
        </div>

        <div className={styles.fieldGrid2}>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="edit-borough">
              Borough <span className={styles.optLabel}>(optional)</span>
            </label>
            <input
              id="edit-borough"
              className={styles.textInput}
              type="text"
              value={editFields.borough ?? ""}
              onChange={(e) => onFieldChange("borough", e.target.value)}
            />
          </div>
          <div className={styles.fieldBlock} />
        </div>

        <div className={styles.fieldGrid2}>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="edit-lat">Latitude</label>
            <input
              id="edit-lat"
              className={styles.textInput}
              type="number"
              step="any"
              value={editFields.lat ?? ""}
              disabled
            />
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="edit-lng">Longitude</label>
            <input
              id="edit-lng"
              className={styles.textInput}
              type="number"
              step="any"
              value={editFields.lng ?? ""}
              disabled
            />
          </div>
        </div>
        <p className={styles.fieldNote}>
          Coordinates are auto-generated from the address and cannot be edited directly.
        </p>
      </div>

      {/* ── Amenities ── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <div>
            <h2 className={styles.sectionTitle}>
              Amenities
              {activeAmenityCount > 0 && (
                <span className={styles.sectionCount}>{activeAmenityCount}</span>
              )}
            </h2>
            <p className={styles.sectionDesc}>Toggle amenities on or off — these power the browse page filters.</p>
          </div>
        </div>

        <div className={styles.amenitiesGrid}>
          {AMENITY_FIELDS_NO_INDEPENDENT.map((field) => {
            const checked = Boolean(editFields[field.key as keyof Pub]);
            const icon = AMENITY_ICONS[field.key];
            return (
              <label
                key={field.key}
                className={`${styles.amenityCard} ${checked ? styles.amenityCardChecked : ""}`}
              >
                <span className={styles.amenityCardIcon}>{icon}</span>
                <span className={styles.amenityCardLabel}>{field.label}</span>
                <span className={`${styles.amenityCardCheck} ${checked ? styles.amenityCardCheckOn : ""}`} />
                <input
                  type="checkbox"
                  className={styles.amenityHiddenInput}
                  checked={checked}
                  onChange={(e) => onFieldChange(field.key as keyof Pub, e.target.checked)}
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Opening hours (collapsible) ── */}
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHead}
          onClick={() => setHoursOpen((o) => !o)}
          aria-expanded={hoursOpen}
        >
          <span className={styles.sectionIcon}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </span>
          <div className={styles.sectionHeadText}>
            <h2 className={styles.sectionTitle}>Opening hours</h2>
            <p className={styles.sectionDesc}>Update the pub's regular weekly schedule.</p>
          </div>
          <span className={`${styles.chevron} ${hoursOpen ? styles.chevronOpen : ""}`}>↓</span>
        </button>
        {hoursOpen && (
          <div className={styles.collapsibleBody}>
            <OpeningHoursEditor
              value={editFields.openingHours}
              onChange={(val) => onFieldChange("openingHours", val)}
            />
          </div>
        )}
      </div>

      {/* ── Beer types (collapsible) ── */}
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHead}
          onClick={() => setBeerTypesOpen((o) => !o)}
          aria-expanded={beerTypesOpen}
        >
          <span className={styles.sectionIcon}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M4 2h6l1 9H3L4 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M4 5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </span>
          <div className={styles.sectionHeadText}>
            <h2 className={styles.sectionTitle}>Beer types</h2>
            <p className={styles.sectionDesc}>Select the beer types available at this pub.</p>
          </div>
          <span className={`${styles.chevron} ${beerTypesOpen ? styles.chevronOpen : ""}`}>↓</span>
        </button>
        {beerTypesOpen && (
          <div className={styles.collapsibleBody}>
            <BeerTypeSelector
              selectedIds={editFields.beerTypeIds ?? []}
              options={beerTypeOptions}
              loading={beerTypesLoading}
              error={beerTypesError}
              onToggle={onToggleBeerType}
            />
          </div>
        )}
      </div>

      {/* ── Beer gardens (collapsible) ── */}
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHead}
          onClick={() => setBeerGardensOpen((o) => !o)}
          aria-expanded={beerGardensOpen}
        >
          <span className={styles.sectionIcon}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 13V7M7 7C7 4 4 2 1 3c2 1 4 3 4 5M7 7c0-3 3-5 6-4-2 1-4 3-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </span>
          <div className={styles.sectionHeadText}>
            <h2 className={styles.sectionTitle}>Beer gardens</h2>
            <p className={styles.sectionDesc}>Add or edit outdoor spaces for this pub.</p>
          </div>
          <span className={`${styles.chevron} ${beerGardensOpen ? styles.chevronOpen : ""}`}>↓</span>
        </button>
        {beerGardensOpen && (
          <div className={styles.collapsibleBody}>
            {(editFields.beerGardens ?? []).length === 0 && (
              <p className={styles.sectionDesc}>No beer gardens added yet.</p>
            )}
            {(editFields.beerGardens ?? []).map((garden, index) => (
              <BeerGardenEditCard
                key={garden.id || `garden-${index}`}
                garden={garden}
                index={index}
                onUpdate={onUpdateBeerGarden}
                onRemove={onRemoveBeerGarden}
              />
            ))}
            <button
              type="button"
              className={styles.ownershipBtn}
              style={{ border: "1px solid var(--border-color)", borderRadius: 6, marginTop: 4 }}
              onClick={onAddBeerGarden}
            >
              + Add beer garden
            </button>
          </div>
        )}
      </div>

      {/* ── Metadata ── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={`${styles.sectionIcon} ${styles.sectionIconMeta}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <path d="M4 5h6M4 7.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <h2 className={styles.sectionTitle}>Metadata</h2>
            <p className={styles.sectionDesc}>Read-only system fields.</p>
          </div>
        </div>

        <div className={styles.fieldGrid2}>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="meta-pub-id">Pub ID</label>
            <input id="meta-pub-id" className={styles.textInput} type="text" value={pubDisplayId} disabled />
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel} htmlFor="meta-created">Created</label>
            <input
              id="meta-created"
              className={styles.textInput}
              type="text"
              value={pub.createdAt ? pub.createdAt.slice(0, 10) : "—"}
              disabled
            />
          </div>
        </div>
      </div>

      {/* ── Danger zone (admin only) ── */}
      {isAdmin && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={`${styles.sectionIcon} ${styles.sectionIconDanger}`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <h2 className={`${styles.sectionTitle} ${styles.sectionTitleDanger}`}>Danger zone</h2>
              <p className={styles.sectionDesc}>Irreversible actions — proceed with caution.</p>
            </div>
          </div>

          <div className={styles.dangerRow}>
            <div className={styles.dangerRowText}>
              <h3>Delete this pub</h3>
              <p>
                Once deleted, this pub and all associated data (beers, reviews, history) will be
                permanently removed. This cannot be undone.
              </p>
            </div>
            <button type="button" className={styles.deletePubBtn} onClick={onDelete}>
              × Delete pub
            </button>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className={styles.formFooter}>
        <div className={styles.footerLeft}>
          <span className={styles.requiredNote}>* = required field</span>
          {saveError && <span className={styles.errorText}>{saveError}</span>}
        </div>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={onSave}
          disabled={isSaveDisabled}
        >
          ✓ Save changes
        </button>
      </div>
    </div>
  );
}
