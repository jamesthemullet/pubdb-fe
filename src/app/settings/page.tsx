"use client";

import { useState } from "react";
import AuthGate from "@/app/components/auth-gate/AuthGate";
import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.css";

// ── Nav items ─────────────────────────────────────────────────────────────────

type SettingsTab =
  | "profile"
  | "security"
  | "api"
  | "notifications"
  | "team"
  | "appearance"
  | "danger";

const NAV_ITEMS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <ProfileIcon /> },
  { id: "security", label: "Security", icon: <SecurityIcon /> },
  { id: "api", label: "API preferences", icon: <ApiIcon /> },
  { id: "notifications", label: "Notifications", icon: <BellIcon /> },
  { id: "team", label: "Team", icon: <TeamIcon /> },
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
          {activeTab === "api" && <ApiTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "team" && <TeamTab />}
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
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.fieldRow}>
      <div className={styles.fieldMeta}>
        <span className={styles.fieldLabel}>{label}</span>
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
  const [username, setUsername] = useState("sammott");
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
        <FieldRow label="Display name">
          <input
            className={styles.textInput}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </FieldRow>

        <FieldRow
          label="Username"
          hint="Used in @mentions and your contributor URL."
        >
          <div className={styles.prefixInput}>
            <span className={styles.inputPrefix}>pubdb.io/u/</span>
            <input
              className={styles.prefixInputField}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              spellCheck={false}
            />
          </div>
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

        <FieldRow label="City" hint="Shown on your profile, helps suggest nearby pubs.">
          <input
            className={styles.textInput}
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </FieldRow>

        <FieldRow label="Bio">
          <textarea
            className={styles.textarea}
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </FieldRow>
      </Card>

      <Card title="Contact">
        <FieldRow label="Email">
          <input
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
        <FieldRow label="Current password">
          <input className={styles.textInput} type="password" placeholder="••••••••" />
        </FieldRow>
        <FieldRow label="New password">
          <input className={styles.textInput} type="password" placeholder="••••••••" />
        </FieldRow>
        <FieldRow label="Confirm new password">
          <input className={styles.textInput} type="password" placeholder="••••••••" />
        </FieldRow>
      </Card>

      <Card title="Two-factor authentication" description="Add an extra layer of security to your account.">
        <div className={styles.twoFaRow}>
          <div>
            <p className={styles.twoFaStatus}>Not enabled</p>
            <p className={styles.fieldHint}>Protect your account with an authenticator app.</p>
          </div>
          <button type="button" className={styles.saveBtn}>Enable 2FA</button>
        </div>
      </Card>

      <Card title="Active sessions" description="Devices currently signed in to your account.">
        <div className={styles.sessionRow}>
          <div className={styles.sessionInfo}>
            <span className={styles.sessionDevice}>Chrome · macOS</span>
            <span className={styles.fieldHint}>London, UK · Current session</span>
          </div>
          <span className={styles.currentSessionBadge}>Current</span>
        </div>
      </Card>

      <SaveBar />
    </>
  );
}

// ── API preferences tab ────────────────────────────────────────────────────────

function ApiTab() {
  const [defaultVersion, setDefaultVersion] = useState("v1");
  const [rateAlerts, setRateAlerts] = useState(true);

  return (
    <>
      <Card title="API defaults" description="Applied to all new API keys and requests by default.">
        <FieldRow label="Default API version">
          <select className={styles.selectInput} value={defaultVersion} onChange={(e) => setDefaultVersion(e.target.value)}>
            <option value="v1">v1 (stable)</option>
            <option value="v2-beta">v2 (beta)</option>
          </select>
        </FieldRow>

        <FieldRow label="Rate limit alerts" hint="Email when usage exceeds 80% of quota.">
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              className={styles.toggleInput}
              checked={rateAlerts}
              onChange={(e) => setRateAlerts(e.target.checked)}
            />
            <span className={styles.toggleTrack}>
              <span className={styles.toggleThumb} />
            </span>
            <span className={styles.toggleText}>{rateAlerts ? "Enabled" : "Disabled"}</span>
          </label>
        </FieldRow>

        <FieldRow label="Response format">
          <select className={styles.selectInput} defaultValue="json">
            <option value="json">JSON</option>
            <option value="json-ld">JSON-LD</option>
          </select>
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

// ── Team tab ──────────────────────────────────────────────────────────────────

function TeamTab() {
  return (
    <Card title="Team members" description="Invite colleagues to share access to this workspace.">
      <div className={styles.teamRow}>
        <span className={styles.teamAvatar} style={{ background: "#d97706" }}>SM</span>
        <div className={styles.teamInfo}>
          <span className={styles.teamName}>Sam Mott</span>
          <span className={styles.fieldHint}>sam@pintly.app · Owner</span>
        </div>
        <span className={styles.teamRoleBadge}>Owner</span>
      </div>

      <div className={styles.inviteRow}>
        <input className={styles.textInput} type="email" placeholder="colleague@example.com" />
        <button type="button" className={styles.saveBtn}>Invite</button>
      </div>
    </Card>
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

function ApiIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7h10M8 3l4 4-4 4M6 3L2 7l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
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

function TeamIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 13c0-2.209 1.791-4 4-4s4 1.791 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 9c1.5 0 3 1.2 3 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
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
