import Input from "@/app/components/input/Input";
import {
  PUB_AMENITY_FIELDS,
  type PubAmenityKey,
} from "@/constants/pubFormFields";

type AmenityValues = Partial<Record<PubAmenityKey, boolean>>;

type PubAmenitiesFieldsProps = {
  values: AmenityValues;
  onChange: (key: PubAmenityKey, checked: boolean) => void;
  containerClassName?: string;
  labelClassName?: string;
  idPrefix?: string;
};

export default function PubAmenitiesFields({
  values,
  onChange,
  containerClassName,
  labelClassName,
  idPrefix = "amenity",
}: PubAmenitiesFieldsProps) {
  return (
    <div className={containerClassName}>
      {PUB_AMENITY_FIELDS.map((amenityField) => {
        const amenityId = `${idPrefix}-${amenityField.key}`;

        return (
          <label
            key={amenityField.key}
            className={labelClassName}
            htmlFor={amenityId}
          >
            <Input
              id={amenityId}
              name={amenityField.key}
              type="checkbox"
              checked={values[amenityField.key] ?? false}
              onChange={(e) => onChange(amenityField.key, e.target.checked)}
            />
            <span>{amenityField.label}</span>
          </label>
        );
      })}
    </div>
  );
}
