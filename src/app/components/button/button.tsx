import type { ButtonHTMLAttributes } from "react";
import styles from "./button.module.css";

type ButtonVariant = "primary" | "secondary" | "blue" | "red" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "xs";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const variantClassMap: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  blue: styles.blue,
  red: styles.red,
  ghost: styles.ghost,
};

const sizeClassMap: Record<ButtonSize, string> = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const classes = [
    styles.button,
    variantClassMap[variant],
    sizeClassMap[size],
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} type={type} {...props} />;
}
