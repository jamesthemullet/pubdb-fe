import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h2>Pub DB</h2>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
