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
    kind: "search",
    query,
    engineId: engine.id,
    href,
    url: href.replace(/^https?:\/\//, ""),
    domain: engine.domain,
    title: `${query} — ${engine.name}`,
    favicon: engine.favicon,
    category: "Search",
    hero: `${query}`,
    sections: [
      {
        heading: `Live ${engine.name} results`,
        body: `Luna is searching ${engine.name} for “${query}” and showing the results right here.`,
      },
    ],
  };
}

export function makeReaderPage(url: string, title: string): import("./mock-web").MockPage {
  const domain = url.replace(/^https?:\/\//, "").split("/")[0]!.replace(/^www\./, "");
  return {
    kind: "reader",
    href: url,
    url: url.replace(/^https?:\/\//, ""),
    domain,
    title: title || domain,
    favicon: domain.slice(0, 1).toUpperCase(),
    category: "Web",
    hero: title || domain,
    sections: [],
  };
}
