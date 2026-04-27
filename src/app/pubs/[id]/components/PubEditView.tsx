import Button from "@/app/components/button/button";
import Input from "@/app/components/input/Input";
import PubAmenitiesFields from "@/app/components/pub-form/PubAmenitiesFields";
import PubCoreIdentityFields from "@/app/components/pub-form/PubCoreIdentityFields";
import Textarea from "@/app/components/textarea/Textarea";
import Typography from "@/app/components/typography/typography";
import type { PubAmenityKey } from "@/constants/pubFormFields";
import type { BeerType } from "@/hooks/useBeerTypes";
import type { CountryOption } from "@/hooks/useCountries";
import type { BeerGarden, Pub } from "@/types/pub";
import OpeningHoursEditor from "../../../features/opening-hours/opening-hours-editor";
import styles from "../page.module.css";
import BeerGardenEditCard from "./BeerGardenEditCard";
import BeerTypeSelector from "./BeerTypeSelector";

type Props = {
  editFields: Partial<Pub>;
  fieldErrors: Record<string, string>;
  saveError: string | null;
  isSaveDisabled: boolean;
  onFieldChange: (field: keyof Pub, value: Pub[keyof Pub]) => void;
  onToggleBeerType: (id: string) => void;
  onUpdateBeerGarden: (index: number, patch: Partial<BeerGarden>) => void;
  onAddBeerGarden: () => void;
  onRemoveBeerGarden: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
  countries: CountryOption[];
  countriesLoading: boolean;
  countriesError: string | null;
  beerTypeOptions: BeerType[];
  beerTypesLoading: boolean;
  beerTypesError: string | null;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

export default function PubEditView({
  editFields,
  fieldErrors,
  saveError,
  isSaveDisabled,
  onFieldChange,
  onToggleBeerType,
  onUpdateBeerGarden,
  onAddBeerGarden,
  onRemoveBeerGarden,
  onSave,
  onCancel,
  countries,
  countriesLoading,
  countriesError,
  beerTypeOptions,
  beerTypesLoading,
  beerTypesError,
  setFieldErrors,
}: Props) {
  return (
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
          onFieldChange(field as keyof Pub, value)
        }
        countries={countries}
        countriesLoading={countriesLoading}
        countriesError={countriesError}
        fieldErrors={{
          name: fieldErrors.nameError ? [fieldErrors.nameError] : [],
          city: fieldErrors.cityError ? [fieldErrors.cityError] : [],
          country: fieldErrors.countryError ? [fieldErrors.countryError] : [],
          address: fieldErrors.addressError ? [fieldErrors.addressError] : [],
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
          onChange={(e) => onFieldChange("area", e.target.value)}
        />
      </label>
      <br />
      <label htmlFor="edit-borough">
        Borough:{" "}
        <Input
          id="edit-borough"
          value={editFields.borough ?? ""}
          onChange={(e) => onFieldChange("borough", e.target.value)}
        />
      </label>
      <br />
      <label htmlFor="edit-operator">
        Operator:{" "}
        <Input
          id="edit-operator"
          value={editFields.operator ?? ""}
          onChange={(e) => onFieldChange("operator", e.target.value)}
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
              onFieldChange("phone", value);
              setFieldErrors((prev) => ({ ...prev, phoneError: "" }));
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
          onChange={(e) => onFieldChange("website", e.target.value)}
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
          onChange={(e) => onFieldChange("description", e.target.value)}
        />
      </label>
      <br />
      <label htmlFor="edit-chain-name">
        Chain name:{" "}
        <Input
          id="edit-chain-name"
          value={editFields.chainName ?? ""}
          onChange={(e) => onFieldChange("chainName", e.target.value)}
        />
      </label>
      <br />
      <PubAmenitiesFields
        values={editFields as Partial<Record<PubAmenityKey, boolean>>}
        onChange={(key, checked) => onFieldChange(key as keyof Pub, checked)}
      />
      <br />
      <BeerTypeSelector
        selectedIds={editFields.beerTypeIds ?? []}
        options={beerTypeOptions}
        loading={beerTypesLoading}
        error={beerTypesError}
        onToggle={onToggleBeerType}
      />
      <br />
      <div>
        <Typography as="span">Opening Hours: </Typography>
        <OpeningHoursEditor
          value={editFields.openingHours}
          onChange={(val) => onFieldChange("openingHours", val)}
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
          <BeerGardenEditCard
            key={garden.id || `garden-${index}`}
            garden={garden}
            index={index}
            onUpdate={onUpdateBeerGarden}
            onRemove={onRemoveBeerGarden}
          />
        ))}
        <Button onClick={onAddBeerGarden}>Add beer garden</Button>
      </div>
      <br />
      <Button onClick={onSave} disabled={isSaveDisabled}>
        Save
      </Button>
      {saveError && (
        <Typography className={styles.saveError}>{saveError}</Typography>
      )}
      <Button
        variant="secondary"
        onClick={onCancel}
        className={styles.cancelButton}
      >
        Cancel
      </Button>
    </div>
  );
}
