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

export function makeSearchPage(query: string, engine: SearchEngine): MockPage {
  const href = engine.searchUrl(query);
  return {
    url: href.replace(/^https?:\/\//, ""),
    domain: engine.domain,
    title: `${query} — ${engine.name}`,
    favicon: engine.favicon,
    category: "Search",
    hero: `${query}`,
    sections: [
      {
        heading: `Searching ${engine.name}`,
        body: `Luna sent “${query}” to ${engine.name} and opened the live results in a new system tab. ${engine.name} is your default search engine — you can change it any time in Settings.`,
      },
      {
        heading: "Result URL",
        body: href,
      },
      {
        heading: "Ask Luna instead",
        body: `Click Luna and ask her to summarize, explain, or remember this search for later. She only reads what your privacy settings allow.`,
      },
    ],
  };
}
