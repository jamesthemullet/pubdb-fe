import Link from "next/link";
import styles from "./footer.module.css";

export default function Footer(){
  return (
    <footer className={styles.footer}>
      <span className={styles.copy}>&copy; {new Date().getFullYear()} Pub DB</span>
      <nav className={styles.links}>
        <Link href="/terms" className={styles.link}>
          Terms
        </Link>
        <Link href="/privacy" className={styles.link}>
          Privacy
        </Link>
      </nav>
    </footer>
  );
}
