
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
      setRobotPos({
        x: 28,
        y: window.innerHeight - 90,
      });
    }

    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!drag) return;

    const onMove = (e: PointerEvent) => {
      setMoved(true);

      setRobotPos({
        x: Math.min(
          Math.max(8, e.clientX - drag.dx),
          window.innerWidth - 68,
        ),
        y: Math.min(
          Math.max(8, e.clientY - drag.dy),
          window.innerHeight - 68,
        ),
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
  const sleepy = asleep || mood === "sleepy";

  const eyeShift =
    mood === "curious"
      ? 2
      : mood === "alert"
        ? -2
        : 0;

  if (!ready) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 select-none"
      style={{
        left: robotPos.x,
        top: robotPos.y,
        touchAction: "none",
      }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();

        setMoved(false);

        setDrag({
          dx: e.clientX - r.left,
          dy: e.clientY - r.top,
        });
      }}
      onClick={() => {
        if (!moved) onOpen();
      }}
    >
      {/* Speech bubble */}
      <div
        className={cn(
          "absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap",
          "rounded-full border border-border/70 bg-card",
          "px-2.5 py-1 text-[10px] font-medium",
          "text-muted-foreground shadow-soft",
          "transition-all duration-300",
          hover || mood === "alert" || mood === "happy"
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-1 opacity-0",
        )}
      >
        {moodCopy[mood]}
      </div>

      {/* Tiny Luna container */}
      <div
        className={cn(
          "relative grid h-15 w-15 place-items-center",
          drag ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        {/* Soft glow */}
        <div
          className={cn(
            "absolute inset-1 rounded-full blur-lg",
            "transition-opacity duration-700",
            asleep ? "opacity-20" : "opacity-60",
          )}
          style={{
            background:
              "radial-gradient(circle, var(--glow), transparent 68%)",
          }}
        />

        {/* Mood pulse */}
        {(mood === "alert" || mood === "happy") && (
          <span
            className="absolute h-12 w-12 rounded-full border border-primary/50"
            style={{
              animation: "luna-pulse-ring 1.6s ease-out infinite",
            }}
          />
        )}

        {/* Tiny zzz */}
        {asleep && (
          <>
            <span
              className="absolute -right-1 top-0 text-[9px] font-semibold text-primary"
              style={{
                animation: "luna-zzz 3s ease-out infinite",
              }}
            >
              z
            </span>

            <span
              className="absolute right-1.5 top-1 text-[7px] font-semibold text-primary/80"
              style={{
                animation: "luna-zzz 3s ease-out 1.2s infinite",
              }}
            >
              z
            </span>
          </>
        )}

        {/* MOON SPRITE */}
        <svg
          viewBox="0 0 60 60"
          className={cn(
            "relative h-14 w-14",
            "drop-shadow-[0_6px_14px_oklch(0.6_0.12_200/0.3)]",
            "transition-transform duration-500",
            asleep ? "translate-y-1 scale-95" : "animate-float",
            assistantOpen && "scale-105",
          )}
        >
          <defs>
            <linearGradient
              id="lunaBody"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="oklch(0.99 0.005 200)"
              />
              <stop
                offset="100%"
                stopColor="oklch(0.87 0.035 215)"
              />
            </linearGradient>

            <linearGradient
              id="lunaMoon"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="oklch(1 0.02 85)"
              />
              <stop
                offset="100%"
                stopColor="oklch(0.9 0.08 70)"
              />
            </linearGradient>
          </defs>

          {/* Crescent moon on top */}
          <path
            d="
              M31 8
              C26 8 22 11.5 22 16
              C22 20.5 25.5 24 30 24
              C33 24 35.5 22.5 37 20
              C34 21 31.5 19.5 30.5 17
              C29 13.5 30 10.5 31 8
              Z
            "
            fill="url(#lunaMoon)"
          />

          {/* Main round body */}
          <path
            d="
              M30 17
              C20 17 12 24.5 12 34
              C12 44 20 50 30 50
              C40 50 48 44 48 34
              C48 24.5 40 17 30 17
              Z
            "
            fill="url(#lunaBody)"
            stroke="oklch(0.88 0.02 220)"
            strokeWidth="1"
          />

          {/* Tiny side star */}
          <path
            d="
              M42 30
              L43.3 33
              L46.5 34
              L43.3 35
              L42 38
              L40.7 35
              L37.5 34
              L40.7 33
              Z
            "
            fill="var(--glow)"
          />

          {/* Face */}
          <rect
            x="17"
            y="26"
            width="26"
            height="18"
            rx="9"
            fill="oklch(0.16 0.035 250)"
          />

          {/* Eyes */}
          <g
            transform={`translate(${eyeShift}, 0)`}
            style={{
              transition: "transform .4s ease",
            }}
          >
            {sleepy ? (
              <>
                <path
                  d="M22 35 q3 3 6 0"
                  stroke="var(--glow)"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                />

                <path
                  d="M32 35 q3 3 6 0"
                  stroke="var(--glow)"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : mood === "happy" ? (
              <>
                <path
                  d="M22 35 q3 -4 6 0"
                  stroke="var(--glow)"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                />

                <path
                  d="M32 35 q3 -4 6 0"
                  stroke="var(--glow)"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <g className="animate-blinky">
                <ellipse
                  cx="25"
                  cy="34"
                  rx="2.4"
                  ry="2.8"
                  fill="var(--glow)"
                />

                <ellipse
                  cx="35"
                  cy="34"
                  rx="2.4"
                  ry="2.8"
                  fill="var(--glow)"
                />

                <circle
                  cx="25.8"
                  cy="33"
                  r="0.7"
                  fill="white"
                />

                <circle
                  cx="35.8"
                  cy="33"
                  r="0.7"
                  fill="white"
                />
              </g>
            )}
          </g>

          {/* Tiny feet */}
          <ellipse
            cx="21"
            cy="49"
            rx="5"
            ry="2.2"
            fill="oklch(0.82 0.04 210)"
          />

          <ellipse
            cx="39"
            cy="49"
            rx="5"
            ry="2.2"
            fill="oklch(0.82 0.04 210)"
          />

          {/* Tiny ground shadow */}
          <ellipse
            cx="30"
            cy="53"
            rx="12"
            ry="1.8"
            fill="oklch(0.5 0.05 240 / 0.12)"
          />
        </svg>
      </div>
    </div>
  );
}
