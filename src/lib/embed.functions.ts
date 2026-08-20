import { createServerFn } from "@tanstack/react-start";

/** Checks whether a URL allows being displayed inside an iframe. */
export const checkEmbeddable = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const url = (data as { url?: string })?.url ?? "";
    if (!/^https?:\/\//i.test(url)) throw new Error("Invalid url");
    return { url };
  })
  .handler(async ({ data }) => {
    try {
      const res = await fetch(data.url, {
        method: "GET",
        redirect: "follow",
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          accept: "text/html",
        },
      });
      const xfo = (res.headers.get("x-frame-options") ?? "").toLowerCase();
      const csp = (res.headers.get("content-security-policy") ?? "").toLowerCase();
      const frameAncestors = /frame-ancestors([^;]*)/.exec(csp)?.[1]?.trim() ?? "";

      const blockedByXfo = xfo.includes("deny") || xfo.includes("sameorigin");
      const blockedByCsp =
        frameAncestors.length > 0 &&
        !frameAncestors.includes("*") &&
        !frameAncestors.includes("http");

      return { embeddable: !blockedByXfo && !blockedByCsp, finalUrl: res.url || data.url };
    } catch {
      // Network failure server-side doesn't necessarily mean the browser can't frame it.
      return { embeddable: true, finalUrl: data.url };
    }
  });
