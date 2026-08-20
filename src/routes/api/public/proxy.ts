import { createFileRoute } from "@tanstack/react-router";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/**
 * Same-origin page proxy so Luna can display sites that refuse to be framed.
 * Read-only: GET requests to public http(s) pages, HTML rewritten so links stay inside Luna.
 */
export const Route = createFileRoute("/api/public/proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const target = new URL(request.url).searchParams.get("url");
        if (!target) return new Response("missing url", { status: 400 });

        let parsed: URL;
        try {
          parsed = new URL(target);
        } catch {
          return new Response("bad url", { status: 400 });
        }
        if (!/^https?:$/.test(parsed.protocol)) {
          return new Response("unsupported protocol", { status: 400 });
        }

        let upstream: Response;
        try {
          upstream = await fetch(parsed.toString(), {
            headers: {
              "user-agent": UA,
              accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "accept-language": "en-US,en;q=0.9",
            },
            redirect: "follow",
          });
        } catch {
          return new Response("upstream fetch failed", { status: 502 });
        }

        const type = upstream.headers.get("content-type") ?? "";
        if (!type.includes("text/html")) {
          return new Response(upstream.body, {
            status: upstream.status,
            headers: { "content-type": type || "application/octet-stream" },
          });
        }

        const html = await upstream.text();
        const finalUrl = upstream.url || parsed.toString();
        return new Response(rewrite(html, finalUrl), {
          status: upstream.status,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});

const px = (u: string) => `/api/public/proxy?url=${encodeURIComponent(u)}`;

function rewrite(html: string, base: string) {
  let out = html
    // drop meta-based framing/CSP restrictions
    .replace(/<meta[^>]+http-equiv=["']?(content-security-policy|x-frame-options)[^>]*>/gi, "")
    // strip integrity attributes (assets go through absolute origins)
    .replace(/\sintegrity=(["'])[^"']*\1/gi, "");

  // absolutise + proxy navigable links so browsing stays inside Luna
  out = out.replace(/\shref=(["'])(.*?)\1/gi, (m, q, raw: string) => {
    if (/^(#|javascript:|mailto:|data:|about:)/i.test(raw)) return m;
    let abs: string;
    try {
      abs = new URL(raw, base).toString();
    } catch {
      return m;
    }
    // stylesheets/icons should load directly, only page links get proxied
    if (/\.(css|ico|png|jpe?g|svg|webp|woff2?)($|\?)/i.test(abs)) return ` href=${q}${abs}${q}`;
    return ` href=${q}${px(abs)}${q}`;
  });

  // absolutise asset URLs
  out = out.replace(/\s(src|action|poster)=(["'])(.*?)\2/gi, (m, attr, q, raw: string) => {
    if (/^(data:|javascript:|about:|blob:)/i.test(raw)) return m;
    try {
      return ` ${attr}=${q}${new URL(raw, base).toString()}${q}`;
    } catch {
      return m;
    }
  });

  const baseTag = `<base href="${base}"><meta name="referrer" content="no-referrer">`;
  return /<head[^>]*>/i.test(out)
    ? out.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`)
    : baseTag + out;
}
