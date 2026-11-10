import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { prefersReducedMotion } from "./Effects";

export const SLIDE_MS = 8000;
export const money = (n) => `$${Math.round(n).toLocaleString("en-US")}`;

// How many steps have happened. Reduced motion jumps straight to the end.
// `times` must be a constant defined outside the component.
export function useSequence(times) {
  const [step, setStep] = useState(() =>
    prefersReducedMotion() ? times.length : 0,
  );
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ids = times.map((t, i) => setTimeout(() => setStep(i + 1), t));
    return () => ids.forEach(clearTimeout);
  }, [times]);
  return step;
}

// Types text one letter at a time, once `enabled` is true
export function useTyping(text, { speed = 32, enabled = true } = {}) {
  const [n, setN] = useState(() => (prefersReducedMotion() ? text.length : 0));
  useEffect(() => {
    if (!enabled || n >= text.length) return;
    const id = setTimeout(() => setN(n + 1), speed);
    return () => clearTimeout(id);
  }, [n, text, speed, enabled]);
  return text.slice(0, n);
}

export const fade = (visible) =>
  cn(
    "transition-all duration-500",
    visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
  );

export function Frame({ title, children }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        <span className="ml-2 text-xs font-medium text-fg-muted">{title}</span>
      </div>
      <div className="min-h-0 flex-1 p-4 sm:p-5">{children}</div>
    </div>
  );
}

// slides: [{ id, icon, title, text, Scene }]
export function Slideshow({ slides, label }) {
  const rootRef = useRef(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  // Don't start until the tour is actually on screen
  const [started, setStarted] = useState(
    () => typeof IntersectionObserver === "undefined",
  );
  const { Scene } = slides[active];
  const next = () => setActive((a) => (a + 1) % slides.length);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || started) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [started]);

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="space-y-4"
    >
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {slides.map((s, i) => {
          const selected = i === active;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(i)}
              className={cn(
                "relative min-w-[4rem] flex-1 shrink-0 overflow-hidden rounded-xl border p-3.5 text-left transition-colors",
                selected
                  ? "border-border bg-surface shadow-[var(--shadow-card)]"
                  : "border-transparent hover:bg-surface-2",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                    selected
                      ? "bg-accent-soft text-accent"
                      : "bg-surface-2 text-fg-subtle",
                  )}
                >
                  <s.icon className="h-4 w-4" aria-hidden />
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    !selected && "text-fg-muted",
                  )}
                >
                  {s.title}
                </span>
              </div>
              {selected && started && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-border">
                  <span
                    key={active}
                    onAnimationEnd={next}
                    className="progress-fill block h-full bg-accent"
                    style={{
                      animationDuration: `${SLIDE_MS}ms`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-fg-muted">{slides[active].text}</p>

      <div
        role="tabpanel"
        className="relative h-[23rem] overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]"
      >
        {started && (
          <div key={active} className="h-full animate-fadeIn">
            <Scene />
          </div>
        )}
      </div>
    </div>
  );
}
