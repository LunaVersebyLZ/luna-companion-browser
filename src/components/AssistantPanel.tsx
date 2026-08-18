import { useEffect, useRef, useState } from "react";
import { Send, X, Sparkles, Eye, TextSelect, Layers } from "lucide-react";
import { useLuna } from "@/lib/luna-store";
import { detectIntent, explain, quizFrom, summarize } from "@/lib/assistant";
import { cn } from "@/lib/utils";

type Msg = { id: number; role: "user" | "luna"; text: string };

const SUGGESTIONS = [
  "Summarize what I'm reading",
  "Explain this part",
  "Remember this for tonight",
  "Quiz me on this later",
  "What were the sites I was using?",
];

export function AssistantPanel() {
  const luna = useLuna();
  const {
    assistantOpen,
    setAssistantOpen,
    activePage,
    selection,
    tabs,
    memories,
    permissions,
    addMemory,
    workspaceId,
    workspaces,
    pulse,
  } = luna;
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 0,
      role: "luna",
      text: "Hi! I'm Luna 🌙 I only look at your page when you ask me to. What are we doing?",
    },
  ]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (assistantOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [assistantOpen]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [msgs, assistantOpen]);

  if (!assistantOpen) return null;

  const wsName = workspaces.find((w) => w.id === workspaceId)?.name ?? "Study";

  function reply(text: string) {
    const intent = detectIntent(text);
    const page = permissions.currentPage ? activePage : null;
    const sel = permissions.selectedText ? selection : "";

    if (!page && intent.kind !== "memories") {
      return "Page access is off right now, so I genuinely can't see what you're reading. Flip on “Current page” in the privacy panel and ask me again 🙂";
    }

    if (intent.kind === "remember") {
      const mem = addMemory({
        kind: intent.memKind,
        title: page!.title,
        url: page!.url,
        snippet: sel || page!.sections[0]?.body.slice(0, 160) + "…",
        note: text,
        workspaceId,
        dueAt: intent.dueAt,
        dueLabel: intent.dueLabel,
      });
      if (intent.memKind === "quiz")
        return `Saved for a quiz ${mem.dueLabel} 📚 I'll ping you with:\n\n${quizFrom(page!).join("\n")}`;
      return mem.dueAt
        ? `Got it — I'll remind you ${mem.dueLabel} about **${page!.title}**${sel ? ", and I kept the bit you selected" : ""}. Filed under ${wsName} ✿`
        : `Saved **${page!.title}** to your ${wsName} workspace. No time attached — tell me when and I'll nudge you.`;
    }
    if (intent.kind === "summarize") {
      pulse("thinking", 1200);
      return `Here's the gist of **${page!.title}**:\n\n${summarize(page!, sel)}`;
    }
    if (intent.kind === "explain") return explain(page!, sel);
    if (intent.kind === "tabs") {
      if (!permissions.tabs) return "Tab access is off — turn it on in privacy if you want me to see your open tabs.";
      return `You've got ${tabs.length} tabs in **${wsName}**:\n\n${tabs
        .map((t, i) => `${i + 1}. ${t.page.title} — ${t.page.domain}`)
        .join("\n")}`;
    }
    if (intent.kind === "memories") {
      if (!permissions.memory) return "Memory is switched off, so I'm not keeping anything for you right now.";
      if (!memories.length) return "Nothing yet — say “remember this for tonight” on any page and I'll hold onto it.";
      return `I'm holding ${memories.length} thing${memories.length > 1 ? "s" : ""}:\n\n${memories
        .slice(0, 5)
        .map((m) => `• ${m.title}${m.dueLabel ? ` — ${m.dueLabel}` : ""}`)
        .join("\n")}`;
    }
    return `I'm looking at **${page!.title}**${sel ? ` and the text you selected` : ""}. I can summarize it, explain a tricky part, quiz you later, or remember it for you — just say the word.`;
  }

  function send(text: string) {
    const value = text.trim();
    if (!value) return;
    setMsgs((m) => [...m, { id: Date.now(), role: "user", text: value }]);
    setInput("");
    pulse("thinking", 900);
    const answer = reply(value);
    setTimeout(() => {
      setMsgs((m) => [...m, { id: Date.now() + 1, role: "luna", text: answer }]);
      inputRef.current?.focus();
    }, 550);
  }

  return (
    <div className="animate-rise fixed bottom-6 right-6 z-40 flex h-[520px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-border/70 shadow-float glass">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <p className="font-display text-sm font-semibold">Luna</p>
          <p className="text-[11px] text-muted-foreground">companion · {wsName} workspace</p>
        </div>
        <button
          onClick={() => setAssistantOpen(false)}
          className="rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary"
          aria-label="Close assistant"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex flex-wrap gap-1.5 border-b border-border/60 px-4 py-2 text-[10px]">
        <Chip on={permissions.currentPage} icon={<Eye className="h-3 w-3" />} label={activePage.domain} />
        <Chip
          on={permissions.selectedText && !!selection}
          icon={<TextSelect className="h-3 w-3" />}
          label={selection ? `${selection.split(/\s+/).length} words selected` : "no selection"}
        />
        <Chip on={permissions.tabs} icon={<Layers className="h-3 w-3" />} label={`${tabs.length} tabs`} />
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[86%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed animate-rise",
              m.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {m.text.split("**").map((part, i) =>
              i % 2 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-4 pb-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border/60 px-3 py-3"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Luna about this page…"
          className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="rounded-full bg-primary p-2 text-primary-foreground transition hover:opacity-90"
          aria-label="Send"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

function Chip({ on, icon, label }: { on: boolean; icon: React.ReactNode; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
        on
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border bg-muted text-muted-foreground line-through",
      )}
    >
      {icon}
      {label}
    </span>
  );
}
