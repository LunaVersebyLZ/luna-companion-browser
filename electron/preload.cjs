/* Luna Browser preload — the ONLY bridge between Luna's React chrome and Electron.
 * It exposes a tiny, explicit browser API. No Node, no ipcRenderer, no fs.
 * Note: this preload is attached to Luna's own UI window only, never to websites.
 */
const { contextBridge, ipcRenderer } = require("electron");

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld("lunaNative", {
  isElectron: true,

  createTab: (id, url) => invoke("luna:tab:create", { id, url }),
  closeTab: (id) => invoke("luna:tab:close", { id }),
  activateTab: (id) => invoke("luna:tab:activate", { id }),
  navigate: (id, url) => invoke("luna:tab:navigate", { id, url }),
  back: (id) => invoke("luna:tab:back", { id }),
  forward: (id) => invoke("luna:tab:forward", { id }),
  reload: (id) => invoke("luna:tab:reload", { id }),
  setBounds: (b) => invoke("luna:bounds", b),
  setViewsVisible: (visible) => invoke("luna:views:visible", { visible }),
  extractPage: (id) => invoke("luna:tab:extract", { id }),

  onTabState: (cb) => {
    const handler = (_e, state) => cb(state);
    ipcRenderer.on("luna:tab:state", handler);
    return () => ipcRenderer.removeListener("luna:tab:state", handler);
  },
  onOpenRequest: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on("luna:tab:open-request", handler);
    return () => ipcRenderer.removeListener("luna:tab:open-request", handler);
  },
});
