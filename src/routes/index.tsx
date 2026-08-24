import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Lock,
  Plus,
  RotateCw,
  Search,
  Settings,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { LunaProvider, useLuna } from "@/lib/luna-store";
import { LunaRobot } from "@/components/LunaRobot";
import { AssistantPanel } from "@/components/AssistantPanel";
import { MemoryPanel } from "@/components/MemoryPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { PrivacyPanel } from "@/components/PrivacyPanel";
import { ReminderToast } from "@/components/ReminderToast";
import { WebView } from "@/components/WebView";
import { useNativeBrowser } from "@/lib/use-native-browser";
import { getEngine } from "@/lib/search-engines";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Luna Browser — a browser with a little AI companion" },
      {
        name: "description",
        content:
          "Luna Browser is a soft, futuristic browser with a cute animated robot companion that understands your page and remembers things for you.",
      },
      { property: "og:title", content: "Luna Browser — a browser with a little AI companion" },
      {
        property: "og:description",
        content:
          "A browser with a living robot companion: page-aware help, reminders, workspaces and transparent privacy controls.",
      },
    ],
  }),
  component: () => (
    <LunaProvider>
      <LunaBrowser />
    </LunaProvider>
  ),
});

function LunaBrowser() {
  const luna = useLuna();
  const {
    tabs,
    activeTabId,
    activePage,
    selectTab,
    closeTab,
    openTab,
    setSelection,
    selection,
    workspaces,
    workspaceId,
    setWorkspaceId,
    memories,
    setAssistantOpen,
    permissions,
    engineId,
  } = luna;
  const engine = getEngine(engineId);
  const [side, setSide] = useState<"memory" | "privacy" | "settings" | null>("memory");
  const [omni, setOmni] = useState("");
  const viewportRef = useRef<HTMLElement | null>(null);
  const nav = useNativeBrowser(viewportRef);

  useEffect(() => setOmni(activePage.url), [activePage]);


  const pending = memories.filter((m) => !m.done).length;

  return (
    <div className="flex h-screen flex-col gap-3 p-3">
      {/* chrome */}
      <div className="flex flex-col gap-2 rounded-3xl border border-border/70 px-3 pb-2 pt-2.5 shadow-soft glass">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 pl-1 pr-2">
            <span className="h-3 w-3 rounded-full bg-destructive/70" />
            <span className="h-3 w-3 rounded-full bg-sun" />
            <span className="h-3 w-3 rounded-full bg-primary/70" />
          </div>

          <div className="flex flex-1 items-center gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <div
                key={t.id}
                onClick={() => selectTab(t.id)}
                className={cn(
                  "group flex max-w-[210px] shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-3 py-1.5 text-[12px] transition",
                  t.id === activeTabId
                    ? "bg-card font-medium shadow-soft"
                    : "text-muted-foreground hover:bg-card/60",
                )}
              >
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-md bg-primary/15 text-[9px] font-bold text-primary">
                  {t.page.favicon}
                </span>
                <span className="truncate">{t.page.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.id);
                  }}
                  aria-label="Close tab"
                  className="opacity-0 transition group-hover:opacity-60 hover:!opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => openTab("notes")}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-card"
              aria-label="New tab"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-card/70 p-1">
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => setWorkspaceId(w.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] transition",
                  w.id === workspaceId
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="mr-1">{w.glyph}</span>
                {w.name}
              </button>
            ))}
          </div>
        </div>

        {/* omnibox row */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 text-muted-foreground">
            <button
              onClick={() => nav.back()}
              disabled={nav.isNative && !nav.canGoBack}
              className="rounded-full p-1.5 transition hover:bg-card disabled:opacity-35"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => nav.forward()}
              disabled={nav.isNative && !nav.canGoForward}
              className="rounded-full p-1.5 transition hover:bg-card disabled:opacity-35"
              aria-label="Forward"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => nav.reload()}
              className="rounded-full p-1.5 transition hover:bg-card"
              aria-label="Reload"
            >
              <RotateCw className={cn("h-4 w-4", nav.loading && "animate-spin")} />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              luna.navigate(omni);
            }}
            className="flex flex-1 items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-1.5"
          >
            <Lock className="h-3 w-3 text-primary" />
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Search className="h-3 w-3" />
              {engine.name}
            </span>
            <input
              value={omni}
              onChange={(e) => setOmni(e.target.value)}
              className="flex-1 bg-transparent text-[12.5px] outline-none"
              placeholder={`Search ${engine.name} or type a URL`}
              aria-label="Address bar"
            />
            <Star className="h-3.5 w-3.5 text-muted-foreground" />
          </form>
          <button
            onClick={() => setSide(side === "memory" ? null : "memory")}
            className={cn(
              "relative rounded-full border border-border/70 p-2 transition hover:bg-card",
              side === "memory" && "bg-card",
            )}
            aria-label="Memories"
          >
            <Bell className="h-4 w-4" />
            {pending > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setSide(side === "settings" ? null : "settings")}
            className={cn(
              "rounded-full border border-border/70 p-2 transition hover:bg-card",
              side === "settings" && "bg-card",
            )}
            aria-label="Search settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSide(side === "privacy" ? null : "privacy")}
            className={cn(
              "rounded-full border border-border/70 p-2 transition hover:bg-card",
              side === "privacy" && "bg-card",
            )}
            aria-label="Privacy controls"
          >
            <ShieldCheck className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* viewport */}
      <div className="flex min-h-0 flex-1 gap-3">
        <main
          className="flex-1 overflow-y-auto rounded-3xl border border-border/70 bg-card shadow-soft"
          onMouseUp={() => {
            const s = window.getSelection()?.toString().trim() ?? "";
            if (s.length > 3) {
              setSelection(s);
              luna.pulse("curious", 2000);
            }
          }}
        >
          {activePage.kind === "web" ? (
            <WebView url={activePage.href ?? ""} />
          ) : (
            <article className="mx-auto max-w-2xl px-10 py-12">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {activePage.domain} · {activePage.category}
              </p>
              <h1 className="mt-3 text-4xl font-semibold">{activePage.hero ?? activePage.title}</h1>
              <div className="mt-8 space-y-7">
                {activePage.sections.map((s) => (
                  <section key={s.heading}>
                    <h2 className="text-lg font-semibold">{s.heading}</h2>
                    <p className="mt-2 text-[14.5px] leading-7 text-foreground/85">{s.body}</p>
                  </section>
                ))}
              </div>
              <p className="mt-12 rounded-2xl bg-secondary px-4 py-3 text-[12px] text-muted-foreground">
                Tip: highlight a sentence, then click Luna and say “explain this part” or “remember
                this for tonight”.
              </p>
            </article>
          )}
        </main>

        {side === "memory" && <MemoryPanel onClose={() => setSide(null)} />}
        {side === "privacy" && <PrivacyPanel onClose={() => setSide(null)} />}
        {side === "settings" && <SettingsPanel onClose={() => setSide(null)} />}
      </div>

      {/* status */}
      <div className="flex items-center gap-2 px-2 text-[11px] text-muted-foreground">
        <span>
          {permissions.currentPage ? "Luna can read this page when asked" : "Page access off"}
        </span>
        {selection && permissions.selectedText && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-foreground">
            selection captured · {selection.split(/\s+/).length} words
          </span>
        )}
      </div>

      <LunaRobot onOpen={() => setAssistantOpen(!luna.assistantOpen)} />
      <AssistantPanel />
      <ReminderToast />
    </div>
  );
}
