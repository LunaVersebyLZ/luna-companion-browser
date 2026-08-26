// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Electron development uses a dedicated, fixed port so `wait-on` and Electron's
// loadURL always target the exact same server. `npm run electron:dev` sets
// LUNA_ELECTRON=1; outside that flow the hosted/sandbox defaults are untouched.
const isElectronDev = process.env.LUNA_ELECTRON === "1";
const electronPort = Number(process.env.LUNA_DEV_PORT || 8080);

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  ...(isElectronDev
    ? {
        vite: {
          server: {
            host: "127.0.0.1",
            port: electronPort,
            // Fail loudly instead of silently moving to 8081 and leaving Electron
            // pointed at an unrelated service.
            strictPort: true,
          },
        },
      }
    : {}),
});
