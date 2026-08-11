import Link from "next/link";
import Typography from "@/app/components/typography/typography";
import styles from "./page.module.css";

export default function PrivacyPage(){
  return (
    <div className={styles.container}>
      <Typography variant="headingMedium" as="h1">Privacy Policy</Typography>
      <Typography variant="bodySmall">Last updated: August 9, 2026</Typography>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">1. Information We Collect</Typography>
        <Typography>
          When you create an account, we collect information such as your name, email
          address, and password. When you use the Service, we may also collect usage
          data, including API request volume, timestamps, and the endpoints you access.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">2. How We Use Information</Typography>
        <Typography>
          We use the information we collect to provide and improve the Service,
          authenticate your account and API keys, monitor usage against rate limits,
          communicate with you about your account, and maintain the security of the
          Service.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">3. Data Sharing</Typography>
        <Typography>
          We do not sell your personal information. We may share information with
          service providers who help us operate the Service (such as hosting and
          infrastructure providers), or when required by law.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">4. Cookies</Typography>
        <Typography>
          We use cookies and similar technologies to keep you signed in, remember your
          preferences, and understand how the Service is used.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">5. Data Retention</Typography>
        <Typography>
          We retain account and usage data for as long as your account is active, or as
          needed to provide the Service, comply with legal obligations, and resolve
          disputes.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">6. Security</Typography>
        <Typography>
          We use reasonable technical and organizational measures to protect your
          information, including secure storage of credentials and API keys. No method
          of transmission or storage is completely secure, and we cannot guarantee
          absolute security.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">7. Your Rights</Typography>
        <Typography>
          Depending on your location, you may have rights to access, correct, or delete
          your personal information. You can update your account details from your
          dashboard, or contact us to make a request.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">8. Changes to This Policy</Typography>
        <Typography>
          We may update this Privacy Policy from time to time. Continued use of the
          Service after changes take effect constitutes acceptance of the revised
          policy.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">9. Contact</Typography>
        <Typography>
          Questions about this policy can be sent to our support team via the contact
          details listed in your account dashboard.
        </Typography>
      </div>

      <Link href="/register" className={styles.backLink}>
        &larr; Back to Register
      </Link>
    </div>
  );
}
