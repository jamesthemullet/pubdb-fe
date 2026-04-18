import Typography from "@/app/components/typography/typography";
import type { BeerGarden, Pub } from "@/types/pub";
import styles from "../page.module.css";

type Props = {
  pub: Pub;
  getCountryName: (code: string) => string;
};

export default function PubDisplayView({ pub, getCountryName }: Props) {
  return (
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
          <a href={pub.website} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${pub.name} website (opens in new tab)`}>
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
        {pub.isIndependent == null ? "-" : pub.isIndependent ? "Yes" : "No"}
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
        {pub.hasSundayRoast == null ? "-" : pub.hasSundayRoast ? "Yes" : "No"}
      </Typography>
      <Typography>
        <Typography as="span" isBold>
          Beer garden:
        </Typography>{" "}
        {pub.hasBeerGarden == null ? "-" : pub.hasBeerGarden ? "Yes" : "No"}
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
        {pub.isBeerFocused == null ? "-" : pub.isBeerFocused ? "Yes" : "No"}
      </Typography>
      <Typography>
        <Typography as="span" isBold>
          Dog friendly:
        </Typography>{" "}
        {pub.isDogFriendly == null ? "-" : pub.isDogFriendly ? "Yes" : "No"}
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
        {pub.hasLiveSport == null ? "-" : pub.hasLiveSport ? "Yes" : "No"}
      </Typography>
      <Typography>
        <Typography as="span" isBold>
          Live music:
        </Typography>{" "}
        {pub.hasLiveMusic == null ? "-" : pub.hasLiveMusic ? "Yes" : "No"}
      </Typography>
      <Typography>
        <Typography as="span" isBold>
          Beer Types:
        </Typography>{" "}
        {getBeerTypeNames(pub).length ? getBeerTypeNames(pub).join(", ") : "-"}
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
