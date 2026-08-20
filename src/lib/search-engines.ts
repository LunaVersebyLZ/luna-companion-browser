import type { MockPage } from "./mock-web";

export type SearchEngine = {
  id: string;
  name: string;
  domain: string;
  favicon: string;
  searchUrl: (q: string) => string;
};

export const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: "google",
    name: "Google",
    domain: "google.com",
    favicon: "G",
    searchUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "bing",
    name: "Bing",
    domain: "bing.com",
    favicon: "B",
    searchUrl: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    domain: "duckduckgo.com",
    favicon: "D",
    searchUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  },
  {
    id: "brave",
    name: "Brave Search",
    domain: "search.brave.com",
    favicon: "V",
    searchUrl: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
  },
];

export const DEFAULT_ENGINE_ID = "google";

export function getEngine(id: string): SearchEngine {
  return SEARCH_ENGINES.find((e) => e.id === id) ?? SEARCH_ENGINES[0]!;
}

/** True when the typed text should be treated as an address instead of a query. */
export function isUrlLike(input: string) {
  const s = input.trim();
  if (!s || /\s/.test(s)) return false;
  if (/^https?:\/\//i.test(s) || s.startsWith("localhost")) return true;
  return /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(s);
}

export function toHref(input: string) {
  const s = input.trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

/** A real web page rendered inside Luna (search results included — Google renders its own page). */
export function makeWebPage(url: string, title?: string): MockPage {
  const domain = url.replace(/^https?:\/\//, "").split("/")[0]!.replace(/^www\./, "");
  return {
    kind: "web",
    href: url,
    url,
    domain,
    title: title || domain,
    favicon: domain.slice(0, 1).toUpperCase(),
    category: "Web",
    hero: title || domain,
    sections: [],
  };
}

export function makeSearchUrl(query: string, engine: SearchEngine) {
  return engine.searchUrl(query);
}

/** Backwards-compatible aliases so old imports never break typecheck. */
export const makeReaderPage = makeWebPage;
export const makeSearchPage = makeWebPage;

