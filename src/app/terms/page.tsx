import Link from "next/link";
import Typography from "@/app/components/typography/typography";
import styles from "./page.module.css";

export default function TermsPage(){
  return (
    <div className={styles.container}>
      <Typography variant="headingMedium" as="h1">Terms of Service</Typography>
      <Typography variant="bodySmall">Last updated: August 9, 2026</Typography>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">1. Acceptance of Terms</Typography>
        <Typography>
          By creating an account or using Pub DB (the &ldquo;Service&rdquo;), you agree to be
          bound by these Terms of Service. If you do not agree to these terms, do not use
          the Service.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">2. The Service</Typography>
        <Typography>
          Pub DB provides API access to data and related tooling, including account
          dashboards, API key management, and usage reporting. We may change, suspend,
          or discontinue any part of the Service at any time.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">3. Accounts and API Keys</Typography>
        <Typography>
          You are responsible for maintaining the confidentiality of your account
          credentials and API keys, and for all activity that occurs under them. Notify
          us immediately if you suspect unauthorized use of your account or a key has
          been compromised. You can regenerate a key at any time from your dashboard.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">4. Acceptable Use</Typography>
        <Typography>
          You agree not to misuse the Service, including but not limited to: attempting
          to circumvent rate limits or usage quotas, reverse engineering the Service,
          reselling or sublicensing access without authorization, or using the Service
          to violate any applicable law.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">5. Rate Limits and Usage</Typography>
        <Typography>
          Access to the Service may be subject to rate limits and usage quotas
          associated with your plan. We may throttle or suspend access that exceeds
          these limits or that we reasonably believe threatens the stability of the
          Service.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">6. Termination</Typography>
        <Typography>
          We may suspend or terminate your access to the Service if you violate these
          terms. You may stop using the Service and close your account at any time.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">7. Disclaimer and Limitation of Liability</Typography>
        <Typography>
          The Service is provided &ldquo;as is&rdquo; without warranties of any kind.
          To the fullest extent permitted by law, Pub DB is not liable for any indirect,
          incidental, or consequential damages arising from your use of the Service.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">8. Changes to These Terms</Typography>
        <Typography>
          We may update these Terms of Service from time to time. Continued use of the
          Service after changes take effect constitutes acceptance of the revised terms.
        </Typography>
      </div>

      <div className={styles.section}>
        <Typography variant="headingSmall" as="h2">9. Contact</Typography>
        <Typography>
          Questions about these terms can be sent to our support team via the contact
          details listed in your account dashboard.
        </Typography>
      </div>

      <Link href="/register" className={styles.backLink}>
        &larr; Back to Register
      </Link>
    </div>
  );
}
