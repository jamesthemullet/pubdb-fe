"use client";

import AuthGate from "@/app/components/auth-gate/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.css";

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/pubs", description: "List all pubs (paginated)" },
  { method: "GET", path: "/api/v1/pubs/:id", description: "Get a single pub by ID" },
  { method: "GET", path: "/api/v1/pubs/near", description: "Geo search — Developer tier+" },
  { method: "GET", path: "/api/v1/beer-types", description: "List tracked beer types" },
  { method: "GET", path: "/api/v1/contributors/leaderboard", description: "Contributor leaderboard" },
  { method: "GET", path: "/api/v1/stats", description: "Database stats — Developer tier+" },
];

function MethodBadge({ method }: { method: string }) {
  return (
    <span className={`${styles.methodBadge} ${styles[`method${method}`]}`}>
      {method}
    </span>
  );
}

export default function PlaygroundPage() {
  const { user } = useAuth();

  if (!user) {
    return <AuthGate context="Playground" />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <div>
            <h1 className={styles.pageTitle}>Playground</h1>
            <p className={styles.pageSubtitle}>
              Try live requests against the Pub DB API using one of your own API keys.
            </p>
          </div>
        </div>

        <section className={styles.section}>
          <p className={styles.sectionText}>
            Pick an endpoint below to build a request and see a live response. Manage your
            keys from the <a href="/profile" className={styles.inlineLink}>dashboard</a>.
          </p>

          <div className={styles.endpointList}>
            {ENDPOINTS.map(({ method, path, description }) => (
              <div key={path} className={styles.endpointRow}>
                <MethodBadge method={method} />
                <code className={styles.endpointPath}>{path}</code>
                <span className={styles.endpointDesc}>{description}</span>
                <button type="button" className={styles.tryBtn} disabled>
                  Try it →
                </button>
              </div>
            ))}
          </div>

          <p className={styles.comingSoon}>
            Live requests are coming soon — this page is a work in progress.
          </p>
        </section>
      </div>
    </div>
  );
}
