import { Bell, BookMarked, Check, GraduationCap, Trash2, X } from "lucide-react";
import { useLuna, type Memory } from "@/lib/luna-store";
import { cn } from "@/lib/utils";

const icons = {
  reminder: Bell,
  saved: BookMarked,
  quiz: GraduationCap,
};

export function MemoryPanel({ onClose }: { onClose: () => void }) {
  const { memories, toggleMemoryDone, removeMemory, openTab, workspaces } = useLuna();

  return (
    <aside className="animate-rise flex w-[320px] shrink-0 flex-col overflow-hidden rounded-3xl border border-border/70 shadow-soft glass">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <h2 className="font-display text-sm font-semibold">Luna remembers</h2>
          <p className="text-[11px] text-muted-foreground">{memories.length} saved item(s)</p>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Close memory panel">
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {!memories.length && (
          <p className="px-2 py-8 text-center text-[12px] text-muted-foreground">
            Nothing yet. Select some text, click Luna and say “remember this for tonight”.
          </p>
        )}
        {memories.map((m: Memory) => {
          const Icon = icons[m.kind];
          const ws = workspaces.find((w) => w.id === m.workspaceId);
          return (
            <div
              key={m.id}
              className={cn(
                "group rounded-2xl border border-border/70 bg-card p-3 transition hover:border-primary/40",
                m.done && "opacity-50",
              )}
            >
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <button
                  onClick={() => openTab(m.url)}
                  className="flex-1 text-left text-[12.5px] font-medium leading-snug hover:underline"
                >
                  {m.title}
                </button>
              </div>
              {m.snippet && (
                <p className="mt-1.5 line-clamp-2 border-l-2 border-accent pl-2 text-[11px] italic text-muted-foreground">
                  {m.snippet}
                </p>
              )}
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="rounded-full bg-secondary px-2 py-0.5">{ws?.glyph} {ws?.name}</span>
                {m.dueLabel && (
                  <span className="rounded-full bg-primary/12 px-2 py-0.5 text-foreground">{m.dueLabel}</span>
                )}
                <span className="ml-auto flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => toggleMemoryDone(m.id)} aria-label="Toggle done" className="rounded-full p-1 hover:bg-secondary">
                    <Check className="h-3 w-3" />
                  </button>
                  <button onClick={() => removeMemory(m.id)} aria-label="Forget" className="rounded-full p-1 hover:bg-secondary">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
