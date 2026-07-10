import Link from "next/link";
import Typography from "@/app/components/typography/typography";
import styles from "./page.module.css";

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <Typography variant="headingMedium" as="h1">Terms of Service</Typography>
      <Typography>Coming soon.</Typography>
      <Link href="/register" className={styles.backLink}>
        &larr; Back to Register
      </Link>
    </div>
  );
}
