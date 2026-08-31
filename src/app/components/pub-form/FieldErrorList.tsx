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
}: FieldErrorListProps): React.JSX.Element | null {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div id={`${idPrefix}-error`} role="alert" aria-live="assertive">
      {errors.map((fieldError) => (
        <Typography
          key={`${idPrefix}-error-${fieldError}`}
          variant="bodySmall"
          className={className}
        >
          {fieldError}
        </Typography>
      ))}
    </div>
  );
}
