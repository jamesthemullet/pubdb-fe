import styles from "./UnapprovedBanner.module.css";

type Props = {
  email?: string;
};

const FREE_CONTRIBUTION_LIMIT = 10;

export default function UnapprovedBanner({ email }: Props){
  const mailto = `mailto:hello@thepubdb.com?subject=${encodeURIComponent(
    "Approval request for PubDB editor access"
  )}&body=${encodeURIComponent(
    `Hi PubDB team,\n\nPlease approve my account for editing pubs.\n\nAccount email: ${email ?? "Unknown"}\n\nThanks!`
  )}`;

  return (
    <div className={styles.banner} role="status">
      <span className={styles.icon} aria-hidden="true">!</span>
      <p className={styles.text}>
        Your account isn't approved yet — you can make up to {FREE_CONTRIBUTION_LIMIT} free contributions in the meantime.{" "}
        <a href={mailto} className={styles.link}>Chase approval by email</a>
      </p>
    </div>
  );
}
