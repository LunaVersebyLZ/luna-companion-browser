/** Typed access to the Electron bridge exposed by electron/preload.cjs.
 *  In the plain web build `getNative()` returns null and Luna falls back to
 *  the iframe-based <WebView />, so the same React code runs in both. */

export type NativeTabState = {
  id: string;
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
  error?: string;
};

export type LunaNative = {
  isElectron: true;
  createTab: (id: string, url: string | null) => Promise<boolean>;
  closeTab: (id: string) => Promise<boolean>;
  activateTab: (id: string) => Promise<boolean>;
  navigate: (id: string, url: string) => Promise<boolean>;
  back: (id: string) => Promise<boolean>;
  forward: (id: string) => Promise<boolean>;
  reload: (id: string) => Promise<boolean>;
  setBounds: (b: { x: number; y: number; width: number; height: number }) => Promise<boolean>;
  setViewsVisible: (visible: boolean) => Promise<boolean>;
  extractPage: (id: string) => Promise<{ text: string; title: string; url: string }>;
  onTabState: (cb: (s: NativeTabState) => void) => () => void;
  onOpenRequest: (cb: (p: { url: string }) => void) => () => void;
};

declare global {
  interface Window {
    lunaNative?: LunaNative;
  }
}

export function getNative(): LunaNative | null {
  if (typeof window === "undefined") return null;
  return window.lunaNative ?? null;
}

export function isNative() {
  return getNative() !== null;
}
