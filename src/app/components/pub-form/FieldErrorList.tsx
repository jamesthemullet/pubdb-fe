import Typography from "@/app/components/typography/typography";

type FieldErrorListProps = {
  errors?: string[];
  className?: string;
  idPrefix: string;
};

export default function FieldErrorList({
  errors,
  className,
  idPrefix,
}: FieldErrorListProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return errors.map((fieldError) => (
    <Typography
      key={`${idPrefix}-error-${fieldError}`}
      variant="bodySmall"
      className={className}
    >
      {fieldError}
    </Typography>
  ));
}
