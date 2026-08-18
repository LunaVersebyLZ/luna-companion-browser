import { useLuna } from "@/lib/luna-store";

export function ReminderToast() {
  const { dueMemory, dismissDue, openTab } = useLuna();
  if (!dueMemory) return null;
  return (
    <div className="animate-rise fixed left-1/2 top-6 z-[60] w-[380px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-3xl border border-primary/40 bg-card p-4 shadow-float">
      <p className="text-[13px] font-medium">Hey! Remember this? 👀</p>
      <p className="mt-1 text-[12px] text-muted-foreground">
        You asked me to remind you {dueMemory.dueLabel ?? "about this"} —
      </p>
      <button
        onClick={() => {
          openTab(dueMemory.url);
          dismissDue();
        }}
        className="mt-2 w-full rounded-2xl bg-secondary p-2.5 text-left text-[12.5px] font-medium transition hover:bg-accent"
      >
        {dueMemory.title}
        {dueMemory.snippet && (
          <span className="mt-1 block line-clamp-2 text-[11px] font-normal italic text-muted-foreground">
            “{dueMemory.snippet}”
          </span>
        )}
      </button>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => {
            openTab(dueMemory.url);
            dismissDue();
          }}
          className="flex-1 rounded-full bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground"
        >
          Take me back
        </button>
        <button
          onClick={dismissDue}
          className="rounded-full border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-secondary"
        >
          Later
        </button>
      </div>
    </div>
  );
}
