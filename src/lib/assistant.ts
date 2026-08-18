import type { MockPage } from "./mock-web";
import { pageText } from "./mock-web";

export type Intent =
  | { kind: "remember"; dueAt: number | null; dueLabel: string | null; memKind: "reminder" | "saved" | "quiz" }
  | { kind: "summarize" }
  | { kind: "explain" }
  | { kind: "tabs" }
  | { kind: "memories" }
  | { kind: "chat" };

function at(base: Date, h: number, m = 0) {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

export function parseWhen(text: string): { dueAt: number | null; label: string | null } {
  const t = text.toLowerCase();
  const now = new Date();

  const rel = t.match(/in (\d+)\s*(second|sec|minute|min|hour)/);
  if (rel) {
    const n = Number(rel[1]);
    const unit = rel[2]!;
    const ms = unit.startsWith("sec") ? n * 1000 : unit.startsWith("min") ? n * 60000 : n * 3600000;
    return { dueAt: Date.now() + ms, label: `in ${n} ${unit}${n > 1 ? "s" : ""}` };
  }

  const clock = t.match(/\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (clock) {
    let h = Number(clock[1]);
    const m = Number(clock[2] ?? 0);
    if (clock[3] === "pm" && h < 12) h += 12;
    if (clock[3] === "am" && h === 12) h = 0;
    let d = at(now, h, m);
    if (d.getTime() < Date.now()) d = new Date(d.getTime() + 86400000);
    return {
      dueAt: d.getTime(),
      label: `at ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
    };
  }

  if (/tonight|this evening/.test(t)) {
    let d = at(now, 20);
    if (d.getTime() < Date.now()) d = new Date(Date.now() + 60000);
    return { dueAt: d.getTime(), label: "tonight" };
  }
  if (/later today|in a bit|later on|\blater\b/.test(t)) {
    return { dueAt: Date.now() + 3 * 3600000, label: "later today" };
  }
  if (/tomorrow/.test(t)) {
    const d = at(new Date(now.getTime() + 86400000), 9);
    return { dueAt: d.getTime(), label: "tomorrow morning" };
  }
  if (/weekend/.test(t)) {
    const d = new Date(now);
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    return { dueAt: at(d, 10).getTime(), label: "this weekend" };
  }
  if (/next week/.test(t)) {
    const d = new Date(now.getTime() + 7 * 86400000);
    return { dueAt: at(d, 9).getTime(), label: "next week" };
  }
  const deadline = t.match(/before (?:the |my )?([a-z ]{3,20})/);
  if (deadline) {
    return { dueAt: Date.now() + 86400000, label: `before your ${deadline[1]!.trim()}` };
  }
  return { dueAt: null, label: null };
}

export function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/quiz|test me/.test(t)) {
    const { dueAt, label } = parseWhen(t);
    return { kind: "remember", dueAt: dueAt ?? Date.now() + 3 * 3600000, dueLabel: label ?? "later today", memKind: "quiz" };
  }
  if (/remember|remind|save (this|it)|keep this|i'?ll need this|don'?t let me forget|bookmark/.test(t)) {
    const { dueAt, label } = parseWhen(t);
    return { kind: "remember", dueAt, dueLabel: label, memKind: dueAt ? "reminder" : "saved" };
  }
  if (/summar|tl;?dr|gist|what'?s this (page|about)/.test(t)) return { kind: "summarize" };
  if (/explain|understand|what does this mean|confus|this part|eli5|simpler/.test(t))
    return { kind: "explain" };
  if (/tabs?|websites?|sites? i (was|am)|open pages/.test(t)) return { kind: "tabs" };
  if (/what (do|are) you remember|my memories|reminders/.test(t)) return { kind: "memories" };
  return { kind: "chat" };
}

function sentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);
}

export function summarize(page: MockPage, focus?: string) {
  const src = focus && focus.length > 40 ? focus : pageText(page);
  const ss = sentences(src);
  const picks = [ss[0], ss[Math.floor(ss.length / 2)], ss[ss.length - 1]].filter(
    (s, i, a): s is string => Boolean(s) && a.indexOf(s) === i,
  );
  return picks.map((s) => `• ${s}`).join("\n");
}

export function explain(page: MockPage, focus?: string) {
  const src = (focus && focus.length > 20 ? focus : page.sections[0]?.body) ?? "";
  const first = sentences(src)[0] ?? src;
  const key = page.hero ?? page.title;
  return `Okay — plain version 👇\n\n${first}\n\nThe short of it: **${key}** is really about how the pieces in this passage relate. Think of it as a rule that tells you what to expect before you measure or check anything. If one specific line is tripping you up, select it on the page and ask me again — I'll zoom in on exactly that.`;
}

export function quizFrom(page: MockPage) {
  return page.sections.slice(0, 3).map((s, i) => `${i + 1}. In your own words, what is "${s.heading}" about?`);
}
