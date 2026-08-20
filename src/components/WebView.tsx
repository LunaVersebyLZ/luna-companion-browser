import { useEffect, useRef, useState } from "react";
import { ExternalLink, Globe, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { checkEmbeddable } from "@/lib/embed.functions";

/** Renders a real web page inside Luna. Some sites refuse embedding, so we offer an escape hatch. */
export function WebView({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const check = useServerFn(checkEmbeddable);

  useEffect(() => {
    setLoaded(false);
    setBlocked(false);
    let alive = true;

    // Ask the server whether this site allows framing before we trust the iframe.
    if (!isKnownEmbeddable(url)) {
      check({ data: { url } })
        .then((r) => {
          if (alive && !r.embeddable) setBlocked(true);
        })
        .catch(() => {
          /* ignore — fall back to the timeout heuristic */
        });
    }

    const t = setTimeout(() => {
      setLoaded((l) => {
        if (!l) setBlocked(true);
        return l;
      });
    }, 8000);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [url, check]);

  return (
    <div className="relative h-full w-full">
      {!blocked && (
        <iframe
          ref={frame}
          key={url}
          src={embedUrl(url)}
          title={url}
          onLoad={() => setLoaded(true)}
          className="h-full w-full rounded-3xl bg-background"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      )}


      {!loaded && !blocked && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-3xl bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading {safeHost(url)}…
          </div>
        </div>
      )}

      {blocked && !loaded && (
        <div className="absolute inset-0 grid place-items-center rounded-3xl bg-card px-8 text-center">
          <div className="max-w-md">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">{safeHost(url)} blocks embedding</h2>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
              This site tells browsers it may only be displayed in its own window, so Luna can’t
              paint it inside this tab. Open it in a full window to continue.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open {safeHost(url)}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/** Google refuses normal framing, but its `igu=1` results page is designed to be embedded. */
function embedUrl(url: string) {
  try {
    const u = new URL(url);
    if (/(^|\.)google\.[a-z.]+$/i.test(u.hostname) && u.pathname === "/search") {
      u.searchParams.set("igu", "1");
      return u.toString();
    }
  } catch {
    /* fall through */
  }
  return url;
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
