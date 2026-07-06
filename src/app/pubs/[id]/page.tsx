"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Typography from "@/app/components/typography/typography";
import { PUB_AMENITY_FIELDS } from "@/constants/pubFormFields";
import { useAuth } from "@/hooks/useAuth";
import { useBeerTypes } from "@/hooks/useBeerTypes";
import { useCountries } from "@/hooks/useCountries";
import { buildAuthHeaders } from "@/lib/auth";
import type { BeerGarden, Pub } from "@/types/pub";
import addPubStyles from "../../add-pub/page.module.css";
import CompletenessCard from "./components/CompletenessCard";
import EditButton from "./components/EditButton";
import PubDisplayView from "./components/PubDisplayView";
import PubEditView from "./components/PubEditView";
import styles from "./page.module.css";

type PubTab = "overview" | "beers" | "hours" | "garden" | "history";
type CodeTab = "curl" | "node" | "python";

function pubInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function pubDisplayId(id: string | undefined): string {
  return id ? `pub_${id.slice(0, 6)}` : "pub_??????";
}

export default function PubPage(): React.JSX.Element {
  const { id } = useParams();
  const [pub, setPub] = useState<Pub | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<Partial<Pub>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PubTab>("overview");
  const [codeTab, setCodeTab] = useState<CodeTab>("curl");
  const [copied, setCopied] = useState<"id" | "code" | null>(null);

  const { user, isApproved } = useAuth();
  const { countries, countriesLoading, countriesError } = useCountries();
  const { beerTypeOptions, beerTypesLoading, beerTypesError } = useBeerTypes();

  const getCountryName = useCallback(
    (code: string) => countries.find((c) => c.code === code)?.name ?? code,
    [countries]
  );

  useEffect(() => {
    async function fetchPub() {
      try {
        const res = await fetch(`/api/pubs/${id}`);
        if (!res.ok) { setPub(null); return; }
        const raw: unknown = await res.json();
        const unwrapped =
          raw && typeof raw === "object" && "data" in raw
            ? (raw as { data: unknown }).data
            : raw;
        setPub((unwrapped as Pub) || null);
      } catch {
        setPub(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchPub();
  }, [id]);

  const handleEditClick = useCallback(() => {
    if (!pub) return;
    const base: Record<string, unknown> = { ...pub };
    if (typeof base.openingHours === "string") base.openingHours = undefined;
    setEditFields({
      ...(base as Partial<Pub>),
      beerGardens: pub.beerGardens ? [...pub.beerGardens] : [],
      beerTypeIds: getBeerTypeIdsFromPub(pub),
    });
    setSaveError(null);
    const requiredFields: (keyof Pub)[] = ["name", "city", "address", "postcode", "country"];
    const initialErrors: Record<string, string> = {};
    for (const field of requiredFields) {
      const value = pub[field];
      initialErrors[`${field}Error`] =
        !value || value.toString().trim() === "" ? `${field} is required` : "";
    }
    initialErrors.websiteError = "";
    initialErrors.phoneError = "";
    setFieldErrors(initialErrors);
    setEditing(true);
  }, [pub]);

  const handleFieldChange = useCallback(
    (field: keyof Pub, value: Pub[keyof Pub]) => {
      setEditFields((prev) => ({ ...prev, [field]: value }));
      if (["name", "city", "address", "postcode", "country"].includes(field)) {
        setFieldErrors((prev) => ({
          ...prev,
          [`${field}Error`]:
            !value || (typeof value === "string" && value.trim() === "")
              ? `${field} is required`
              : "",
        }));
      }
      if (field === "website") {
        const trimmed = typeof value === "string" ? value.trim() : "";
        setFieldErrors((prev) => ({
          ...prev,
          websiteError:
            trimmed && !isValidHttpUrl(trimmed)
              ? "Please enter a valid URL (include http:// or https://)"
              : "",
        }));
      }
      if (field === "phone") {
        setFieldErrors((prev) => ({ ...prev, phoneError: "" }));
      }
    },
    []
  );

  const toggleBeerType = useCallback((beerTypeId: string) => {
    setEditFields((prev) => {
      const current = new Set(prev.beerTypeIds ?? []);
      if (current.has(beerTypeId)) current.delete(beerTypeId);
      else current.add(beerTypeId);
      return { ...prev, beerTypeIds: Array.from(current) };
    });
  }, []);

  const updateBeerGarden = useCallback((index: number, patch: Partial<BeerGarden>) => {
    setEditFields((prev) => {
      const gardens = [...(prev.beerGardens ?? [])];
      gardens[index] = { ...(gardens[index] ?? createEmptyBeerGarden()), ...patch };
      return { ...prev, beerGardens: gardens };
    });
  }, []);

  const addBeerGarden = useCallback(() => {
    setEditFields((prev) => ({
      ...prev,
      beerGardens: [...(prev.beerGardens ?? []), createEmptyBeerGarden()],
    }));
  }, []);

  const removeBeerGarden = useCallback((index: number) => {
    setEditFields((prev) => {
      const gardens = [...(prev.beerGardens ?? [])];
      gardens.splice(index, 1);
      return { ...prev, beerGardens: gardens };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!pub) return;
    const requiredFields: (keyof Pub)[] = ["name", "city", "address", "postcode", "country"];
    const missingFields = requiredFields.filter(
      (f) => !editFields[f] || editFields[f]?.toString().trim() === ""
    );
    if (missingFields.length > 0) {
      const newErrors = { ...fieldErrors };
      for (const f of missingFields) newErrors[`${f}Error`] = `${f} is required`;
      setFieldErrors(newErrors);
      setSaveError("Please fill out all required fields.");
      return;
    }
    if (fieldErrors.websiteError || fieldErrors.phoneError) {
      setSaveError(fieldErrors.websiteError || fieldErrors.phoneError);
      return;
    }
    try {
      setSaveError(null);
      const token = localStorage.getItem("token");
      const body: Record<string, unknown> = {};
      if (Array.isArray(editFields.beerTypeIds)) {
        body.beerTypes = editFields.beerTypeIds.map((beerTypeId) => ({ beerTypeId }));
      }
      for (const [key, value] of Object.entries(editFields)) {
        if (value === undefined || value === null) continue;
        if (key === "beerType") continue;
        if (key === "openingHours" && typeof value === "string") continue;
        if (Array.isArray(value)) {
          if (key === "beerGardens") {
            body[key] = value.filter(isBeerGarden).map((g) => sanitizeBeerGarden(g));
          } else if (key !== "beerTypes" && key !== "beerTypeIds" && value.length > 0) {
            body[key] = value;
          }
          continue;
        }
        if (value !== "") body[key] = value;
      }
      body.id = pub.id;
      if (pub.createdAt) body.createdAt = pub.createdAt;
      const res = await fetch(`/api/pubs/${pub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders(token) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(extractErrorMessage(data));
      } else {
        setPub(data);
        setEditing(false);
        setSaveError(null);
      }
    } catch {
      setSaveError("Network error");
    }
  }, [pub, editFields, fieldErrors]);

  const handleInlineSave = useCallback(
    async (field: keyof Pub, value: unknown): Promise<string | null> => {
      if (!pub) return "No pub loaded";
      try {
        const token = localStorage.getItem("token");
        const merged: Partial<Pub> = {
          ...pub,
          beerGardens: pub.beerGardens ? [...pub.beerGardens] : [],
          beerTypeIds: getBeerTypeIdsFromPub(pub),
          [field]: value,
        };
        if ((field === "lat" || field === "lng") && typeof value === "string") {
          (merged as Record<string, unknown>)[field] =
            value === "" ? null : Number.isNaN(parseFloat(value)) ? null : parseFloat(value);
        }
        const body: Record<string, unknown> = {};
        if (Array.isArray(merged.beerTypeIds)) {
          body.beerTypes = merged.beerTypeIds.map((beerTypeId) => ({ beerTypeId }));
        }
        for (const [key, val] of Object.entries(merged)) {
          if (val === undefined || val === null) continue;
          if (key === "beerType") continue;
          if (key === "openingHours" && typeof val === "string") continue;
          if (Array.isArray(val)) {
            if (key === "beerGardens") {
              body[key] = val.filter(isBeerGarden).map((g) => sanitizeBeerGarden(g));
            } else if (key !== "beerTypes" && key !== "beerTypeIds" && val.length > 0) {
              body[key] = val;
            }
            continue;
          }
          if (val !== "") body[key] = val;
        }
        body.id = pub.id;
        if (pub.createdAt) body.createdAt = pub.createdAt;
        const res = await fetch(`/api/pubs/${pub.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...buildAuthHeaders(token) },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) return extractErrorMessage(data);
        setPub(data);
        return null;
      } catch {
        return "Network error";
      }
    },
    [pub]
  );

  const isSaveDisabled =
    Object.values(fieldErrors).some(Boolean) ||
    (["name", "city", "address", "postcode", "country"] as (keyof Pub)[]).some(
      (f) => !editFields[f] || editFields[f]?.toString().trim() === ""
    );

  function copyText(text: string, key: "id" | "code"): void {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Typography role="status" aria-live="polite">Loading pub details…</Typography>
      </div>
    );
  }

  if (!pub) {
    return (
      <div className={styles.page}>
        <Typography>Pub not found</Typography>
      </div>
    );
  }

  const displayId = pubDisplayId(pub.id);
  const activeAmenities = PUB_AMENITY_FIELDS.filter(({ key }) => pub[key]);
  const curlCode = `# Fetch this pub\ncurl https://api.thepubdb.com/api/v1/pubs/${pub.id} \\\n     -H "X-API-Key: $PUBDB_KEY"`;
  const nodeCode = `const res = await fetch(\n  'https://api.thepubdb.com/api/v1/pubs/${pub.id}',\n  { headers: { 'X-API-Key': process.env.PUBDB_KEY } }\n);\nconst pub = await res.json();`;
  const pythonCode = `import requests\nres = requests.get(\n  f'https://api.thepubdb.com/api/v1/pubs/${pub.id}',\n  headers={'X-API-Key': PUBDB_KEY}\n)\npub = res.json()`;
  const codeByTab: Record<CodeTab, string> = { curl: curlCode, node: nodeCode, python: pythonCode };

  const jsonPreview = buildJsonPreview(pub);

  const handleDelete = async (): Promise<void> => {
    if (!confirm(`Are you sure you want to delete "${pub.name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/pubs/${pub.id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });
      if (res.ok) window.location.href = "/pubs";
    } catch { /* ignore */ }
  };

  if (editing) {
    return (
      <div className={styles.page}>
        {/* Breadcrumb */}
        <nav className={styles.editBreadcrumb} aria-label="Breadcrumb">
          <Link href="/pubs" className={styles.editBreadcrumbLink}>Pubs</Link>
          <span className={styles.editBreadcrumbSep}>/</span>
          <span className={styles.editBreadcrumbLink}>{pub.city}</span>
          <span className={styles.editBreadcrumbSep}>/</span>
          <code className={styles.editBreadcrumbCode}>{displayId}</code>
          <span className={styles.editBreadcrumbSep}>/</span>
          <strong className={styles.editBreadcrumbCurrent}>Edit</strong>
        </nav>

        {/* Edit page header */}
        <div className={styles.editPageHeader}>
          <div className={styles.editPageHeaderLeft}>
            <div className={styles.editTitleRow}>
              <h1 className={styles.editHeading}>Edit pub</h1>
              <span className={styles.editPatchBadge}>
                <code>PATCH /v1/pubs/{pub.id}</code>
              </span>
            </div>
            <p className={styles.editSubtitle}>
              Editing <strong>{pub.name}</strong> · Changes take effect immediately after saving.
            </p>
          </div>
          <div className={styles.editActions}>
            <button type="button" className={addPubStyles.cancelBtn} onClick={() => setEditing(false)}>
              × Cancel
            </button>
            <button type="button" className={addPubStyles.submitBtn} onClick={handleSave} disabled={isSaveDisabled}>
              ✓ Save changes
            </button>
          </div>
        </div>

        <PubEditView
          pub={pub}
          pubDisplayId={displayId}
          editFields={editFields}
          fieldErrors={fieldErrors}
          saveError={saveError}
          isSaveDisabled={isSaveDisabled}
          isAdmin={user?.admin ?? false}
          onFieldChange={handleFieldChange}
          onToggleBeerType={toggleBeerType}
          onUpdateBeerGarden={updateBeerGarden}
          onAddBeerGarden={addBeerGarden}
          onRemoveBeerGarden={removeBeerGarden}
          onSave={handleSave}
          onDelete={handleDelete}
          countries={countries}
          countriesLoading={countriesLoading}
          countriesError={countriesError ?? null}
          beerTypeOptions={beerTypeOptions}
          beerTypesLoading={beerTypesLoading}
          beerTypesError={beerTypesError}
          setFieldErrors={setFieldErrors}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/pubs" className={styles.breadcrumbLink}>Pubs</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbLink}>{pub.city}</span>
        <span className={styles.breadcrumbSep}>/</span>
        <code className={styles.breadcrumbId}>{displayId}</code>
      </nav>

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleRow}>
          <h1 className={styles.pubHeading}>{pub.name}</h1>
          <span className={styles.apiBadge}>
            <code>GET /v1/pubs/{pub.id}</code>
          </span>
        </div>
        <div className={styles.pageActions}>
          <button
            type="button"
            className={styles.btnOutline}
            onClick={() => copyText(pub.id, "id")}
            aria-label="Copy pub ID"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="2" y="4" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M5 4V2.5A1.5 1.5 0 0 1 6.5 1h5A1.5 1.5 0 0 1 13 2.5v8A1.5 1.5 0 0 1 11.5 12H11" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            {copied === "id" ? "Copied!" : "Copy ID"}
          </button>
          <EditButton
            pubName={pub.name}
            pubId={pub.id}
            user={user}
            onEdit={handleEditClick}
          />
        </div>
      </div>

      {pub.closedDown && (
        <div className={styles.closedBanner} role="alert">
          This pub has permanently closed
        </div>
      )}

      <CompletenessCard pub={pub} onEdit={isApproved ? handleEditClick : undefined} />

      {/* Two-column body */}
      <div className={styles.body}>
        {/* Left column */}
        <div className={styles.leftCol}>
          {/* Image slot */}
          <div className={styles.imageSlot}>
            {pub.imageUrl ? (
              <Image
                src={pub.imageUrl}
                alt={pub.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 580px"
                className={styles.pubImage}
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                <span className={styles.imageInitials}>{pubInitials(pub.name)}</span>
                {/* TODO: implement image upload */}
                <span className={styles.imageSlotLabel}>Image functionality coming soon</span>
              </div>
            )}
          </div>

          {/* Pub identity */}
          <h2 className={styles.pubNameLarge}>{pub.name}</h2>
          <p className={styles.pubAddress}>
            <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" className={styles.pinIcon}>
              <path d="M8 2a4 4 0 0 1 4 4c0 3-4 8-4 8S4 9 4 6a4 4 0 0 1 4-4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="8" cy="6" r="1.5" fill="currentColor"/>
            </svg>
            {[pub.address, pub.area || pub.borough, pub.city, pub.postcode]
              .filter(Boolean)
              .join(" , ")}
          </p>

          {/* Amenity chips — active only */}
          {activeAmenities.length > 0 && (
            <div className={styles.amenityChips}>
              {activeAmenities.map(({ key, label }) => (
                <span key={key} className={styles.amenityChip}>
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className={styles.tabs}>
            <div className={styles.tabList} role="tablist">
              {/* TODO: restore history tab once API returns edit history data */}
              {(["overview", "beers", "hours", "garden"] as PubTab[]).map((tab) => (
                <button
                  key={tab}
                  id={`tab-${tab}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  aria-controls="tab-panel"
                  tabIndex={activeTab === tab ? 0 : -1}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div id="tab-panel" className={styles.tabPanel} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
              {activeTab === "overview" && (
                <PubDisplayView
                  pub={pub}
                  getCountryName={getCountryName}
                  canEdit={isApproved}
                  onInlineSave={handleInlineSave}
                />
              )}
              {activeTab === "beers" && (
                <BeersTab pub={pub} />
              )}
              {activeTab === "hours" && (
                <HoursTab pub={pub} />
              )}
              {activeTab === "garden" && (
                <GardenTab pub={pub} />
              )}
              {activeTab === "history" && (
                <HistoryTab pub={pub} />
              )}
            </div>
          </div>
        </div>

        {/* Right column — API panel */}
        <div className={styles.rightCol}>
          {/* Code block */}
          <div className={styles.codePanel}>
            <div className={styles.codePanelHeader}>
              <div className={styles.codeTabs} role="tablist" aria-label="Code language">
                {(["curl", "node", "python"] as CodeTab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={codeTab === t}
                    id={`pub-code-tab-${t}`}
                    aria-controls="pub-code-panel"
                    className={`${styles.codeTab} ${codeTab === t ? styles.codeTabActive : ""}`}
                    onClick={() => setCodeTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.codeCopyBtn}
                aria-label="Copy code"
                onClick={() => copyText(codeByTab[codeTab], "code")}
              >
                {copied === "code" ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre
              id="pub-code-panel"
              role="tabpanel"
              aria-labelledby={`pub-code-tab-${codeTab}`}
              className={styles.codeBlock}
            ><code>{codeByTab[codeTab]}</code></pre>
          </div>

          {/* Raw response */}
          <div className={styles.jsonPanel}>
            <div className={styles.jsonPanelHeader}>
              <span className={styles.jsonPanelTitle}>Raw response</span>
              <span className={styles.jsonBadge}>JSON</span>
              <button
                type="button"
                className={styles.jsonCopyBtn}
                onClick={() => copyText(JSON.stringify(pub, null, 2), "code")}
                aria-label="Copy JSON"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="2" y="4" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M5 4V2.5A1.5 1.5 0 0 1 6.5 1h5A1.5 1.5 0 0 1 13 2.5v8A1.5 1.5 0 0 1 11.5 12H11" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
            </div>
            <pre className={styles.jsonBlock}><code>{jsonPreview}</code></pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab panels ──────────────────────────────────────────────────────────────

function BeersTab({ pub }: { pub: Pub }) {
  const beerTypeNames = getBeerTypeNames(pub);
  return (
    <div className={styles.tabContent}>
      <dl className={styles.detailList}>
        <div className={styles.detailRow}>
          <dt>Cask ale</dt>
          <dd>{pub.hasCaskAle === true ? "Yes" : pub.hasCaskAle === false ? "No" : "—"}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Beer-focused</dt>
          <dd>{pub.isBeerFocused === true ? "Yes" : pub.isBeerFocused === false ? "No" : "—"}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Beer types</dt>
          <dd>{beerTypeNames.length ? beerTypeNames.join(", ") : "—"}</dd>
        </div>
      </dl>
    </div>
  );
}

const WEEKDAYS = [
  { full: "Monday",    abbr: "Mon" },
  { full: "Tuesday",   abbr: "Tue" },
  { full: "Wednesday", abbr: "Wed" },
  { full: "Thursday",  abbr: "Thu" },
  { full: "Friday",    abbr: "Fri" },
  { full: "Saturday",  abbr: "Sat" },
  { full: "Sunday",    abbr: "Sun" },
];

function checkOpenNow(
  oh: Pub["openingHours"],
  todayFull: string
): boolean {
  if (!oh) return false;
  const map: Record<string, { open?: string; close?: string; closed?: boolean }> = {};
  Object.entries(oh).forEach(([k, v]) => { map[k.toLowerCase()] = v; });
  const entry = map[todayFull.toLowerCase()];
  if (!entry || entry.closed || !entry.open || !entry.close) return false;
  const toMins = (t: string): number => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m ?? 0);
  };
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const open = toMins(entry.open);
  let close = toMins(entry.close);
  if (close <= open) close += 24 * 60;
  return cur >= open && cur < close;
}

function HoursTab({ pub }: { pub: Pub }) {
  const now = new Date();
  const jsDayIndex = now.getDay();
  const todayFull = WEEKDAYS[jsDayIndex === 0 ? 6 : jsDayIndex - 1].full;
  const isOpenNow = checkOpenNow(pub.openingHours, todayFull);

  const oh = pub.openingHours;
  const map: Record<string, { open?: string; close?: string; closed?: boolean }> = {};
  if (oh) {
    Object.entries(oh).forEach(([k, v]) => { map[k.toLowerCase()] = v; });
  }

  if (!oh) {
    return (
      <div className={styles.hoursCard}>
        <div className={styles.hoursCardHeader}>
          <span className={styles.hoursCardTitle}>
            <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" className={styles.clockIcon}>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" fill="none"/>
              <path d="M8 4.5V8l2.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Opening hours
          </span>
        </div>
        <p className={styles.hoursEmpty}>No opening hours recorded.</p>
      </div>
    );
  }

  return (
    <div className={styles.hoursCard}>
      <div className={styles.hoursCardHeader}>
        <span className={styles.hoursCardTitle}>
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" className={styles.clockIcon}>
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" fill="none"/>
            <path d="M8 4.5V8l2.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Opening hours
        </span>
        {isOpenNow && (
          <span className={styles.openNowBadge}>
            <span className={styles.openNowDot} aria-hidden="true" />
            Open now
          </span>
        )}
      </div>

      <div className={styles.hoursRows}>
        {WEEKDAYS.map(({ full, abbr }) => {
          const isToday = full === todayFull;
          const entry = map[full.toLowerCase()];
          let hoursText = "—";
          if (entry?.closed) hoursText = "Closed";
          else if (entry?.open) hoursText = `${entry.open} – ${entry.close ?? "?"}`;

          return (
            <div key={full} className={`${styles.hoursRow} ${isToday ? styles.hoursRowToday : ""}`}>
              <span className={styles.hoursDay}>
                {abbr}
                {isToday && (
                  <>
                    <span className={styles.hoursTodayDot}>· today</span>
                    {isOpenNow && <span className={styles.nowChip}>now</span>}
                  </>
                )}
              </span>
              <span className={`${styles.hoursTime} ${entry?.closed ? styles.hoursClosed : ""}`}>
                {hoursText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatSunExposure(s: string): string {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function GardenTab({ pub }: { pub: Pub }) {
  if (!pub.beerGardens?.length) {
    return (
      <div className={styles.gardenEmptyCard}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 13V7m0 0a4 4 0 0 1 4-4M8 7a4 4 0 0 0-4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          <path d="M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        No beer garden recorded for this pub.
      </div>
    );
  }

  return (
    <div className={styles.gardenTabList}>
      {pub.beerGardens.map((g, i) => {
        const summaryParts: string[] = [];
        if (g.seatingCapacity) summaryParts.push(`${g.seatingCapacity} seats`);
        if (g.sunExposure) summaryParts.push(formatSunExposure(g.sunExposure));

        return (
          <div key={g.id ?? i} className={styles.gardenTabCard}>
            <div className={styles.gardenTabHeader}>
              <span className={styles.gardenTabTitle}>
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className={styles.gardenIcon}>
                  <path d="M8 13V7m0 0a4 4 0 0 1 4-4M8 7a4 4 0 0 0-4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                  <path d="M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                {g.name || `Garden ${i + 1}`}
              </span>
              {summaryParts.length > 0 && (
                <span className={styles.gardenSummaryPill}>{summaryParts.join(" · ")}</span>
              )}
            </div>

            <div className={styles.gardenTabBody}>
              <dl className={styles.gardenDetailList}>
                {g.seatingCapacity != null && (
                  <div className={styles.gardenDetailRow}>
                    <dt>Capacity</dt>
                    <dd>{g.seatingCapacity} seats</dd>
                  </div>
                )}
                {g.sunExposure && (
                  <div className={styles.gardenDetailRow}>
                    <dt>Sun</dt>
                    <dd>{formatSunExposure(g.sunExposure)}</dd>
                  </div>
                )}
                {g.description && (
                  <div className={styles.gardenDetailRow}>
                    <dt>Notes</dt>
                    <dd>{g.description}</dd>
                  </div>
                )}
                <div className={styles.gardenDetailRow}>
                  <dt>Covered</dt>
                  <dd>{g.isCovered ? "Yes" : "No"}</dd>
                </div>
                <div className={styles.gardenDetailRow}>
                  <dt>Heated</dt>
                  <dd>{g.isHeated ? "Yes" : "No"}</dd>
                </div>
                <div className={styles.gardenDetailRow}>
                  <dt>Dog friendly</dt>
                  <dd>{g.petFriendly ? "Yes" : "No"}</dd>
                </div>
                <div className={styles.gardenDetailRow}>
                  <dt>Family</dt>
                  <dd>{g.isFamilyFriendly ? "Yes" : "No"}</dd>
                </div>
              </dl>

              <div className={styles.gardenImageSlot}>
                {g.imageUrl ? (
                  <Image
                    src={g.imageUrl}
                    alt={g.name || `Beer garden ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={styles.gardenImage}
                  />
                ) : (
                  <span className={styles.gardenImageLabel}>image-slot · garden photo</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function relativeTime(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return "1 month ago";
  return new Date(dateStr).toISOString().slice(0, 10);
}

const AVATAR_COLORS = [
  { bg: "#e8eaf0", fg: "#4b5563" },
  { bg: "#fef3c7", fg: "#92400e" },
  { bg: "#d1fae5", fg: "#065f46" },
  { bg: "#ede9fe", fg: "#5b21b6" },
  { bg: "#fee2e2", fg: "#991b1b" },
];

function avatarColor(initial: string): { bg: string; fg: string } {
  return AVATAR_COLORS[initial.toUpperCase().charCodeAt(0) % AVATAR_COLORS.length];
}

function HistoryTab({ pub }: { pub: Pub }) {
  type HistoryEntry = {
    key: string;
    initial: string;
    actor: string;
    action: string;
    actionVariant: "edited" | "created";
    detail?: string;
    date: string;
    absolute?: boolean;
  };

  const entries: HistoryEntry[] = [];

  if (pub.updatedAt && pub.updatedAt !== pub.createdAt) {
    entries.push({
      key: "updated",
      initial: "S",
      actor: "system",
      action: "updated pub",
      actionVariant: "edited",
      date: pub.updatedAt,
    });
  }

  entries.push({
    key: "created",
    initial: "S",
    actor: "system",
    action: "created pub",
    actionVariant: "created",
    date: pub.createdAt,
    absolute: true,
  });

  return (
    <div className={styles.historyCard}>
      <div className={styles.historyCardHeader}>
        <span className={styles.historyCardTitle}>Edit history</span>
      </div>
      <div className={styles.historyRows}>
        {entries.map((entry) => {
          const color = avatarColor(entry.initial);
          return (
            <div key={entry.key} className={styles.historyRow}>
              <span
                className={styles.historyAvatar}
                style={{ background: color.bg, color: color.fg }}
                aria-hidden="true"
              >
                {entry.initial}
              </span>
              <div className={styles.historyContent}>
                <span className={styles.historyActor}>{entry.actor}</span>
                {" "}
                <span className={entry.actionVariant === "edited" ? styles.actionEdited : styles.actionCreated}>
                  {entry.action}
                </span>
                {entry.detail && (
                  <span className={styles.historyDetail}> · {entry.detail}</span>
                )}
              </div>
              <span className={styles.historyTime}>
                {entry.absolute
                  ? new Date(entry.date).toISOString().slice(0, 10)
                  : relativeTime(entry.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function buildJsonPreview(pub: Pub): string {
  const preview: Record<string, unknown> = {
    id: pub.id,
    name: pub.name,
    city: pub.city,
    address: pub.address,
    postcode: pub.postcode,
  };
  if (pub.lat != null) preview.lat = pub.lat;
  if (pub.lng != null) preview.lng = pub.lng;
  if (pub.isIndependent != null) preview.isIndependent = pub.isIndependent;
  if (pub.hasCaskAle != null) preview.hasCaskAle = pub.hasCaskAle;
  if (pub.hasBeerGarden != null) preview.hasBeerGarden = pub.hasBeerGarden;
  if (pub.hasFood != null) preview.hasFood = pub.hasFood;
  return JSON.stringify(preview, null, 2);
}

function getBeerTypeNames(pub: Pub): string[] {
  if (Array.isArray(pub.beerTypes) && pub.beerTypes.length > 0) {
    return pub.beerTypes
      .map((entry) => {
        if (!entry) return undefined;
        if ("beerType" in entry) return entry.beerType?.name || entry.beerTypeId;
        if ("beerTypeId" in entry) return entry.beerTypeId;
        return entry.name || entry.id;
      })
      .filter(Boolean) as string[];
  }
  if (pub.beerType) {
    if (typeof pub.beerType === "string") return [pub.beerType];
    return [pub.beerType.name || pub.beerType.id].filter(Boolean);
  }
  if (Array.isArray(pub.beerTypeIds) && pub.beerTypeIds.length > 0) return pub.beerTypeIds;
  return [];
}

function getBeerTypeIdsFromPub(pub: Pub): string[] {
  if (Array.isArray(pub.beerTypeIds) && pub.beerTypeIds.length > 0) return pub.beerTypeIds;
  if (Array.isArray(pub.beerTypes) && pub.beerTypes.length > 0) {
    return pub.beerTypes
      .map((entry) => {
        if (!entry) return undefined;
        if ("beerTypeId" in entry) return entry.beerTypeId;
        return entry.id;
      })
      .filter((s): s is string => typeof s === "string" && s.length > 0);
  }
  if (pub.beerType) {
    if (typeof pub.beerType === "string") return [pub.beerType];
    return pub.beerType.id ? [pub.beerType.id] : [];
  }
  return [];
}

function isValidHttpUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function extractErrorMessage(errorPayload: unknown): string {
  if (!errorPayload) return "Unknown error";
  if (typeof errorPayload === "string") return errorPayload.trim() || "Unknown error";
  if (typeof errorPayload === "object") {
    const record = errorPayload as Record<string, unknown>;
    if (record.errors && typeof record.errors === "object") {
      const flattened = record.errors as {
        fieldErrors?: Record<string, string[]>;
        formErrors?: string[];
      };
      if (flattened.fieldErrors) {
        const msgs = Object.entries(flattened.fieldErrors).flatMap(([field, messages]) =>
          Array.isArray(messages) && messages.length ? [`${field}: ${messages[0]}`] : []
        );
        if (msgs.length) return msgs.join("\n");
      }
      if (Array.isArray(flattened.formErrors) && flattened.formErrors.length) {
        return flattened.formErrors[0];
      }
    }
    if (typeof record.error === "string" && record.error.trim()) return record.error.trim();
    if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
    try { return JSON.stringify(record); } catch { return "Unknown error"; }
  }
  return String(errorPayload);
}

function createEmptyBeerGarden(): BeerGarden {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: "",
    description: "",
    seatingCapacity: undefined,
    sunExposure: undefined,
    isCovered: false,
    isHeated: false,
    isFamilyFriendly: false,
    petFriendly: false,
    openingHours: undefined,
    imageUrl: "",
    notes: "",
  };
}

function isBeerGarden(item: unknown): item is BeerGarden {
  return (
    typeof item === "object" &&
    item !== null &&
    "name" in item &&
    typeof (item as Record<string, unknown>).name === "string"
  );
}

function sanitizeBeerGarden(garden: BeerGarden): BeerGarden {
  const cleaned: BeerGarden = { ...garden };
  for (const key of Object.keys(cleaned)) {
    if (cleaned[key as keyof BeerGarden] === null) delete cleaned[key as keyof BeerGarden];
  }
  if (cleaned.id?.startsWith("temp-")) delete cleaned.id;
  if (typeof cleaned.name === "string") cleaned.name = cleaned.name.trim();
  else if (cleaned.name === undefined) cleaned.name = "";
  if (typeof cleaned.description === "string")
    cleaned.description = cleaned.description.trim() || undefined;
  if (typeof cleaned.imageUrl === "string")
    cleaned.imageUrl = cleaned.imageUrl.trim() || undefined;
  if (typeof cleaned.notes === "string") cleaned.notes = cleaned.notes.trim() || undefined;
  if (cleaned.openingHours === null) cleaned.openingHours = undefined;
  if (cleaned.sunExposure === null) cleaned.sunExposure = undefined;
  if (cleaned.seatingCapacity === null || Number.isNaN(cleaned.seatingCapacity))
    cleaned.seatingCapacity = undefined;
  if (cleaned.isCovered === null) cleaned.isCovered = undefined;
  if (cleaned.isHeated === null) cleaned.isHeated = undefined;
  if (cleaned.isFamilyFriendly === null) cleaned.isFamilyFriendly = undefined;
  if (cleaned.petFriendly === null) cleaned.petFriendly = undefined;
  if (cleaned.pubId === null) cleaned.pubId = undefined;
  return cleaned;
}
