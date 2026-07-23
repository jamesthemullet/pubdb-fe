"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AuthGate from "@/app/components/auth-gate/AuthGate";
import type { AuthUser } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { buildAuthHeaders } from "@/lib/auth";
import styles from "./page.module.css";

// ── Nav items ─────────────────────────────────────────────────────────────────

type SettingsTab =
  | "profile"
  | "security"
  | "notifications"
  | "apiPreferences"
  | "appearance"
  | "danger";

const NAV_ITEMS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <ProfileIcon /> },
  // TODO: re-enable in a future PR once wired to real API
  // { id: "security", label: "Security", icon: <SecurityIcon /> },
  { id: "notifications", label: "Notifications", icon: <BellIcon /> },
  { id: "apiPreferences", label: "API preferences", icon: <ApiPreferencesIcon /> },
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
          {activeTab === "profile" && <ProfileTab user={user} />}
          {/* TODO: re-enable in a future PR once wired to real API
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          */}
          {activeTab === "notifications" && <NotificationsTab user={user} />}
          {activeTab === "apiPreferences" && <ApiPreferencesTab user={user} />}
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

function SaveBar({
  onSave,
  disabled,
  label = "Save changes",
}: {
  onSave?: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className={styles.saveBar}>
      <button type="button" className={styles.saveBtn} onClick={onSave} disabled={disabled}>
        {label}
      </button>
    </div>
  );
}

// ── Profile tab ───────────────────────────────────────────────────────────────

type ProfileFormState = {
  name: string;
  username: string;
  image: string;
  location: string;
  bio: string;
};

function profileFormStateFromUser(user: AuthUser): ProfileFormState {
  return {
    name: user?.name ?? "",
    username: user?.username ?? "",
    image: user?.image ?? "",
    location: user?.location ?? "",
    bio: user?.bio ?? "",
  };
}

function initialsFor(name: string, username: string, email: string): string {
  const source = name || username || email;
  return source
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ProfileTab({ user }: { user: AuthUser }) {
  const initial = useMemo(() => profileFormStateFromUser(user), [user]);

  const [name, setName] = useState(initial.name);
  const [username, setUsername] = useState(initial.username);
  const [image, setImage] = useState(initial.image);
  const [location, setLocation] = useState(initial.location);
  const [bio, setBio] = useState(initial.bio);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const current: ProfileFormState = { name, username, image, location, bio };
  const hasChanges = (Object.keys(current) as (keyof ProfileFormState)[]).some(
    (key) => current[key] !== initial[key]
  );

  async function handleSave() {
    const body: Partial<ProfileFormState> = {};
    (Object.keys(current) as (keyof ProfileFormState)[]).forEach((key) => {
      if (current[key] !== initial[key]) body[key] = current[key];
    });

    if (Object.keys(body).length === 0) return;

    setFormError(null);
    setFieldErrors({});
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setSaved(true);
        window.dispatchEvent(new Event("authChanged"));
        setTimeout(() => setSaved(false), 2000);
        return;
      }

      if (res.status === 409) {
        setFieldErrors({ username: [typeof data?.error === "string" ? data.error : "Username already taken"] });
      } else if (res.status === 400 && data?.errors?.fieldErrors) {
        setFieldErrors(data.errors.fieldErrors);
      } else if (res.status === 401) {
        setFormError("Session expired — please log in again.");
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card
        title="Public profile"
        description="Other contributors see this on the leaderboard and pub edit history."
      >
        <FieldRow label="Display name" hint="2–100 characters." htmlFor="settings-display-name">
          <input
            id="settings-display-name"
            className={styles.textInput}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {fieldErrors.name?.map((msg) => (
            <span key={msg} className={styles.fieldError}>{msg}</span>
          ))}
        </FieldRow>

        <FieldRow label="Username" hint="3–30 characters. Letters, numbers, and underscores only.">
          <div className={styles.prefixInput}>
            <span className={styles.inputPrefix}>@</span>
            <input
              className={styles.prefixInputField}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {fieldErrors.username?.map((msg) => (
            <span key={msg} className={styles.fieldError}>{msg}</span>
          ))}
        </FieldRow>

        <FieldRow label="Avatar" hint="Paste an image URL.">
          <div className={styles.avatarRow}>
            {image ? (
              // biome-ignore lint/performance/noImgElement: user-supplied external avatar URL, not an optimizable local asset
              <img
                src={image}
                alt=""
                className={styles.avatarCircle}
                style={{ objectFit: "cover" }}
              />
            ) : (
              <span className={styles.avatarCircle}>{initialsFor(name, username, user?.email ?? "")}</span>
            )}
            <input
              className={styles.textInput}
              type="url"
              placeholder="https://example.com/avatar.png"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>
          {fieldErrors.image?.map((msg) => (
            <span key={msg} className={styles.fieldError}>{msg}</span>
          ))}
        </FieldRow>

        <FieldRow label="City" hint="Shown on your profile, helps suggest nearby pubs." htmlFor="settings-city">
          <input
            id="settings-city"
            className={styles.textInput}
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          {fieldErrors.location?.map((msg) => (
            <span key={msg} className={styles.fieldError}>{msg}</span>
          ))}
        </FieldRow>

        <FieldRow label="Bio" hint="Max 280 characters." htmlFor="settings-bio">
          <textarea
            id="settings-bio"
            className={styles.textarea}
            rows={4}
            maxLength={280}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          {fieldErrors.bio?.map((msg) => (
            <span key={msg} className={styles.fieldError}>{msg}</span>
          ))}
        </FieldRow>
      </Card>

      <Card title="Contact">
        <FieldRow label="Email" htmlFor="settings-email">
          <span className={styles.fieldHint}>{user?.email}</span>
        </FieldRow>
      </Card>

      <SaveBar onSave={handleSave} disabled={saving || !hasChanges} label={saving ? "Saving…" : "Save changes"} />
      {formError && <p className={styles.formError}>{formError}</p>}
      {saved && <p className={styles.savedMsg}>Changes saved.</p>}
    </>
  );
}

// ── Security tab ──────────────────────────────────────────────────────────────
// TODO: re-enable in a future PR once wired to real API
/*
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

*/

// ── Notifications tab ─────────────────────────────────────────────────────────

function AlertToggleRow({
  field,
  label,
  hint,
  initial,
}: {
  field: "usageLimitAlertsEnabled" | "pubEditAlertsEnabled";
  label: string;
  hint: string;
  initial: boolean;
}) {
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    setError(null);
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify({ [field]: next }),
      });

      if (res.ok) {
        window.dispatchEvent(new Event("authChanged"));
        return;
      }

      setEnabled(!next);
      if (res.status === 401) {
        setError("Session expired — please log in again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setEnabled(!next);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FieldRow label={label} hint={hint}>
      <label className={styles.toggleLabel}>
        <input
          type="checkbox"
          className={styles.toggleInput}
          checked={enabled}
          disabled={saving}
          onChange={handleToggle}
        />
        <span className={styles.toggleTrack}>
          <span className={styles.toggleThumb} />
        </span>
        <span className={styles.toggleText}>{enabled ? "On" : "Off"}</span>
      </label>
      {error && <p className={styles.formError}>{error}</p>}
    </FieldRow>
  );
}

function NotificationsTab({ user }: { user: AuthUser }) {
  return (
    <Card title="Email notifications" description="Choose what we send to your account email.">
      <AlertToggleRow
        field="pubEditAlertsEnabled"
        label="Edit to a pub I added"
        hint="Someone updated a pub you originally submitted."
        initial={user?.pubEditAlertsEnabled ?? true}
      />
    </Card>
  );
}

// ── API preferences tab ───────────────────────────────────────────────────────

function ApiPreferencesTab({ user }: { user: AuthUser }) {
  return (
    <Card title="API preferences" description="Control how we communicate with you about your API usage.">
      <AlertToggleRow
        field="usageLimitAlertsEnabled"
        label="Usage limit alerts"
        hint="Get an email when you reach 80% of your rate limit for the hour, day, or month."
        initial={user?.usageLimitAlertsEnabled ?? true}
      />
    </Card>
  );
}

// ── Appearance tab ────────────────────────────────────────────────────────────

function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  return (
    <Card title="Appearance" description="Customise how the dashboard looks for you.">
      <FieldRow label="Theme">
        <div className={styles.themeOptions}>
          {(["light", "dark"] as const).map((t) => (
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
    </Card>
  );
}

// ── Danger zone tab ───────────────────────────────────────────────────────────

function DangerTab() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("authChanged"));
        router.push("/");
        return;
      }

      const data = await res.json().catch(() => null);
      if (res.status === 400 && data?.errors) {
        setError("Password is required.");
      } else if (res.status === 401) {
        setError(data?.error === "Invalid credentials" ? "Incorrect password." : "Session expired — please log in again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Danger zone" description="Irreversible actions. Proceed with care.">
      {/* TODO: re-enable in a future PR once wired to real API
      <div className={styles.dangerRow}>
        <div>
          <p className={styles.dangerActionTitle}>Delete all API keys</p>
          <p className={styles.fieldHint}>Revokes all active keys immediately. Apps will lose access.</p>
        </div>
        <button type="button" className={styles.dangerBtn}>Delete all keys</button>
      </div>
      */}
      <div className={styles.dangerRow}>
        <div>
          <p className={styles.dangerActionTitle}>Delete account</p>
          <p className={styles.fieldHint}>Permanently removes your account, keys, and contribution history.</p>
        </div>
        {!confirming && (
          <button type="button" className={styles.dangerBtn} onClick={() => setConfirming(true)}>
            Delete account
          </button>
        )}
      </div>

      {confirming && (
        <form onSubmit={handleDeleteAccount} className={styles.dangerRow}>
          <FieldRow label="Confirm password" hint="Enter your password to permanently delete your account.">
            <input
              className={styles.textInput}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FieldRow>
          {error && <p className={styles.fieldHint}>{error}</p>}
          <div className={styles.avatarRow}>
            <button type="submit" className={styles.dangerBtn} disabled={submitting || !password}>
              {submitting ? "Deleting…" : "Confirm delete"}
            </button>
            <button
              type="button"
              className={styles.avatarBtnGhost}
              onClick={() => {
                setConfirming(false);
                setPassword("");
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
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

// TODO: re-enable in a future PR once wired to real API
/*
function SecurityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1L2 3.5v3.5c0 3 2.5 5.5 5 6 2.5-.5 5-3 5-6V3.5L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
*/

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1.5A4 4 0 003 5.5v2l-1 2h10l-1-2v-2a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5.5 11.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ApiPreferencesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 6.5h6M4 8.5h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
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
