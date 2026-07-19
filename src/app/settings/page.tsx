// TODO: settings page is not ready — hidden from nav until wired to real API.
// Re-enable sidebar link in src/app/components/sidebar/sidebar.tsx when done.
"use client";

import { useState } from "react";
import AuthGate from "@/app/components/auth-gate/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.css";

// ── Nav items ─────────────────────────────────────────────────────────────────

type SettingsTab =
  | "profile"
  | "security"
  | "notifications"
  | "appearance"
  | "danger";

const NAV_ITEMS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <ProfileIcon /> },
  { id: "security", label: "Security", icon: <SecurityIcon /> },
  { id: "notifications", label: "Notifications", icon: <BellIcon /> },
  { id: "appearance", label: "Appearance", icon: <AppearanceIcon /> },
  { id: "danger", label: "Danger zone", icon: <DangerIcon /> },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { user } = useAuth();

  if (!user) {
    return <AuthGate context="Settings" />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.description}>
          Account, security, API defaults, and team — everything that isn't billing.
        </p>
      </div>

      <div className={styles.body}>
        {/* Left nav */}
        <nav className={styles.settingsNav} aria-label="Settings sections">
          <ul className={styles.navList}>
            {NAV_ITEMS.map(({ id, label, icon }) => (
              <li key={id}>
                <button
                  type="button"
                  className={`${styles.navItem} ${activeTab === id ? styles.navItemActive : ""} ${id === "danger" ? styles.navItemDanger : ""}`}
                  onClick={() => setActiveTab(id)}
                  aria-current={activeTab === id ? "true" : undefined}
                >
                  <span className={styles.navIcon}>{icon}</span>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === "profile" && <ProfileTab userEmail={user?.email ?? ""} />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "appearance" && <AppearanceTab />}
          {activeTab === "danger" && <DangerTab />}
        </div>
      </div>
    </div>
  );
}

// ── Shared form components ────────────────────────────────────────────────────

function FieldRow({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.fieldRow}>
      <div className={styles.fieldMeta}>
        {htmlFor ? (
          <label htmlFor={htmlFor} className={styles.fieldLabel}>{label}</label>
        ) : (
          <span className={styles.fieldLabel}>{label}</span>
        )}
        {hint && <span className={styles.fieldHint}>{hint}</span>}
      </div>
      <div className={styles.fieldControl}>{children}</div>
    </div>
  );
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        {description && <p className={styles.cardDescription}>{description}</p>}
      </div>
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
}

function SaveBar({ onSave }: { onSave?: () => void }) {
  return (
    <div className={styles.saveBar}>
      <button type="button" className={styles.saveBtn} onClick={onSave}>
        Save changes
      </button>
    </div>
  );
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab({ userEmail }: { userEmail: string }) {
  const [displayName, setDisplayName] = useState("Sam Mott");
  const [city, setCity] = useState("London");
  const [bio, setBio] = useState("Building Pintly. Probably at a pub right now.");
  const [email, setEmail] = useState(userEmail || "sam@pintly.app");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <Card
        title="Public profile"
        description="Other contributors see this on the leaderboard and pub edit history."
      >
        <FieldRow label="Display name" htmlFor="settings-display-name">
          <input
            id="settings-display-name"
            className={styles.textInput}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </FieldRow>

        <FieldRow label="Avatar" hint="Recommended 256×256.">
          <div className={styles.avatarRow}>
            <span className={styles.avatarCircle}>
              {displayName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <button type="button" className={styles.avatarBtn}>Upload</button>
            <button type="button" className={styles.avatarBtnGhost}>Remove</button>
          </div>
        </FieldRow>

        <FieldRow label="City" hint="Shown on your profile, helps suggest nearby pubs." htmlFor="settings-city">
          <input
            id="settings-city"
            className={styles.textInput}
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </FieldRow>

        <FieldRow label="Bio" htmlFor="settings-bio">
          <textarea
            id="settings-bio"
            className={styles.textarea}
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </FieldRow>
      </Card>

      <Card title="Contact">
        <FieldRow label="Email" htmlFor="settings-email">
          <input
            id="settings-email"
            className={styles.textInput}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FieldRow>

        <FieldRow label="Email verified">
          <span className={styles.verifiedBadge}>✓ Verified · 14 Mar 2024</span>
        </FieldRow>
      </Card>

      <SaveBar onSave={handleSave} />
      {saved && <p className={styles.savedMsg}>Changes saved.</p>}
    </>
  );
}

// ── Security tab ──────────────────────────────────────────────────────────────

function SecurityTab() {
  return (
    <>
      <Card title="Password" description="Update your login password.">
        <FieldRow label="Current password" htmlFor="settings-current-password">
          <input id="settings-current-password" className={styles.textInput} type="password" placeholder="••••••••" />
        </FieldRow>
        <FieldRow label="New password" htmlFor="settings-new-password">
          <input id="settings-new-password" className={styles.textInput} type="password" placeholder="••••••••" />
        </FieldRow>
        <FieldRow label="Confirm new password" htmlFor="settings-confirm-password">
          <input id="settings-confirm-password" className={styles.textInput} type="password" placeholder="••••••••" />
        </FieldRow>
      </Card>

      <SaveBar />
    </>
  );
}

// ── Notifications tab ─────────────────────────────────────────────────────────

function NotificationsTab() {
  const [notifs, setNotifs] = useState({
    billing: true,
    usage: true,
    changelog: false,
    contributions: true,
  });

  function toggle(key: keyof typeof notifs) {
    setNotifs((n) => ({ ...n, [key]: !n[key] }));
  }

  const items = [
    { key: "billing" as const, label: "Billing & invoices", hint: "Payment confirmations and upcoming charges" },
    { key: "usage" as const, label: "Usage alerts", hint: "Quota warnings and limit resets" },
    { key: "changelog" as const, label: "Changelog & announcements", hint: "New features and API updates" },
    { key: "contributions" as const, label: "Contribution activity", hint: "Leaderboard changes and pub edit approvals" },
  ];

  return (
    <>
      <Card title="Email notifications" description="Choose what we send to your account email.">
        {items.map((item) => (
          <FieldRow key={item.key} label={item.label} hint={item.hint}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={notifs[item.key]}
                onChange={() => toggle(item.key)}
              />
              <span className={styles.toggleTrack}>
                <span className={styles.toggleThumb} />
              </span>
              <span className={styles.toggleText}>{notifs[item.key] ? "On" : "Off"}</span>
            </label>
          </FieldRow>
        ))}
      </Card>

      <SaveBar />
    </>
  );
}

// ── Appearance tab ────────────────────────────────────────────────────────────

function AppearanceTab() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  return (
    <Card title="Appearance" description="Customise how the dashboard looks for you.">
      <FieldRow label="Theme">
        <div className={styles.themeOptions}>
          {(["light", "system", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={theme === t}
              className={`${styles.themeOption} ${theme === t ? styles.themeOptionActive : ""}`}
              onClick={() => setTheme(t)}
            >
              <span className={styles.themePreview} data-theme={t} />
              <span className={styles.themeLabel}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
            </button>
          ))}
        </div>
      </FieldRow>

      <SaveBar />
    </Card>
  );
}

// ── Danger zone tab ───────────────────────────────────────────────────────────

function DangerTab() {
  return (
    <Card title="Danger zone" description="Irreversible actions. Proceed with care.">
      <div className={styles.dangerRow}>
        <div>
          <p className={styles.dangerActionTitle}>Delete all API keys</p>
          <p className={styles.fieldHint}>Revokes all active keys immediately. Apps will lose access.</p>
        </div>
        <button type="button" className={styles.dangerBtn}>Delete all keys</button>
      </div>
      <div className={styles.dangerRow}>
        <div>
          <p className={styles.dangerActionTitle}>Delete account</p>
          <p className={styles.fieldHint}>Permanently removes your account, keys, and contribution history.</p>
        </div>
        <button type="button" className={styles.dangerBtn}>Delete account</button>
      </div>
    </Card>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ProfileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 13c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1L2 3.5v3.5c0 3 2.5 5.5 5 6 2.5-.5 5-3 5-6V3.5L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1.5A4 4 0 003 5.5v2l-1 2h10l-1-2v-2a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5.5 11.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function AppearanceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 1v1.5M7 11.5V13M13 7h-1.5M2.5 7H1M11.243 2.757l-1.06 1.06M3.817 10.183l-1.06 1.06M11.243 11.243l-1.06-1.06M3.817 3.817l-1.06-1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function DangerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
