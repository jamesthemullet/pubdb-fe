export type CityPageMetadata = {
  title: string;
  description: string;
};

/** Builds the title/description for a `/pubs/in/[city]` landing page. */
export function buildCityPageMetadata(
  city: string,
  pubCount: number
): CityPageMetadata {
  const pubWord = pubCount === 1 ? "pub" : "pubs";
  return {
    title: `Pubs in ${city}`,
    description: `Browse ${pubCount} ${pubWord} in ${city} on Pub DB — opening hours, amenities and more for each one.`,
  };
}
