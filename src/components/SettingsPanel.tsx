import { Search, X, Check } from "lucide-react";
import { useLuna } from "@/lib/luna-store";
import { SEARCH_ENGINES } from "@/lib/search-engines";
import { cn } from "@/lib/utils";

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { engineId, setEngineId } = useLuna();
  return (
    <aside className="animate-rise flex w-[320px] shrink-0 flex-col overflow-hidden rounded-3xl border border-border/70 shadow-soft glass">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <div>
            <h2 className="font-display text-sm font-semibold">Search settings</h2>
            <p className="text-[11px] text-muted-foreground">Google is Luna's default engine.</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
          aria-label="Close settings"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="space-y-2 overflow-y-auto p-3">
        <p className="px-1 text-[11px] text-muted-foreground">Default search engine</p>
        {SEARCH_ENGINES.map((e) => {
          const on = e.id === engineId;
          return (
            <button
              key={e.id}
              onClick={() => setEngineId(e.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left transition",
                on ? "border-primary/60" : "border-border/70 hover:border-primary/40",
              )}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/15 text-[11px] font-bold text-primary">
                {e.favicon}
              </span>
              <span className="flex-1">
                <span className="block text-[12.5px] font-medium">{e.name}</span>
                <span className="block text-[11px] text-muted-foreground">{e.domain}</span>
              </span>
              {on && <Check className="h-4 w-4 text-primary" />}
            </button>
          );
        })}
        <p className="px-1 pt-1 text-[11px] leading-snug text-muted-foreground">
          Typing a query in the address bar searches with your default engine. Typing an address
          goes straight to the site.
        </p>
      </div>
    </aside>
  );
}
