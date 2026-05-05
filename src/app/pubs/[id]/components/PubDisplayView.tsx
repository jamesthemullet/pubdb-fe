import type { JSX } from "react";
import Typography from "@/app/components/typography/typography";
import type { BeerGarden, OpeningHoursMap, Pub } from "@/types/pub";
import styles from "../page.module.css";
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

  return (
    <>
      <InlineEditField
        label="City"
        displayValue={pub.city}
        initialValue={pub.city ?? ""}
        onSave={save("city")}
        validate={(val) => (!val.trim() ? "City is required" : null)}
        canEdit={ce}
      />
      <Typography>
        <Typography as="span" isBold>
          Country:
        </Typography>{" "}
        {getCountryName(pub.country)}
      </Typography>
      <InlineEditField
        label="Address"
        displayValue={pub.address}
        initialValue={pub.address ?? ""}
        onSave={save("address")}
        validate={(val) => (!val.trim() ? "Address is required" : null)}
        canEdit={ce}
      />
      <InlineEditField
        label="Postcode"
        displayValue={pub.postcode}
        initialValue={pub.postcode ?? ""}
        onSave={save("postcode")}
        validate={(val) => (!val.trim() ? "Postcode is required" : null)}
        canEdit={ce}
      />
      <InlineEditField
        label="Area"
        displayValue={pub.area || "-"}
        initialValue={pub.area ?? ""}
        onSave={save("area")}
        canEdit={ce}
      />
      <InlineEditField
        label="Borough"
        displayValue={pub.borough || "-"}
        initialValue={pub.borough ?? ""}
        onSave={save("borough")}
        canEdit={ce}
      />
      <InlineEditField
        label="Operator"
        displayValue={pub.operator || "-"}
        initialValue={pub.operator ?? ""}
        onSave={save("operator")}
        canEdit={ce}
      />
      <InlineEditField
        label="Phone"
        displayValue={pub.phone || "-"}
        initialValue={pub.phone ?? ""}
        onSave={save("phone")}
        validate={(val) =>
          val && !/^\+?[0-9\-\s]*$/.test(val)
            ? "Invalid phone number format. Only numbers, spaces, and dashes are allowed."
            : null
        }
        canEdit={ce}
      />
      <InlineEditField
        label="Website"
        displayValue={
          pub.website ? (
            <a href={pub.website} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${pub.name} website (opens in new tab)`}>
              {pub.website}
            </a>
          ) : (
            "-"
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
      <InlineEditField
        label="Description"
        displayValue={pub.description || "-"}
        initialValue={pub.description ?? ""}
        onSave={save("description")}
        type="textarea"
        canEdit={ce}
      />
      <InlineEditField
        label="Chain name"
        displayValue={pub.chainName || "-"}
        initialValue={pub.chainName ?? ""}
        onSave={save("chainName")}
        canEdit={ce}
      />
      <InlineEditBooleanField
        label="Independent"
        value={pub.isIndependent}
        onSave={saveBool("isIndependent")}
        canEdit={ce}
      />
      <InlineEditBooleanField
        label="Food available"
        value={pub.hasFood}
        onSave={saveBool("hasFood")}
        canEdit={ce}
      />
      <InlineEditBooleanField
        label="Sunday roast"
        value={pub.hasSundayRoast}
        onSave={saveBool("hasSundayRoast")}
        canEdit={ce}
      />
      <InlineEditBooleanField
        label="Beer garden"
        value={pub.hasBeerGarden}
        onSave={saveBool("hasBeerGarden")}
        canEdit={ce}
      />
      <InlineEditBooleanField
        label="Cask ale"
        value={pub.hasCaskAle}
        onSave={saveBool("hasCaskAle")}
        canEdit={ce}
      />
      <InlineEditBooleanField
        label="Beer-focused"
        value={pub.isBeerFocused}
        onSave={saveBool("isBeerFocused")}
        canEdit={ce}
      />
      <InlineEditBooleanField
        label="Dog friendly"
        value={pub.isDogFriendly}
        onSave={saveBool("isDogFriendly")}
        canEdit={ce}
      />
      <InlineEditBooleanField
        label="Family friendly"
        value={pub.isFamilyFriendly}
        onSave={saveBool("isFamilyFriendly")}
        canEdit={ce}
      />
      <InlineEditBooleanField
        label="Step-free access"
        value={pub.hasStepFreeAccess}
        onSave={saveBool("hasStepFreeAccess")}
        canEdit={ce}
      />
      <InlineEditBooleanField
        label="Accessible toilet"
        value={pub.hasAccessibleToilet}
        onSave={saveBool("hasAccessibleToilet")}
        canEdit={ce}
      />
      <InlineEditBooleanField
        label="Live sport"
        value={pub.hasLiveSport}
        onSave={saveBool("hasLiveSport")}
        canEdit={ce}
      />
      <InlineEditBooleanField
        label="Live music"
        value={pub.hasLiveMusic}
        onSave={saveBool("hasLiveMusic")}
        canEdit={ce}
      />
      <Typography>
        <Typography as="span" isBold>
          Beer Types:
        </Typography>{" "}
        {getBeerTypeNames(pub).length ? getBeerTypeNames(pub).join(", ") : "-"}
      </Typography>
      <Typography as="div">
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
              <BeerGardenDisplayCard
                key={garden.id || `garden-${index}`}
                garden={garden}
              />
            ))}
          </div>
        ) : (
          " -"
        )}
      </div>
      <InlineEditField
        label="Latitude"
        displayValue={pub.lat}
        initialValue={String(pub.lat ?? "")}
        onSave={save("lat")}
        type="number"
        canEdit={ce}
      />
      <InlineEditField
        label="Longitude"
        displayValue={pub.lng}
        initialValue={String(pub.lng ?? "")}
        onSave={save("lng")}
        type="number"
        canEdit={ce}
      />
      <Typography>
        <Typography as="span" isBold>
          Created At:
        </Typography>{" "}
        {new Date(pub.createdAt).toLocaleString()}
      </Typography>
    </>
  );
}

function BeerGardenDisplayCard({ garden }: { garden: BeerGarden }) {
  return (
    <div className={styles.gardenDisplayCard}>
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
            aria-label={`View ${garden.name || "beer garden"} image (opens in new tab)`}
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
      <Typography as="div">
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
  );
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

function renderOpeningHours(ohAny: OpeningHoursMap | string | null | undefined): JSX.Element {
  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  let oh: OpeningHoursMap | null = null;
  if (typeof ohAny === "string") {
    try {
      oh = JSON.parse(ohAny) as OpeningHoursMap;
    } catch {
      oh = null;
    }
  } else if (ohAny != null) {
    oh = ohAny;
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

  const map: OpeningHoursMap = {};
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
