import "@testing-library/jest-dom/vitest";

// Node 24+ exposes an experimental global `localStorage`/`sessionStorage` that
// is unavailable without `--localstorage-file`, shadowing jsdom's own
// implementation and leaving it `undefined` in tests. Polyfill with a simple
// in-memory Storage when that happens.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

for (const key of ["localStorage", "sessionStorage"] as const) {
  if (typeof globalThis[key] === "undefined") {
    Object.defineProperty(globalThis, key, {
      value: createMemoryStorage(),
      writable: true,
      configurable: true,
    });
  }
  if (typeof window !== "undefined" && typeof window[key] === "undefined") {
    Object.defineProperty(window, key, {
      value: globalThis[key],
      writable: true,
      configurable: true,
    });
  }
}
