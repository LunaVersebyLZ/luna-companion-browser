import { ShieldCheck, X } from "lucide-react";
import { useLuna, type Permissions } from "@/lib/luna-store";
import { cn } from "@/lib/utils";

const ITEMS: { key: keyof Permissions; label: string; desc: string }[] = [
  { key: "currentPage", label: "Current page", desc: "Luna can read the page you're on — only when you ask." },
  { key: "selectedText", label: "Selected text", desc: "Luna can use text you highlight as context." },
  { key: "tabs", label: "Tabs & workspace", desc: "Luna can see which tabs are open in this workspace." },
  { key: "memory", label: "Memory", desc: "Luna can keep saved pages and reminders for you." },
  { key: "notifications", label: "Notifications", desc: "Luna can nudge you when a reminder is due." },
  { key: "history", label: "Browsing history", desc: "Off by default. Luna never reads history silently." },
];

export function PrivacyPanel({ onClose }: { onClose: () => void }) {
  const { permissions, togglePermission } = useLuna();
  return (
    <aside className="animate-rise flex w-[320px] shrink-0 flex-col overflow-hidden rounded-3xl border border-border/70 shadow-soft glass">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <div>
            <h2 className="font-display text-sm font-semibold">What Luna can see</h2>
            <p className="text-[11px] text-muted-foreground">Nothing is recorded silently.</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Close privacy panel">
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="space-y-2 overflow-y-auto p-3">
        {ITEMS.map((it) => {
          const on = permissions[it.key];
          return (
            <button
              key={it.key}
              onClick={() => togglePermission(it.key)}
              className="flex w-full items-start gap-3 rounded-2xl border border-border/70 bg-card p-3 text-left transition hover:border-primary/40"
            >
              <span className="flex-1">
                <span className="block text-[12.5px] font-medium">{it.label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{it.desc}</span>
              </span>
              <span
                className={cn(
                  "mt-0.5 h-5 w-9 shrink-0 rounded-full p-0.5 transition",
                  on ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "block h-4 w-4 rounded-full bg-card shadow transition-transform",
                    on && "translate-x-4",
                  )}
                />
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
