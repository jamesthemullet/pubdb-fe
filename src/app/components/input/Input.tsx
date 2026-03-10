import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  fullWidth?: boolean;
};

const toggleTypes = new Set(["checkbox", "radio"]);

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { fullWidth = true, className = "", type = "text", ...props },
  ref
) {
  const isToggle = toggleTypes.has(type);

  const classes = [
    styles.input,
    fullWidth && !isToggle ? styles.fullWidth : "",
    isToggle ? styles.toggle : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <input ref={ref} type={type} className={classes} {...props} />;
});

export default Input;
