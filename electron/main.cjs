/* Luna Browser — Electron main process.
 * The React app (Luna's chrome: tabs, omnibox, robot, panels) is the window's
 * top-level document. Every browser tab is a real Chromium WebContentsView
 * layered over the reserved viewport area, so websites load as genuine
 * top-level documents — no iframes, no proxying, no scraping.
 */
const path = require("node:path");
const { app, BrowserWindow, WebContentsView, ipcMain, shell } = require("electron");

const DEV_URL = process.env.LUNA_DEV_URL || "http://localhost:8080";
const isDev = !app.isPackaged;

/** @type {BrowserWindow | null} */
let win = null;
/** @type {Map<string, WebContentsView>} */
const views = new Map();
let activeId = null;
let bounds = { x: 0, y: 0, width: 0, height: 0 };

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function stateOf(id, view, extra = {}) {
  const wc = view.webContents;
  return {
    id,
    url: wc.getURL(),
    title: wc.getTitle(),
    canGoBack: wc.navigationHistory ? wc.navigationHistory.canGoBack() : wc.canGoBack(),
    canGoForward: wc.navigationHistory
      ? wc.navigationHistory.canGoForward()
      : wc.canGoForward(),
    loading: wc.isLoading(),
    ...extra,
  };
}

function applyBounds() {
  for (const [id, view] of views) {
    view.setBounds(bounds);
    view.setVisible(id === activeId);
  }
}

function createTabView(id, url) {
  if (views.has(id)) return views.get(id);
  const view = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      // Websites are untrusted: no preload, no Node, no Luna APIs inside them.
    },
  });
  views.set(id, view);
  win.contentView.addChildView(view);
  view.setBounds(bounds);
  view.setVisible(id === activeId);
  view.setBorderRadius?.(20);

  const wc = view.webContents;
  const push = (extra) => send("luna:tab:state", stateOf(id, view, extra));

  wc.on("did-start-loading", () => push({ loading: true }));
  wc.on("did-stop-loading", () => push({ loading: false }));
  wc.on("did-navigate", () => push({}));
  wc.on("did-navigate-in-page", () => push({}));
  wc.on("did-redirect-navigation", () => push({}));
  wc.on("page-title-updated", () => push({}));
  wc.on("did-fail-load", (_e, code, desc, failedUrl, isMainFrame) => {
    if (isMainFrame && code !== -3) push({ error: `${desc} (${failedUrl})` });
  });

  // Popups / target=_blank become new Luna tabs instead of native windows.
  wc.setWindowOpenHandler(({ url: target }) => {
    if (/^https?:/i.test(target)) send("luna:tab:open-request", { url: target });
    else if (/^mailto:|^tel:/i.test(target)) shell.openExternal(target);
    return { action: "deny" };
  });

  if (url) wc.loadURL(url).catch(() => {});
  return view;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0b1016",
    title: "Luna Browser",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL(DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html")).catch(() => {
      win.loadURL(DEV_URL);
    });
  }

  win.on("resize", applyBounds);
  win.on("closed", () => {
    for (const view of views.values()) view.webContents.close();
    views.clear();
    win = null;
  });
}

/* ---------------- IPC: the only surface React can reach ---------------- */

ipcMain.handle("luna:tab:create", (_e, { id, url }) => {
  createTabView(id, url);
  return true;
});

ipcMain.handle("luna:tab:activate", (_e, { id }) => {
  activeId = id;
  applyBounds();
  const view = views.get(id);
  if (view) send("luna:tab:state", stateOf(id, view));
  return true;
});

ipcMain.handle("luna:tab:close", (_e, { id }) => {
  const view = views.get(id);
  if (!view) return false;
  win?.contentView.removeChildView(view);
  view.webContents.close();
  views.delete(id);
  if (activeId === id) activeId = null;
  return true;
});

ipcMain.handle("luna:tab:navigate", (_e, { id, url }) => {
  const view = views.get(id) || createTabView(id, null);
  if (/^https?:\/\//i.test(url)) view.webContents.loadURL(url).catch(() => {});
  return true;
});

ipcMain.handle("luna:tab:back", (_e, { id }) => {
  const wc = views.get(id)?.webContents;
  if (!wc) return false;
  if (wc.navigationHistory) wc.navigationHistory.goBack();
  else wc.goBack();
  return true;
});

ipcMain.handle("luna:tab:forward", (_e, { id }) => {
  const wc = views.get(id)?.webContents;
  if (!wc) return false;
  if (wc.navigationHistory) wc.navigationHistory.goForward();
  else wc.goForward();
  return true;
});

ipcMain.handle("luna:tab:reload", (_e, { id }) => {
  views.get(id)?.webContents.reload();
  return true;
});

ipcMain.handle("luna:bounds", (_e, b) => {
  bounds = {
    x: Math.round(b.x),
    y: Math.round(b.y),
    width: Math.max(0, Math.round(b.width)),
    height: Math.max(0, Math.round(b.height)),
  };
  applyBounds();
  return true;
});

/** Lets Luna's assistant read the active page's visible text — only on request. */
ipcMain.handle("luna:tab:extract", async (_e, { id }) => {
  const wc = views.get(id)?.webContents;
  if (!wc) return { text: "", title: "", url: "" };
  try {
    const text = await wc.executeJavaScript(
      "document.body ? document.body.innerText.slice(0, 20000) : ''",
      true,
    );
    return { text, title: wc.getTitle(), url: wc.getURL() };
  } catch {
    return { text: "", title: wc.getTitle(), url: wc.getURL() };
  }
});

/** Hides all web views (used when a modal/panel must sit above the page). */
ipcMain.handle("luna:views:visible", (_e, { visible }) => {
  for (const [id, view] of views) view.setVisible(visible && id === activeId);
  return true;
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
