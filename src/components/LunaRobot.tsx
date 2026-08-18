import { useEffect, useRef, useState } from "react";
import { useLuna, type RobotMood } from "@/lib/luna-store";
import { cn } from "@/lib/utils";

type Props = { onOpen: () => void };

const moodCopy: Record<RobotMood, string> = {
  asleep: "zzz…",
  waking: "morning!",
  idle: "click me",
  curious: "ooh, what's this?",
  happy: "got it! ✿",
  sleepy: "long session, huh?",
  thinking: "thinking…",
  alert: "psst — remember?",
};

export function LunaRobot({ onOpen }: Props) {
  const { mood, robotPos, setRobotPos, assistantOpen } = useLuna();
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [moved, setMoved] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (robotPos.x === 0 && robotPos.y === 0) {
      setRobotPos({ x: window.innerWidth - 148, y: window.innerHeight - 172 });
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      setMoved(true);
      setRobotPos({
        x: Math.min(Math.max(8, e.clientX - drag.dx), window.innerWidth - 116),
        y: Math.min(Math.max(8, e.clientY - drag.dy), window.innerHeight - 132),
      });
    };
    const onUp = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, setRobotPos]);

  const asleep = mood === "asleep";
  const look =
    mood === "curious" || mood === "alert" ? -2.4 : mood === "thinking" ? 1.6 : 0;
  const eyeShift = mood === "curious" ? 3 : mood === "alert" ? -3 : 0;

  if (!ready) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 select-none"
      style={{ left: robotPos.x, top: robotPos.y, touchAction: "none" }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setMoved(false);
        setDrag({ dx: e.clientX - r.left, dy: e.clientY - r.top });
      }}
      onClick={() => {
        if (!moved) onOpen();
      }}
    >
      {/* speech bubble */}
      <div
        className={cn(
          "absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/70 bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-soft transition-all duration-300",
          hover || mood === "alert" || mood === "happy"
            ? "opacity-100 translate-y-0"
            : "pointer-events-none translate-y-1 opacity-0",
        )}
      >
        {moodCopy[mood]}
      </div>

      <div
        className={cn(
          "relative grid h-[108px] w-[100px] place-items-center",
          drag ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        {/* halo */}
        <div
          className={cn(
            "absolute inset-2 rounded-[36px] blur-xl transition-opacity duration-700",
            asleep ? "opacity-25" : "opacity-70",
          )}
          style={{ background: "radial-gradient(circle, var(--glow), transparent 68%)" }}
        />
        {(mood === "alert" || mood === "happy") && (
          <span
            className="absolute h-20 w-20 rounded-full border-2 border-primary/60"
            style={{ animation: "luna-pulse-ring 1.6s ease-out infinite" }}
          />
        )}

        {asleep && (
          <>
            <span
              className="absolute -right-1 top-0 text-xs font-semibold text-primary"
              style={{ animation: "luna-zzz 3s ease-out infinite" }}
            >
              z
            </span>
            <span
              className="absolute right-2 top-2 text-[10px] font-semibold text-primary/80"
              style={{ animation: "luna-zzz 3s ease-out 1.2s infinite" }}
            >
              z
            </span>
          </>
        )}

        <svg
          viewBox="0 0 100 108"
          className={cn(
            "relative h-[108px] w-[100px] drop-shadow-[0_10px_26px_oklch(0.6_0.12_200/0.35)] transition-transform duration-700",
            asleep ? "translate-y-1 scale-95" : "animate-float",
            assistantOpen && "scale-105",
          )}
          style={{ transform: `rotate(${look}deg)` }}
        >
          <defs>
            <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.99 0.005 200)" />
              <stop offset="100%" stopColor="oklch(0.9 0.03 205)" />
            </linearGradient>
            <linearGradient id="face" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.36 0.06 246)" />
              <stop offset="100%" stopColor="oklch(0.28 0.05 250)" />
            </linearGradient>
          </defs>

          {/* antenna */}
          <line x1="50" y1="18" x2="50" y2="26" stroke="oklch(0.72 0.05 220)" strokeWidth="3" strokeLinecap="round" />
          <circle
            cx="50"
            cy="14"
            r="5"
            fill={asleep ? "oklch(0.8 0.03 210)" : "var(--glow)"}
            className={asleep ? "" : "animate-breathe"}
          />

          {/* ears */}
          <rect x="10" y="52" width="8" height="18" rx="4" fill="oklch(0.85 0.04 205)" />
          <rect x="82" y="52" width="8" height="18" rx="4" fill="oklch(0.85 0.04 205)" />

          {/* head */}
          <rect x="16" y="26" width="68" height="58" rx="24" fill="url(#body)" stroke="oklch(0.88 0.02 220)" strokeWidth="1.5" />
          {/* visor */}
          <rect
            x="24"
            y="38"
            width="52"
            height="34"
            rx="17"
            fill="url(#face)"
            style={{ transition: "all .4s" }}
          />

          {/* eyes */}
          <g transform={`translate(${eyeShift}, 0)`} style={{ transition: "transform .5s ease" }}>
            {asleep || mood === "sleepy" ? (
              <>
                <path d="M34 56 q6 6 12 0" stroke="var(--glow)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                <path d="M54 56 q6 6 12 0" stroke="var(--glow)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              </>
            ) : mood === "happy" ? (
              <>
                <path d="M34 58 q6 -8 12 0" stroke="var(--glow)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                <path d="M54 58 q6 -8 12 0" stroke="var(--glow)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <g className="animate-blinky">
                <ellipse cx="40" cy="55" rx="4.6" ry={mood === "curious" ? 5.6 : 5} fill="var(--glow)" />
                <ellipse cx="60" cy="55" rx="4.6" ry={mood === "curious" ? 5.6 : 5} fill="var(--glow)" />
                <circle cx="41.6" cy="53" r="1.4" fill="oklch(0.99 0 0)" />
                <circle cx="61.6" cy="53" r="1.4" fill="oklch(0.99 0 0)" />
              </g>
            )}
          </g>

          {/* blush */}
          <ellipse cx="27" cy="66" rx="4" ry="2.4" fill="oklch(0.82 0.09 25 / 0.5)" />
          <ellipse cx="73" cy="66" rx="4" ry="2.4" fill="oklch(0.82 0.09 25 / 0.5)" />

          {/* body */}
          <rect x="30" y="82" width="40" height="20" rx="10" fill="url(#body)" stroke="oklch(0.88 0.02 220)" strokeWidth="1.5" />
          <circle cx="50" cy="92" r="3.4" fill={asleep ? "oklch(0.85 0.02 210)" : "var(--glow)"} className={asleep ? "" : "animate-breathe"} />

          {/* shadow */}
          <ellipse cx="50" cy="105" rx="22" ry="3.4" fill="oklch(0.5 0.05 240 / 0.16)" />
        </svg>
      </div>
    </div>
  );
}
