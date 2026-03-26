import { forwardRef, type SelectHTMLAttributes } from "react";
import styles from "./Dropdown.module.css";

type DropdownProps = SelectHTMLAttributes<HTMLSelectElement> & {
  fullWidth?: boolean;
};

const Dropdown = forwardRef<HTMLSelectElement, DropdownProps>(function Dropdown(
  { fullWidth = true, className = "", ...props },
  ref
) {
  const classes = [
    styles.dropdown,
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <select ref={ref} className={classes} {...props} />;
});

export default Dropdown;
