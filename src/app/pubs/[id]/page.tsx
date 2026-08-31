"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Typography from "@/app/components/typography/typography";
import UnapprovedBanner from "@/app/components/unapproved-banner/UnapprovedBanner";
import { PUB_AMENITY_FIELDS } from "@/constants/pubFormFields";
import { useAuth } from "@/hooks/useAuth";
import { useBeerTypes } from "@/hooks/useBeerTypes";
import { useCountries } from "@/hooks/useCountries";
import type { BeerGarden, OpeningHoursMap, Pub, PubHistoryChange, PubHistoryEntry } from "@/types/pub";
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

export default function PubPage(): ReactElement {
  const { id } = useParams();
  const router = useRouter();
  const [pub, setPub] = useState<Pub | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<Partial<Pub>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PubTab>("overview");
  const [codeTab, setCodeTab] = useState<CodeTab>("curl");
  const [copied, setCopied] = useState<"id" | "code" | null>(null);
  const [history, setHistory] = useState<PubHistoryEntry[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const { user } = useAuth();
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

  useEffect(() => {
    if (activeTab !== "history" || history !== null || !id) return;

    let ignore = false;
    async function fetchHistory(): Promise<void> {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await fetch(`/api/pubs/${id}/history`);
        const raw: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          if (!ignore) setHistoryError(extractErrorMessage(raw));
          return;
        }
        const data =
          raw && typeof raw === "object" && "data" in raw
            ? (raw as { data: unknown }).data
            : raw;
        const entries =
          data && typeof data === "object" && "history" in data
            ? (data as { history: unknown }).history
            : data;
        if (!ignore) setHistory(Array.isArray(entries) ? (entries as PubHistoryEntry[]) : []);
      } catch {
        if (!ignore) setHistoryError("Network error");
      } finally {
        if (!ignore) setHistoryLoading(false);
      }
    }
    fetchHistory();

    return () => {
      ignore = true;
    };
  }, [activeTab, history, id]);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setSaveError(extractErrorMessage(data));
      } else {
        setPub(data as Pub);
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data: unknown = await res.json();
        if (!res.ok) return extractErrorMessage(data);
        setPub(data as Pub);
        return null;
      } catch {
        return "Network error";
      }
    },
    [pub]
  );

  const isSaveDisabled = useMemo(
    () =>
      Object.values(fieldErrors).some(Boolean) ||
      (["name", "city", "address", "postcode", "country"] as (keyof Pub)[]).some(
        (f) => !editFields[f] || editFields[f]?.toString().trim() === ""
      ),
    [fieldErrors, editFields]
  );

  const activeAmenities = useMemo(
    () => (pub ? PUB_AMENITY_FIELDS.filter(({ key }) => pub[key]) : []),
    [pub]
  );

  const codeByTab = useMemo<Record<CodeTab, string>>(
    () => ({
      curl: pub ? `# Fetch this pub\ncurl https://api.thepubdb.com/api/v1/pubs/${pub.id} \\\n     -H "X-API-Key: $PUBDB_KEY"` : "",
      node: pub ? `const res = await fetch(\n  'https://api.thepubdb.com/api/v1/pubs/${pub.id}',\n  { headers: { 'X-API-Key': process.env.PUBDB_KEY } }\n);\nconst pub = await res.json();` : "",
      python: pub ? `import requests\nres = requests.get(\n  f'https://api.thepubdb.com/api/v1/pubs/${pub.id}',\n  headers={'X-API-Key': PUBDB_KEY}\n)\npub = res.json()` : "",
    }),
    [pub]
  );

  const jsonPreview = useMemo(
    () => (pub ? buildJsonPreview(pub) : ""),
    [pub]
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

  const handleDelete = async (): Promise<void> => {
    if (!confirm(`Are you sure you want to delete "${pub.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/pubs/${pub.id}`, {
        method: "DELETE",
      });
      if (res.ok) router.push("/pubs");
    } catch { /* ignore */ }
  };

  if (editing) {
    return (
      <div className={styles.page}>
        {/* Breadcrumb */}
        <nav className={styles.editBreadcrumb} aria-label="Breadcrumb">
          <Link href="/pubs" className={styles.editBreadcrumbLink}>Pubs</Link>
          <span className={styles.editBreadcrumbSep} aria-hidden="true">/</span>
          <span className={styles.editBreadcrumbLink}>{pub.city}</span>
          <span className={styles.editBreadcrumbSep} aria-hidden="true">/</span>
          <code className={styles.editBreadcrumbCode}>{displayId}</code>
          <span className={styles.editBreadcrumbSep} aria-hidden="true">/</span>
          <strong className={styles.editBreadcrumbCurrent} aria-current="page">Edit</strong>
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
              <span aria-hidden="true">×</span> Cancel
            </button>
            <button type="button" className={addPubStyles.submitBtn} onClick={handleSave} disabled={isSaveDisabled}>
              <span aria-hidden="true">✓</span> Save changes
            </button>
          </div>
        </div>

        {user && !user.approved && <UnapprovedBanner email={user.email} />}

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
        <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
        <span className={styles.breadcrumbLink}>{pub.city}</span>
        <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
        <code className={styles.breadcrumbId} aria-current="page">{displayId}</code>
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

      <CompletenessCard pub={pub} onEdit={user ? handleEditClick : undefined} />

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

          {/* Pub identity — aria-hidden: pub name is already the page h1 */}
          <p className={styles.pubNameLarge} aria-hidden="true">{pub.name}</p>
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
            <div
              className={styles.tabList}
              role="tablist"
              aria-label="Pub information"
              onKeyDown={(e) => {
                const TABS = ["overview", "beers", "hours", "garden", "history"] as PubTab[];
                const idx = TABS.indexOf(activeTab);
                let next = -1;
                if (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
                else if (e.key === "ArrowLeft") next = (idx - 1 + TABS.length) % TABS.length;
                else if (e.key === "Home") next = 0;
                else if (e.key === "End") next = TABS.length - 1;
                if (next !== -1) {
                  e.preventDefault();
                  setActiveTab(TABS[next]);
                  document.getElementById(`tab-${TABS[next]}`)?.focus();
                }
              }}
            >
              {(["overview", "beers", "hours", "garden", "history"] as PubTab[]).map((tab) => (
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
                  canEdit={!!user}
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
                <HistoryTab entries={history} loading={historyLoading} error={historyError} />
              )}
            </div>
          </div>
        </div>

        {/* Right column — API panel */}
        <div className={styles.rightCol}>
          {/* Code block */}
          <div className={styles.codePanel}>
            <div className={styles.codePanelHeader}>
              <div
                className={styles.codeTabs}
                role="tablist"
                aria-label="Code language"
                onKeyDown={(e) => {
                  const TABS = ["curl", "node", "python"] as CodeTab[];
                  const idx = TABS.indexOf(codeTab);
                  let next = -1;
                  if (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
                  else if (e.key === "ArrowLeft") next = (idx - 1 + TABS.length) % TABS.length;
                  else if (e.key === "Home") next = 0;
                  else if (e.key === "End") next = TABS.length - 1;
                  if (next !== -1) {
                    e.preventDefault();
                    setCodeTab(TABS[next]);
                    document.getElementById(`pub-code-tab-${TABS[next]}`)?.focus();
                  }
                }}
              >
                {(["curl", "node", "python"] as CodeTab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={codeTab === t}
                    id={`pub-code-tab-${t}`}
                    aria-controls="pub-code-panel"
                    tabIndex={codeTab === t ? 0 : -1}
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

function BeersTab({ pub }: { pub: Pub }): ReactElement {
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
  const map: OpeningHoursMap = {};
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

function HoursTab({ pub }: { pub: Pub }): ReactElement {
  const now = new Date();
  const jsDayIndex = now.getDay();
  const todayFull = WEEKDAYS[jsDayIndex === 0 ? 6 : jsDayIndex - 1].full;
  const isOpenNow = checkOpenNow(pub.openingHours, todayFull);

  const oh = pub.openingHours;
  const map: OpeningHoursMap = {};
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

function GardenTab({ pub }: { pub: Pub }): ReactElement {
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

const ACTION_LABELS: Record<string, string> = {
  CREATE: "created pub",
  UPDATE: "edited",
  DELETE: "deleted pub",
};

const ACTION_STYLES: Record<string, string> = {
  CREATE: styles.actionCreated,
  UPDATE: styles.actionEdited,
  DELETE: styles.actionDeleted,
};

// Fields that are either internal bookkeeping or too noisy/verbose to show as a
// raw from → to diff (PATCH sends the whole pub, so these "change" on every save).
const HIDDEN_HISTORY_FIELDS = new Set(["id", "createdAt", "updatedAt", "beerTypeIds"]);
const SUMMARY_ONLY_FIELDS = new Set(["openingHours", "beerTypes", "beerGardens"]);

const HISTORY_FIELD_LABELS: Record<string, string> = Object.fromEntries(
  PUB_AMENITY_FIELDS.map(({ key, label }) => [key, label])
);
Object.assign(HISTORY_FIELD_LABELS, {
  name: "Name",
  address: "Address",
  city: "City",
  postcode: "Postcode",
  country: "Country",
  phone: "Phone",
  website: "Website",
  description: "Description",
  operator: "Operator",
  type: "Type",
  area: "Area",
  borough: "Borough",
  chainName: "Chain",
  lat: "Latitude",
  lng: "Longitude",
  closedDown: "Closed down",
  openingHours: "Opening hours",
  beerTypes: "Beer types",
  beerGardens: "Beer gardens",
  imageUrl: "Image",
});

const BOOLEAN_HISTORY_FIELDS = new Set([...Object.keys(HISTORY_FIELD_LABELS)].filter((key) =>
  PUB_AMENITY_FIELDS.some((f) => f.key === key)
));
BOOLEAN_HISTORY_FIELDS.add("closedDown");

function humanizeFieldName(field: string): string {
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function historyFieldLabel(field: string): string {
  return HISTORY_FIELD_LABELS[field] ?? humanizeFieldName(field);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

function formatBoolean(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

function formatDateValue(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().slice(0, 10);
}

function looksLikeIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function formatScalarValue(value: unknown): string {
  if (isEmptyValue(value)) return "—";
  if (looksLikeIsoDate(value)) return formatDateValue(value);
  return String(value);
}

function describeFieldChange(field: string, change: PubHistoryChange): string | null {
  if (deepEqual(change.from, change.to)) return null;

  const label = historyFieldLabel(field);

  if (BOOLEAN_HISTORY_FIELDS.has(field)) {
    return `${label} ${formatBoolean(change.from)} → ${formatBoolean(change.to)}`;
  }

  if (SUMMARY_ONLY_FIELDS.has(field) || Array.isArray(change.from) || Array.isArray(change.to)) {
    if (isEmptyValue(change.from) && !isEmptyValue(change.to)) return `${label} added`;
    if (!isEmptyValue(change.from) && isEmptyValue(change.to)) return `${label} removed`;
    return `${label} updated`;
  }

  if (typeof change.from === "object" || typeof change.to === "object") {
    return `${label} updated`;
  }

  return `${label} ${formatScalarValue(change.from)} → ${formatScalarValue(change.to)}`;
}

function listChangedFields(changedFields: PubHistoryEntry["changedFields"]): string[] {
  if (!changedFields) return [];
  return Object.entries(changedFields)
    .filter(([field]) => !HIDDEN_HISTORY_FIELDS.has(field))
    .map(([field, change]) => describeFieldChange(field, change))
    .filter((part): part is string => Boolean(part));
}

const MAX_VISIBLE_FIELD_CHANGES = 4;

function HistoryRowDetail({ changes }: { changes: string[] }): ReactElement | null {
  const [expanded, setExpanded] = useState(false);

  if (changes.length === 0) return null;

  const visible = expanded ? changes : changes.slice(0, MAX_VISIBLE_FIELD_CHANGES);
  const remaining = changes.length - MAX_VISIBLE_FIELD_CHANGES;

  return (
    <span className={styles.historyDetail}>
      {" · "}
      {visible.join(", ")}
      {!expanded && remaining > 0 && (
        <>
          {", "}
          <button
            type="button"
            className={styles.historyMoreBtn}
            onClick={() => setExpanded(true)}
            aria-expanded={false}
          >
            +{remaining} more
          </button>
        </>
      )}
    </span>
  );
}

function HistoryTab({
  entries,
  loading,
  error,
}: {
  entries: PubHistoryEntry[] | null;
  loading: boolean;
  error: string | null;
}): ReactElement {
  if (loading) {
    return (
      <div className={styles.historyCard}>
        <div className={styles.historyCardHeader}>
          <span className={styles.historyCardTitle}>Edit history</span>
        </div>
        <p className={styles.hoursEmpty}>Loading history…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.historyCard}>
        <div className={styles.historyCardHeader}>
          <span className={styles.historyCardTitle}>Edit history</span>
        </div>
        <p className={styles.hoursEmpty}>{error}</p>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className={styles.historyCard}>
        <div className={styles.historyCardHeader}>
          <span className={styles.historyCardTitle}>Edit history</span>
        </div>
        <p className={styles.hoursEmpty}>No history recorded for this pub.</p>
      </div>
    );
  }

  return (
    <div className={styles.historyCard}>
      <div className={styles.historyCardHeader}>
        <span className={styles.historyCardTitle}>Edit history</span>
      </div>
      <div className={styles.historyRows}>
        {entries.map((entry) => {
          const actor = entry.username || "system";
          const initial = actor.charAt(0).toUpperCase();
          const color = avatarColor(initial);
          const changes = listChangedFields(entry.changedFields);
          return (
            <div key={entry.id} className={styles.historyRow}>
              <span
                className={styles.historyAvatar}
                style={{ background: color.bg, color: color.fg }}
                aria-hidden="true"
              >
                {initial}
              </span>
              <div className={styles.historyContent}>
                <span className={styles.historyActor}>{actor}</span>
                {" "}
                <span className={ACTION_STYLES[entry.action] || styles.actionEdited}>
                  {ACTION_LABELS[entry.action] || entry.action.toLowerCase()}
                </span>
                <HistoryRowDetail changes={changes} />
              </div>
              <span className={styles.historyTime}>{relativeTime(entry.timestamp)}</span>
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
