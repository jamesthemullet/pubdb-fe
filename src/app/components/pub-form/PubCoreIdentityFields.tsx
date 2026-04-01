import Input from "@/app/components/input/Input";
import FieldErrorList from "./FieldErrorList";

type CoreFieldKey =
  | "name"
  | "city"
  | "country"
  | "address"
  | "postcode"
  | "lat"
  | "lng";

type CoreValues = {
  name: string;
  city: string;
  country: string;
  address: string;
  postcode: string;
  lat?: number;
  lng?: number;
};

type CoreFieldErrors = Partial<Record<CoreFieldKey, string[]>>;

type CountryOption = {
  name: string;
  code: string;
};

type PubCoreIdentityFieldsProps = {
  values: CoreValues;
  onFieldChange: <K extends CoreFieldKey>(
    field: K,
    value: CoreValues[K]
  ) => void;
  countries: CountryOption[];
  countriesLoading: boolean;
  fieldErrors?: CoreFieldErrors;
  requiredAsteriskClassName?: string;
  errorClassName?: string;
  showPlaceholders?: boolean;
  namePrefix?: string;
  showRequiredMarkers?: boolean;
};

export default function PubCoreIdentityFields({
  values,
  onFieldChange,
  countries,
  countriesLoading,
  fieldErrors,
  requiredAsteriskClassName,
  errorClassName,
  showPlaceholders = false,
  namePrefix = "pub",
  showRequiredMarkers = true,
}: PubCoreIdentityFieldsProps) {
  return (
    <>
      <div>
        <label htmlFor="name">
          Name:{" "}
          {showRequiredMarkers && (
            <span className={requiredAsteriskClassName} aria-hidden="true">
              *
            </span>
          )}
        </label>
        <Input
          id="name"
          name={`${namePrefix}-name`}
          value={values.name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          required
          autoComplete={`${namePrefix}-name`}
          placeholder={showPlaceholders ? "Enter pub name" : undefined}
        />
        <FieldErrorList
          errors={fieldErrors?.name}
          className={errorClassName}
          idPrefix="name"
        />
      </div>

      <div>
        <label htmlFor="city">
          City:{" "}
          {showRequiredMarkers && (
            <span className={requiredAsteriskClassName} aria-hidden="true">
              *
            </span>
          )}
        </label>
        <Input
          id="city"
          name={`${namePrefix}-city`}
          value={values.city}
          onChange={(e) => onFieldChange("city", e.target.value)}
          required
          autoComplete={`${namePrefix}-city`}
          placeholder={showPlaceholders ? "Enter city" : undefined}
        />
        <FieldErrorList
          errors={fieldErrors?.city}
          className={errorClassName}
          idPrefix="city"
        />
      </div>

      <div>
        <label htmlFor="country">
          Country:{" "}
          {showRequiredMarkers && (
            <span className={requiredAsteriskClassName} aria-hidden="true">
              *
            </span>
          )}
        </label>
        <select
          id="country"
          name={`${namePrefix}-country`}
          value={values.country}
          onChange={(e) => onFieldChange("country", e.target.value)}
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
        <FieldErrorList
          errors={fieldErrors?.country}
          className={errorClassName}
          idPrefix="country"
        />
      </div>

      <div>
        <label htmlFor="address">
          Address:{" "}
          {showRequiredMarkers && (
            <span className={requiredAsteriskClassName} aria-hidden="true">
              *
            </span>
          )}
        </label>
        <Input
          id="address"
          name={`${namePrefix}-address`}
          value={values.address}
          onChange={(e) => onFieldChange("address", e.target.value)}
          required
          autoComplete={`${namePrefix}-address`}
          placeholder={showPlaceholders ? "Enter address" : undefined}
        />
        <FieldErrorList
          errors={fieldErrors?.address}
          className={errorClassName}
          idPrefix="address"
        />
      </div>

      <div>
        <label htmlFor="postcode">
          Postcode:{" "}
          {showRequiredMarkers && (
            <span className={requiredAsteriskClassName} aria-hidden="true">
              *
            </span>
          )}
        </label>
        <Input
          id="postcode"
          name={`${namePrefix}-postcode`}
          value={values.postcode}
          onChange={(e) => onFieldChange("postcode", e.target.value)}
          required
          autoComplete={`${namePrefix}-postcode`}
          placeholder={showPlaceholders ? "Enter postcode" : undefined}
        />
        <FieldErrorList
          errors={fieldErrors?.postcode}
          className={errorClassName}
          idPrefix="postcode"
        />
      </div>

      <div>
        <label htmlFor="lat">Latitude:</label>
        <Input
          id="lat"
          name="lat"
          value={values.lat ?? ""}
          onChange={(e) =>
            onFieldChange(
              "lat",
              e.target.value === "" ? undefined : parseFloat(e.target.value)
            )
          }
          type="number"
          step="any"
        />
        <FieldErrorList
          errors={fieldErrors?.lat}
          className={errorClassName}
          idPrefix="lat"
        />
      </div>

      <div>
        <label htmlFor="lng">Longitude:</label>
        <Input
          id="lng"
          name="lng"
          value={values.lng ?? ""}
          onChange={(e) =>
            onFieldChange(
              "lng",
              e.target.value === "" ? undefined : parseFloat(e.target.value)
            )
          }
          type="number"
          step="any"
        />
        <FieldErrorList
          errors={fieldErrors?.lng}
          className={errorClassName}
          idPrefix="lng"
        />
      </div>
    </>
  );
}
