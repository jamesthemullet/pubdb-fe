import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import styles from "./typography.module.css";

type TypographyVariant =
  | "bodySmall"
  | "bodyMedium"
  | "bodyLarge"
  | "headingSmall"
  | "headingMedium"
  | "headingLarge";

type TypographyProps = {
  text?: string;
  children?: ReactNode;
  as?: ElementType;
  variant?: TypographyVariant;
  className?: string;
} & ComponentPropsWithoutRef<"p">;

const variantClassMap: Record<TypographyVariant, string> = {
  bodySmall: styles.bodySmall,
  bodyMedium: styles.bodyMedium,
  bodyLarge: styles.bodyLarge,
  headingSmall: styles.headingSmall,
  headingMedium: styles.headingMedium,
  headingLarge: styles.headingLarge,
};

const defaultElementMap: Record<TypographyVariant, ElementType> = {
  bodySmall: "p",
  bodyMedium: "p",
  bodyLarge: "p",
  headingSmall: "h3",
  headingMedium: "h2",
  headingLarge: "h1",
};

export default function Typography({
  text,
  children,
  as,
  variant = "bodyMedium",
  className = "",
  ...props
}: TypographyProps) {
  const Component = as ?? defaultElementMap[variant];
  const classes = [variantClassMap[variant], className]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...props}>
      {children ?? text}
    </Component>
  );
}
