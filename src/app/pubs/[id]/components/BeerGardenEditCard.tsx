import Button from "@/app/components/button/button";
import Dropdown from "@/app/components/dropdown/Dropdown";
import Input from "@/app/components/input/Input";
import Textarea from "@/app/components/textarea/Textarea";
import Typography from "@/app/components/typography/typography";
import type { BeerGarden, SunExposure } from "@/types/pub";
import OpeningHoursEditor from "../../../features/opening-hours/opening-hours-editor";
import styles from "../page.module.css";

const SUN_EXPOSURE_OPTIONS: Array<{ label: string; value: SunExposure }> = [
  { label: "Full sun", value: "FULL_SUN" },
  { label: "Partial sun", value: "PARTIAL_SUN" },
  { label: "Shaded", value: "SHADED" },
];

type Props = {
  garden: BeerGarden;
  index: number;
  onUpdate: (index: number, patch: Partial<BeerGarden>) => void;
  onRemove: (index: number) => void;
};

export default function BeerGardenEditCard({
  garden,
  index,
  onUpdate,
  onRemove,
}: Props) {
  return (
    <div
      key={garden.id || `garden-${index}`}
      className={styles.gardenCard}
    >
      <div className={styles.gardenHeader}>
        <Typography as="span" isBold>
          Garden {index + 1}
        </Typography>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onRemove(index)}
        >
          Remove
        </Button>
      </div>
      <label htmlFor={`garden-${index}-name`}>
        Name:{" "}
        <Input
          id={`garden-${index}-name`}
          value={garden.name}
          onChange={(e) => onUpdate(index, { name: e.target.value })}
          required
        />
      </label>
      <label htmlFor={`garden-${index}-description`}>
        Description:{" "}
        <Textarea
          id={`garden-${index}-description`}
          value={garden.description ?? ""}
          onChange={(e) =>
            onUpdate(index, { description: e.target.value || undefined })
          }
        />
      </label>
      <label htmlFor={`garden-${index}-seating`}>
        Seating capacity:{" "}
        <Input
          id={`garden-${index}-seating`}
          type="number"
          value={garden.seatingCapacity ?? ""}
          onChange={(e) =>
            onUpdate(index, {
              seatingCapacity:
                e.target.value === ""
                  ? undefined
                  : Number.parseInt(e.target.value, 10),
            })
          }
          min={0}
        />
      </label>
      <label htmlFor={`garden-${index}-sun-exposure`}>
        Sun exposure:{" "}
        <Dropdown
          id={`garden-${index}-sun-exposure`}
          value={garden.sunExposure ?? ""}
          onChange={(e) =>
            onUpdate(index, {
              sunExposure: (e.target.value as SunExposure) || undefined,
            })
          }
        >
          <option value="">Select sun exposure</option>
          {SUN_EXPOSURE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Dropdown>
      </label>
      <label htmlFor={`garden-${index}-imageUrl`}>
        Image URL:{" "}
        <Input
          id={`garden-${index}-imageUrl`}
          value={garden.imageUrl ?? ""}
          onChange={(e) =>
            onUpdate(index, { imageUrl: e.target.value || undefined })
          }
        />
      </label>
      <label htmlFor={`garden-${index}-notes`}>
        Notes:{" "}
        <Textarea
          id={`garden-${index}-notes`}
          value={garden.notes ?? ""}
          onChange={(e) =>
            onUpdate(index, { notes: e.target.value || undefined })
          }
        />
      </label>
      <div className={styles.gardenCheckboxes}>
        <label htmlFor={`garden-${index}-covered`}>
          <Input
            id={`garden-${index}-covered`}
            type="checkbox"
            checked={garden.isCovered ?? false}
            onChange={(e) => onUpdate(index, { isCovered: e.target.checked })}
          />{" "}
          Covered
        </label>
        <label htmlFor={`garden-${index}-heated`}>
          <Input
            id={`garden-${index}-heated`}
            type="checkbox"
            checked={garden.isHeated ?? false}
            onChange={(e) => onUpdate(index, { isHeated: e.target.checked })}
          />{" "}
          Heated
        </label>
        <label htmlFor={`garden-${index}-family`}>
          <Input
            id={`garden-${index}-family`}
            type="checkbox"
            checked={garden.isFamilyFriendly ?? false}
            onChange={(e) =>
              onUpdate(index, { isFamilyFriendly: e.target.checked })
            }
          />{" "}
          Family friendly
        </label>
        <label htmlFor={`garden-${index}-pet`}>
          <Input
            id={`garden-${index}-pet`}
            type="checkbox"
            checked={garden.petFriendly ?? false}
            onChange={(e) => onUpdate(index, { petFriendly: e.target.checked })}
          />{" "}
          Pet friendly
        </label>
      </div>
      <div>
        <Typography as="span">Beer garden opening hours: </Typography>
        <OpeningHoursEditor
          value={garden.openingHours}
          onChange={(val) => onUpdate(index, { openingHours: val })}
        />
      </div>
    </div>
  );
}
