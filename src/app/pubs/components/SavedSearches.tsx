"use client";

import Link from "next/link";
import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import {
  defaultSavedSearchName,
  type SavedSearch,
  type SavedSearchParams,
  savedSearchToPubsUrl,
} from "@/lib/savedSearches";
import styles from "./SavedSearches.module.css";

const MAX_NAME_LENGTH = 100;

type Props = {
  isLoggedIn: boolean;
  /** The current filters as saved-search params, or null when none are set. */
  currentParams: SavedSearchParams | null;
  onRun: (params: SavedSearchParams) => void;
};

export default function SavedSearches({
  isLoggedIn,
  currentParams,
  onRun,
}: Props): ReactElement | null {
  const {
    savedSearches,
    savedSearchesLoading,
    savedSearchesError,
    createSavedSearch,
    renameSavedSearch,
    deleteSavedSearch,
  } = useSavedSearches(isLoggedIn);
  const [naming, setNaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [listError, setListError] = useState<string | null>(null);

  if (!isLoggedIn) {
    if (!currentParams) return null;
    return (
      <Link href="/register" className={styles.btn}>
        Log in to save this search
      </Link>
    );
  }

  const currentUrl = currentParams ? savedSearchToPubsUrl(currentParams) : null;
  const alreadySaved =
    currentUrl !== null &&
    savedSearches.some((s) => savedSearchToPubsUrl(s.params) === currentUrl);

  function startNaming(): void {
    if (!currentParams) return;
    setNameDraft(defaultSavedSearchName(currentParams).slice(0, MAX_NAME_LENGTH));
    setSaveError(null);
    setNaming(true);
  }

  async function handleSave(e: FormEvent): Promise<void> {
    e.preventDefault();
    const name = nameDraft.trim();
    if (!currentParams || !name) return;
    setSaving(true);
    const result = await createSavedSearch(name, currentParams);
    setSaving(false);
    if (result.ok) {
      setNaming(false);
    } else {
      setSaveError(result.error);
    }
  }

  function startRename(search: SavedSearch): void {
    setRenamingId(search.id);
    setRenameDraft(search.name);
    setListError(null);
  }

  async function handleRename(e: FormEvent, id: string): Promise<void> {
    e.preventDefault();
    const name = renameDraft.trim();
    if (!name) return;
    const result = await renameSavedSearch(id, name);
    if (result.ok) {
      setRenamingId(null);
    } else {
      setListError(result.error);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setListError(null);
    const result = await deleteSavedSearch(id);
    if (!result.ok) setListError(result.error);
  }

  function handleRun(search: SavedSearch): void {
    onRun(search.params);
    setListOpen(false);
  }

  return (
    <div className={styles.wrap}>
      {naming ? (
        <form className={styles.nameForm} onSubmit={handleSave}>
          <label htmlFor="saved-search-name" className={styles.srOnly}>
            Name this search
          </label>
          <input
            id="saved-search-name"
            className={styles.input}
            value={nameDraft}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setNaming(false);
            }}
            // biome-ignore lint/a11y/noAutofocus: the field appears in response to the user clicking "Save this search"
            autoFocus
          />
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={saving || !nameDraft.trim()}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" className={styles.btn} onClick={() => setNaming(false)}>
            Cancel
          </button>
          {saveError && (
            <span className={styles.error} role="alert">
              {saveError}
            </span>
          )}
        </form>
      ) : (
        <button
          type="button"
          className={styles.btn}
          onClick={startNaming}
          disabled={!currentParams || alreadySaved}
          title={currentParams ? undefined : "Set a search or filter to save it"}
        >
          {alreadySaved ? "Search saved" : "Save this search"}
        </button>
      )}

      <div className={styles.menu}>
        <button
          type="button"
          className={styles.btn}
          aria-expanded={listOpen}
          aria-controls="saved-searches-list"
          onClick={() => setListOpen((open) => !open)}
        >
          Saved searches
          {savedSearches.length > 0 && ` (${savedSearches.length})`}
        </button>

        {listOpen && (
          <div id="saved-searches-list" className={styles.panel}>
            {savedSearchesLoading && <p className={styles.muted}>Loading…</p>}
            {savedSearchesError && (
              <p className={styles.error} role="alert">
                {savedSearchesError}
              </p>
            )}
            {!savedSearchesLoading &&
              !savedSearchesError &&
              savedSearches.length === 0 && (
                <p className={styles.muted}>
                  No saved searches yet. Set a search or filters, then choose
                  &ldquo;Save this search&rdquo;.
                </p>
              )}
            {listError && (
              <p className={styles.error} role="alert">
                {listError}
              </p>
            )}
            <ul className={styles.list}>
              {savedSearches.map((search) => (
                <li key={search.id} className={styles.item}>
                  {renamingId === search.id ? (
                    <form
                      className={styles.renameForm}
                      onSubmit={(e) => handleRename(e, search.id)}
                    >
                      <label htmlFor={`rename-${search.id}`} className={styles.srOnly}>
                        New name for {search.name}
                      </label>
                      <input
                        id={`rename-${search.id}`}
                        className={styles.input}
                        value={renameDraft}
                        maxLength={MAX_NAME_LENGTH}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        // biome-ignore lint/a11y/noAutofocus: the field appears in response to the user clicking "Rename"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className={styles.linkBtn}
                        disabled={!renameDraft.trim()}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => setRenamingId(null)}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <a
                        href={savedSearchToPubsUrl(search.params)}
                        className={styles.name}
                        onClick={(e) => {
                          e.preventDefault();
                          handleRun(search);
                        }}
                      >
                        {search.name}
                      </a>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        aria-label={`Rename ${search.name}`}
                        onClick={() => startRename(search)}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        aria-label={`Delete ${search.name}`}
                        onClick={() => handleDelete(search.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
