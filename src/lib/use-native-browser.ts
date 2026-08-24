import { useCallback, useEffect, useRef, useState } from "react";
import { useLuna } from "@/lib/luna-store";
import { getNative, type NativeTabState } from "@/lib/native-browser";

/**
 * Keeps Luna's React tab model in sync with one Electron WebContentsView per tab.
 * Websites load as real top-level Chromium documents; Luna's chrome stays React.
 * Returns no-ops in the browser build so the UI code never branches.
 */
export function useNativeBrowser(viewportRef: React.RefObject<HTMLElement | null>) {
  const { tabs, activeTabId, activePage, navigate, updateActivePage } = useLuna();
  const native = getNative();
  const [states, setStates] = useState<Record<string, NativeTabState>>({});
  const lastUrl = useRef<Record<string, string>>({});
  const known = useRef<Set<string>>(new Set());

  /* Reserve the viewport rectangle for the native views. */
  useEffect(() => {
    if (!native) return;
    const el = viewportRef.current;
    if (!el) return;
    const push = () => {
      const r = el.getBoundingClientRect();
      void native.setBounds({ x: r.left, y: r.top, width: r.width, height: r.height });
    };
    push();
    const ro = new ResizeObserver(push);
    ro.observe(el);
    window.addEventListener("scroll", push, true);
    window.addEventListener("resize", push);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", push, true);
      window.removeEventListener("resize", push);
    };
  }, [native, viewportRef]);

  /* Navigation events coming back from Chromium. */
  useEffect(() => {
    if (!native) return;
    return native.onTabState((s) => {
      lastUrl.current[s.id] = s.url;
      setStates((prev) => ({ ...prev, [s.id]: { ...prev[s.id], ...s } }));
    });
  }, [native]);

  /* target=_blank / window.open from a site becomes a real Luna tab. */
  useEffect(() => {
    if (!native) return;
    return native.onOpenRequest(({ url }) => navigate(url));
  }, [native, navigate]);

  /* Create / navigate / dispose views to mirror the React tab list. */
  useEffect(() => {
    if (!native) return;
    const ids = new Set(tabs.map((t) => t.id));
    for (const id of [...known.current]) {
      if (!ids.has(id)) {
        known.current.delete(id);
        delete lastUrl.current[id];
        void native.closeTab(id);
      }
    }
    for (const t of tabs) {
      const href = t.page.kind === "web" ? (t.page.href ?? t.page.url) : null;
      if (!href) continue;
      if (!known.current.has(t.id)) {
        known.current.add(t.id);
        lastUrl.current[t.id] = href;
        void native.createTab(t.id, href);
      } else if (lastUrl.current[t.id] !== href) {
        lastUrl.current[t.id] = href;
        void native.navigate(t.id, href);
      }
    }
  }, [native, tabs]);

  /* Show only the active tab's view; hide everything for Luna's own mock pages. */
  useEffect(() => {
    if (!native) return;
    if (activePage.kind === "web" && known.current.has(activeTabId)) {
      void native.activateTab(activeTabId);
    } else {
      void native.setViewsVisible(false);
    }
  }, [native, activeTabId, activePage]);

  /* Mirror the live URL/title from Chromium into Luna's tab model. */
  const live = states[activeTabId];
  useEffect(() => {
    if (!native || !live || activePage.kind !== "web") return;
    const patch: Partial<MockPage> = {};
    if (live.url && live.url !== activePage.href) {
      patch.href = live.url;
      patch.url = live.url;
      try {
        patch.domain = new URL(live.url).hostname.replace(/^www\./, "");
      } catch {
        /* ignore */
      }
    }
    if (live.title && live.title !== activePage.title) patch.title = live.title;

    if (Object.keys(patch).length) {
      lastUrl.current[activeTabId] = live.url;
      updateActivePage(patch);
    }
  }, [native, live, activePage, activeTabId, updateActivePage]);

  const back = useCallback(() => native?.back(activeTabId), [native, activeTabId]);
  const forward = useCallback(() => native?.forward(activeTabId), [native, activeTabId]);
  const reload = useCallback(() => native?.reload(activeTabId), [native, activeTabId]);

  return {
    isNative: !!native,
    canGoBack: live?.canGoBack ?? false,
    canGoForward: live?.canGoForward ?? false,
    loading: live?.loading ?? false,
    back,
    forward,
    reload,
  };
}
