import type { Pub } from "@/types/pub";
import { PUB_AMENITY_FIELDS } from "@/constants/pubFormFields";
import styles from "./PubDisplayView.module.css";
import InlineEditBooleanField from "./InlineEditBooleanField";
import InlineEditField from "./InlineEditField";

type Props = {
  pub: Pub;
  getCountryName: (code: string) => string;
  canEdit?: boolean;
  onInlineSave?: (field: keyof Pub, value: unknown) => Promise<string | null>;
};

export default function PubDisplayView({ pub, getCountryName, canEdit, onInlineSave }: Props) {
  const ce = !!(canEdit && onInlineSave);

  const save =
    (field: keyof Pub) =>
    (val: string): Promise<string | null> =>
      onInlineSave?.(field, val) ?? Promise.resolve(null);

  const saveBool =
    (field: keyof Pub) =>
    (val: boolean | null): Promise<string | null> =>
      onInlineSave?.(field, val) ?? Promise.resolve(null);

  const activeAmenities = new Set(
    PUB_AMENITY_FIELDS.filter(({ key }) => pub[key]).map(({ key }) => key)
  );
  const inactiveAmenities = PUB_AMENITY_FIELDS.filter(({ key }) => !pub[key]);

  const coordText =
    pub.lat != null && pub.lng != null
      ? `${pub.lat.toFixed(4)},  ${pub.lng.toFixed(4)}`
      : null;

  return (
    <div className={styles.view}>
      {/* DETAILS section */}
      <p className={styles.sectionLabel}>DETAILS</p>

      <div className={styles.detailRows}>
        <InlineEditField
          rowLayout
          label="Name"
          displayValue={pub.name || "—"}
          initialValue={pub.name ?? ""}
          onSave={save("name")}
          validate={(val) => (!val.trim() ? "Name is required" : null)}
          canEdit={ce}
        />
        <InlineEditField
          rowLayout
          label="Address"
          displayValue={pub.address || "—"}
          initialValue={pub.address ?? ""}
          onSave={save("address")}
          validate={(val) => (!val.trim() ? "Address is required" : null)}
          canEdit={ce}
        />
        <InlineEditField
          rowLayout
          label="City"
          displayValue={pub.city || "—"}
          initialValue={pub.city ?? ""}
          onSave={save("city")}
          validate={(val) => (!val.trim() ? "City is required" : null)}
          canEdit={ce}
        />
        <InlineEditField
          rowLayout
          label="Area"
          displayValue={pub.area || "—"}
          initialValue={pub.area ?? ""}
          onSave={save("area")}
          canEdit={ce}
        />
        <InlineEditField
          rowLayout
          label="Postcode"
          displayValue={pub.postcode ? <code className={styles.mono}>{pub.postcode}</code> : "—"}
          initialValue={pub.postcode ?? ""}
          onSave={save("postcode")}
          validate={(val) => (!val.trim() ? "Postcode is required" : null)}
          canEdit={ce}
        />
        <InlineEditField
          rowLayout
          label="Country"
          displayValue={pub.country ? getCountryName(pub.country) : "—"}
          initialValue={pub.country ?? ""}
          onSave={save("country")}
          validate={(val) => (!val.trim() ? "Country is required" : null)}
          canEdit={ce}
        />
        <InlineEditField
          rowLayout
          label="Operator"
          displayValue={
            pub.operator ? (
              <span className={pub.operator.toLowerCase() === "independent" ? styles.accentValue : undefined}>
                {pub.operator}
              </span>
            ) : pub.isIndependent ? (
              <span className={styles.accentValue}>Independent</span>
            ) : (
              "—"
            )
          }
          initialValue={pub.operator ?? ""}
          onSave={save("operator")}
          canEdit={ce}
        />
        <InlineEditField
          rowLayout
          label="Phone"
          displayValue={pub.phone || "—"}
          initialValue={pub.phone ?? ""}
          onSave={save("phone")}
          validate={(val) =>
            val && !/^\+?[0-9\-\s]*$/.test(val)
              ? "Invalid phone number format"
              : null
          }
          canEdit={ce}
        />
        <InlineEditField
          rowLayout
          label="Website"
          displayValue={
            pub.website ? (
              <a href={pub.website} target="_blank" rel="noopener noreferrer" className={styles.link}>
                {pub.website}
              </a>
            ) : (
              "—"
            )
          }
          initialValue={pub.website ?? ""}
          onSave={save("website")}
          validate={(val) => {
            if (!val) return null;
            try {
              const { protocol } = new URL(val);
              return protocol === "http:" || protocol === "https:"
                ? null
                : "Please enter a valid URL (include http:// or https://)";
            } catch {
              return "Please enter a valid URL (include http:// or https://)";
            }
          }}
          canEdit={ce}
        />

        {coordText && (
          <div className={styles.readRow}>
            <span className={styles.readLabel}>Coordinates</span>
            <code className={`${styles.readValue} ${styles.mono}`}>{coordText}</code>
          </div>
        )}

        {!coordText && ce && (
          <>
            <InlineEditField
              rowLayout
              label="Latitude"
              displayValue={pub.lat != null ? String(pub.lat) : "—"}
              initialValue={String(pub.lat ?? "")}
              onSave={save("lat")}
              type="number"
              canEdit={ce}
            />
            <InlineEditField
              rowLayout
              label="Longitude"
              displayValue={pub.lng != null ? String(pub.lng) : "—"}
              initialValue={String(pub.lng ?? "")}
              onSave={save("lng")}
              type="number"
              canEdit={ce}
            />
          </>
        )}

        <div className={styles.readRow}>
          <span className={styles.readLabel}>Created</span>
          <code className={`${styles.readValue} ${styles.mono}`}>
            {new Date(pub.createdAt).toISOString().slice(0, 10)}
          </code>
        </div>

        <div className={styles.readRow}>
          <span className={styles.readLabel}>ID</span>
          <code className={`${styles.readValue} ${styles.mono}`}>{pub.id}</code>
        </div>

        {pub.description && (
          <InlineEditField
            rowLayout
            label="Description"
            displayValue={pub.description}
            initialValue={pub.description ?? ""}
            onSave={save("description")}
            type="textarea"
            canEdit={ce}
          />
        )}

        {pub.chainName && (
          <InlineEditField
            rowLayout
            label="Chain"
            displayValue={pub.chainName}
            initialValue={pub.chainName ?? ""}
            onSave={save("chainName")}
            canEdit={ce}
          />
        )}

        {pub.borough && (
          <InlineEditField
            rowLayout
            label="Borough"
            displayValue={pub.borough}
            initialValue={pub.borough ?? ""}
            onSave={save("borough")}
            canEdit={ce}
          />
        )}

        {pub.updatedAt && (
          <div className={styles.readRow}>
            <span className={styles.readLabel}>Last edited</span>
            <code className={`${styles.readValue} ${styles.mono}`}>
              {new Date(pub.updatedAt).toISOString().slice(0, 10)}
            </code>
          </div>
        )}

        {ce && (
          <InlineEditBooleanField
            rowLayout
            label="Closed down"
            value={pub.closedDown}
            onSave={saveBool("closedDown")}
            canEdit={ce}
          />
        )}
      </div>

      {/* NOT AVAILABLE HERE section */}
      {inactiveAmenities.length > 0 && (
        <>
          <p className={styles.sectionLabel} style={{ marginTop: "1.75rem" }}>
            NOT AVAILABLE HERE
          </p>
          <div className={styles.inactiveChips}>
            {inactiveAmenities.map(({ key, label }) => (
              <span key={key} className={styles.inactiveChip}>
                <span className={styles.inactiveChipText}>{label}</span>
              </span>
            ))}
          </div>
          {ce && (
            <div className={styles.boolEditGrid}>
              {inactiveAmenities.map(({ key, label }) => (
                <InlineEditBooleanField
                  key={key}
                  rowLayout
                  label={label}
                  value={pub[key] as boolean | null | undefined}
                  onSave={saveBool(key)}
                  canEdit={ce}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Active amenities edit controls (editors only) */}
      {ce && activeAmenities.size > 0 && (
        <>
          <p className={styles.sectionLabel} style={{ marginTop: "1.75rem" }}>
            AVAILABLE — EDIT
          </p>
          <div className={styles.boolEditGrid}>
            {PUB_AMENITY_FIELDS.filter(({ key }) => activeAmenities.has(key)).map(({ key, label }) => (
              <InlineEditBooleanField
                key={key}
                rowLayout
                label={label}
                value={pub[key] as boolean | null | undefined}
                onSave={saveBool(key)}
                canEdit={ce}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
