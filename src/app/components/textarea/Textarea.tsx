import { forwardRef, type TextareaHTMLAttributes } from "react";
import styles from "./Textarea.module.css";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  fullWidth?: boolean;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ fullWidth = true, className = "", ...props }, ref) {
    const classes = [
      styles.textarea,
      fullWidth ? styles.fullWidth : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <textarea ref={ref} className={classes} {...props} />;
  }
);

export default Textarea;
