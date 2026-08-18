import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { MOCK_PAGES, findPage, type MockPage } from "./mock-web";
import {
  DEFAULT_ENGINE_ID,
  getEngine,
  isUrlLike,
  makeReaderPage,
  makeSearchPage,
  toHref,
} from "./search-engines";

export type Tab = { id: string; page: MockPage };

export type Workspace = { id: string; name: string; glyph: string };

export type MemoryKind = "reminder" | "saved" | "quiz";

export type Memory = {
  id: string;
  kind: MemoryKind;
  title: string;
  url: string;
  snippet: string;
  note: string;
  workspaceId: string;
  createdAt: number;
  dueAt: number | null;
  dueLabel: string | null;
  fired: boolean;
  done: boolean;
};

export type Permissions = {
  currentPage: boolean;
  selectedText: boolean;
  tabs: boolean;
  memory: boolean;
  notifications: boolean;
  history: boolean;
};

export type RobotMood =
  | "asleep"
  | "waking"
  | "idle"
  | "curious"
  | "happy"
  | "sleepy"
  | "thinking"
  | "alert";

const WORKSPACES: Workspace[] = [
  { id: "study", name: "Study", glyph: "✳" },
  { id: "work", name: "Work", glyph: "◆" },
  { id: "personal", name: "Personal", glyph: "❍" },
  { id: "research", name: "Research", glyph: "✦" },
  { id: "projects", name: "Projects", glyph: "▲" },
];

const DEFAULT_PERMISSIONS: Permissions = {
  currentPage: true,
  selectedText: true,
  tabs: true,
  memory: true,
  notifications: true,
  history: false,
};

const uid = () => Math.random().toString(36).slice(2, 10);

type LunaState = {
  workspaces: Workspace[];
  workspaceId: string;
  setWorkspaceId: (id: string) => void;

  tabs: Tab[];
  activeTabId: string;
  activePage: MockPage;
  openTab: (query: string) => void;
  navigate: (input: string) => void;
  openReader: (url: string, title: string) => void;
  updateActivePage: (patch: Partial<MockPage>) => void;
  engineId: string;
  setEngineId: (id: string) => void;
  closeTab: (id: string) => void;
  selectTab: (id: string) => void;

  selection: string;
  setSelection: (s: string) => void;

  memories: Memory[];
  addMemory: (m: Omit<Memory, "id" | "createdAt" | "fired" | "done">) => Memory;
  toggleMemoryDone: (id: string) => void;
  removeMemory: (id: string) => void;
  markFired: (id: string) => void;

  permissions: Permissions;
  togglePermission: (k: keyof Permissions) => void;

  mood: RobotMood;
  setMood: (m: RobotMood) => void;
  pulse: (m: RobotMood, ms?: number) => void;

  robotPos: { x: number; y: number };
  setRobotPos: (p: { x: number; y: number }) => void;

  assistantOpen: boolean;
  setAssistantOpen: (v: boolean) => void;

  dueMemory: Memory | null;
  dismissDue: () => void;
};

const Ctx = createContext<LunaState | null>(null);

const LS = "luna-browser-v1";

export function LunaProvider({ children }: { children: ReactNode }) {
  const [workspaceId, setWorkspaceId] = useState("study");
  const [tabs, setTabs] = useState<Tab[]>(() => [
    { id: uid(), page: MOCK_PAGES[0]! },
    { id: uid(), page: MOCK_PAGES[1]! },
    { id: uid(), page: MOCK_PAGES[2]! },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [selection, setSelection] = useState("");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS);
  const [mood, setMood] = useState<RobotMood>("asleep");
  const [robotPos, setRobotPos] = useState({ x: 0, y: 0 });
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [dueId, setDueId] = useState<string | null>(null);
  const [engineId, setEngineId] = useState<string>(DEFAULT_ENGINE_ID);

  const activeRef = useRef("");
  activeRef.current = activeTabId;

  useEffect(() => {
    if (!activeTabId && tabs[0]) setActiveTabId(tabs[0].id);
  }, [activeTabId, tabs]);

  // hydrate
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.memories)) setMemories(data.memories);
      if (data.permissions) setPermissions({ ...DEFAULT_PERMISSIONS, ...data.permissions });
      if (data.workspaceId) setWorkspaceId(data.workspaceId);
      if (data.robotPos) setRobotPos(data.robotPos);
      if (typeof data.engineId === "string") setEngineId(data.engineId);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LS,
        JSON.stringify({ memories, permissions, workspaceId, robotPos, engineId }),
      );
    } catch {
      /* ignore */
    }
  }, [memories, permissions, workspaceId, robotPos, engineId]);

  // wake-up sequence
  useEffect(() => {
    const t1 = setTimeout(() => setMood("waking"), 900);
    const t2 = setTimeout(() => setMood("idle"), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // sleepy when tab/window is hidden ("browser closes")
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) setMood("asleep");
      else {
        setMood("waking");
        setTimeout(() => setMood("idle"), 1800);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const pulse = useCallback((m: RobotMood, ms = 2600) => {
    setMood(m);
    setTimeout(() => setMood((cur) => (cur === m ? "idle" : cur)), ms);
  }, []);

  // ambient curiosity + long-session nudge
  useEffect(() => {
    const start = Date.now();
    const glance = setInterval(() => {
      setMood((cur) => (cur === "idle" ? "curious" : cur));
      setTimeout(() => setMood((cur) => (cur === "curious" ? "idle" : cur)), 2200);
    }, 21000);
    const longSession = setInterval(() => {
      if (Date.now() - start > 8 * 60 * 1000) {
        setMood((cur) => (cur === "idle" ? "sleepy" : cur));
        setTimeout(() => setMood((cur) => (cur === "sleepy" ? "idle" : cur)), 4000);
      }
    }, 5 * 60 * 1000);
    return () => {
      clearInterval(glance);
      clearInterval(longSession);
    };
  }, []);

  const openTab = useCallback(
    (query: string) => {
      const page = findPage(query);
      const id = uid();
      setTabs((t) => [...t, { id, page }]);
      setActiveTabId(id);
      setSelection("");
      pulse("curious", 1800);
    },
    [pulse],
  );

  const openPage = useCallback(
    (page: MockPage) => {
      const id = uid();
      setTabs((t) => [...t, { id, page }]);
      setActiveTabId(id);
      setSelection("");
      pulse("curious", 1800);
    },
    [pulse],
  );

  const navigate = useCallback(
    (input: string) => {
      const q = input.trim();
      if (!q) return;
      if (isUrlLike(q)) {
        openPage(makeReaderPage(toHref(q), ""));
        return;
      }
      openPage(makeSearchPage(q, getEngine(engineId)));
    },
    [engineId, openPage],
  );

  const openReader = useCallback(
    (url: string, title: string) => openPage(makeReaderPage(url, title)),
    [openPage],
  );

  const updateActivePage = useCallback((patch: Partial<MockPage>) => {
    setTabs((t) =>
      t.map((tab) =>
        tab.id === activeRef.current ? { ...tab, page: { ...tab.page, ...patch } } : tab,
      ),
    );
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((t) => {
      const next = t.filter((x) => x.id !== id);
      setActiveTabId((cur) => (cur === id ? (next[0]?.id ?? "") : cur));
      return next.length ? next : t;
    });
  }, []);

  const selectTab = useCallback(
    (id: string) => {
      setActiveTabId(id);
      setSelection("");
      pulse("curious", 1600);
    },
    [pulse],
  );

  const addMemory: LunaState["addMemory"] = useCallback(
    (m) => {
      const mem: Memory = { ...m, id: uid(), createdAt: Date.now(), fired: false, done: false };
      setMemories((list) => [mem, ...list]);
      pulse("happy", 2800);
      return mem;
    },
    [pulse],
  );

  const toggleMemoryDone = useCallback((id: string) => {
    setMemories((l) => l.map((m) => (m.id === id ? { ...m, done: !m.done } : m)));
  }, []);
  const removeMemory = useCallback((id: string) => {
    setMemories((l) => l.filter((m) => m.id !== id));
  }, []);
  const markFired = useCallback((id: string) => {
    setMemories((l) => l.map((m) => (m.id === id ? { ...m, fired: true } : m)));
  }, []);

  // reminder watcher
  useEffect(() => {
    if (!permissions.notifications) return;
    const t = setInterval(() => {
      const due = memories.find(
        (m) => m.kind !== "saved" && !m.fired && !m.done && m.dueAt && m.dueAt <= Date.now(),
      );
      if (due) {
        setDueId(due.id);
        setMood("alert");
      }
    }, 1000);
    return () => clearInterval(t);
  }, [memories, permissions.notifications]);

  const togglePermission = useCallback((k: keyof Permissions) => {
    setPermissions((p) => ({ ...p, [k]: !p[k] }));
  }, []);

  const activePage = useMemo(
    () => tabs.find((t) => t.id === activeTabId)?.page ?? tabs[0]?.page ?? MOCK_PAGES[0]!,
    [tabs, activeTabId],
  );

  const dueMemory = useMemo(
    () => memories.find((m) => m.id === dueId) ?? null,
    [memories, dueId],
  );

  const value: LunaState = {
    workspaces: WORKSPACES,
    workspaceId,
    setWorkspaceId,
    tabs,
    activeTabId,
    activePage,
    openTab,
    navigate,
    openReader,
    updateActivePage,
    engineId,
    setEngineId,
    closeTab,
    selectTab,
    selection,
    setSelection,
    memories,
    addMemory,
    toggleMemoryDone,
    removeMemory,
    markFired,
    permissions,
    togglePermission,
    mood,
    setMood,
    pulse,
    robotPos,
    setRobotPos,
    assistantOpen,
    setAssistantOpen,
    dueMemory,
    dismissDue: () => {
      if (dueId) markFired(dueId);
      setDueId(null);
      setMood("idle");
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLuna() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLuna must be used inside LunaProvider");
  return c;
}
