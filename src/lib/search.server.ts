const UA =
  "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0";

export type SearchResult = { title: string; url: string; snippet: string; domain: string };
export type SearchResponse = { results: SearchResult[]; source: string; note?: string };

function decodeEntities(s: string) {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Official Google Programmable Search JSON API (used when keys are configured). */
async function googleApi(query: string): Promise<SearchResult[]> {
  const key = process.env["GOOGLE_SEARCH_API_KEY"];
  const cx = process.env["GOOGLE_SEARCH_CX"];
  if (!key || !cx) return [];
  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&num=10&q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return [];
  const json = (await res.json()) as {
    items?: { title?: string; link?: string; snippet?: string }[];
  };
  return (json.items ?? [])
    .filter((i) => i.link)
    .map((i) => ({
      url: i.link!,
      title: i.title ?? i.link!,
      snippet: i.snippet ?? "",
      domain: domainOf(i.link!),
    }));
}

/** Google's HTML endpoint (works when Google serves the no-JS variant). */
async function google(query: string): Promise<SearchResult[]> {
  const res = await fetch(
    `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10&hl=en&gbv=1`,
    { headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" } },
  );
  if (!res.ok) return [];
  const html = await res.text();
  const out: SearchResult[] = [];
  const re = /<a href="\/url\?q=([^&"]+)[^"]*"[^>]*>(?:.*?)<h3[^>]*>(.*?)<\/h3>/gs;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 12) {
    const url = decodeURIComponent(m[1]!);
    if (!/^https?:\/\//.test(url) || url.includes("google.com")) continue;
    out.push({ url, title: decodeEntities(m[2]!), snippet: "", domain: domainOf(url) });
  }
  return out;
}

/** DuckDuckGo's no-JS HTML endpoint — reliable server-side fallback. */
async function duck(query: string): Promise<SearchResult[]> {
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const out: SearchResult[] = [];
  const blocks = html.split('class="result results_links').slice(1);
  for (const b of blocks) {
    if (out.length >= 12) break;
    const link = /class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/s.exec(b);
    if (!link) continue;
    let url = link[1]!;
    if (url.startsWith("//")) url = `https:${url}`;
    const uddg = /[?&]uddg=([^&"]+)/.exec(url);
    if (uddg) url = decodeURIComponent(uddg[1]!);
    if (!/^https?:\/\//.test(url)) continue;
    const snip = /class="result__snippet"[^>]*>(.*?)<\/a>/s.exec(b);
    out.push({
      url,
      title: decodeEntities(link[2]!),
      snippet: snip ? decodeEntities(snip[1]!) : "",
      domain: domainOf(url),
    });
  }
  return out;
}

async function bing(query: string): Promise<SearchResult[]> {
  const res = await fetch(
    `https://www.bing.com/search?q=${encodeURIComponent(query)}&format=rss&count=15`,
    { headers: { "user-agent": UA } },
  );
  if (!res.ok) return [];
  const xml = await res.text();
  const out: SearchResult[] = [];
  for (const item of xml.split("<item>").slice(1)) {
    const t = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s.exec(item);
    const l = /<link>(.*?)<\/link>/s.exec(item);
    const d = /<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s.exec(item);
    if (!t || !l) continue;
    const url = decodeEntities(l[1]!);
    out.push({
      url,
      title: decodeEntities(t[1]!),
      snippet: d ? decodeEntities(d[1]!) : "",
      domain: domainOf(url),
    });
  }
  return out;
}

export async function fetchResults(query: string, engineId: string): Promise<SearchResponse> {
  try {
    if (engineId === "bing") {
      const r = await bing(query);
      if (r.length) return { results: r, source: "Bing" };
    }
    if (engineId === "google") {
      const r = await google(query);
      if (r.length) return { results: r, source: "Google" };
      const fb = await duck(query);
      return {
        results: fb,
        source: "Google",
        note: "Google blocked this server-side request, so Luna used a privacy-friendly mirror for these results.",
      };
    }
    const r = await duck(query);
    return { results: r, source: engineId === "brave" ? "Brave Search" : "DuckDuckGo" };
  } catch {
    return { results: [], source: engineId, note: "Search request failed. Try again." };
  }
}

export type ReadablePage = {
  url: string;
  title: string;
  domain: string;
  sections: { heading: string; body: string }[];
};

export async function fetchReadable(url: string): Promise<ReadablePage> {
  const domain = domainOf(url);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
    });
    const html = await res.text();
    const title = decodeEntities(/<title[^>]*>(.*?)<\/title>/s.exec(html)?.[1] ?? domain);
    const body = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ");

    const paras: string[] = [];
    const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) && paras.length < 40) {
      const text = decodeEntities(m[1]!).replace(/\s+/g, " ");
      if (text.length > 80) paras.push(text);
    }
    if (!paras.length) {
      const text = decodeEntities(body).replace(/\s+/g, " ").slice(0, 4000);
      if (text.length > 120) paras.push(text);
    }

    const sections = paras.slice(0, 14).map((body, i) => ({
      heading: i === 0 ? "Article" : `Continued (${i + 1})`,
      body,
    }));
    return {
      url,
      title,
      domain,
      sections: sections.length
        ? sections
        : [{ heading: "No readable text", body: "This page did not return readable text content." }],
    };
  } catch {
    return {
      url,
      title: domain,
      domain,
      sections: [{ heading: "Could not load", body: "Luna couldn't fetch this page." }],
    };
  }
}
