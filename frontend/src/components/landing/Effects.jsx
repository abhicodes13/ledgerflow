import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "../ui";
import { cn } from "../../lib/cn";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Soft, slowly drifting gradient behind the whole page */
export function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="aurora-blob aurora-a -left-[10%] -top-[10%] h-[36rem] w-[36rem]" />
      <div className="aurora-blob aurora-b -right-[8%] top-[15%] h-[32rem] w-[32rem]" />
      <div className="aurora-blob aurora-c -bottom-[15%] left-[25%] h-[34rem] w-[34rem]" />
    </div>
  );
}

/* Fades and slides its children in when scrolled into view */
export function Reveal({ delay = 0, className, children }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  return (
    <div
      ref={ref}
      style={{ "--d": `${delay}ms` }}
      className={cn("reveal", seen && "is-visible", className)}
    >
      {children}
    </div>
  );
}

/* Smoothly animates a number toward its target */
function useAnimatedNumber(target, duration = 900) {
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const begin = from.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = reduced ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = begin + (target - begin) * eased;
      from.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

const money = (n) => `$${Math.round(n).toLocaleString("en-US")}`;

/* Hero illustration: an invoice gets paid on a loop (sample data) */
export function AnimatedPreview() {
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => setPaid((p) => !p), 3600);
    return () => clearInterval(id);
  }, []);

  const outstanding = useAnimatedNumber(2400 + (paid ? 0 : 850));
  const collected = useAnimatedNumber(8400 + (paid ? 850 : 0));
  const overdue = useAnimatedNumber(2400);

  const metrics = [
    { l: "Outstanding", v: outstanding, c: "text-fg" },
    { l: "Collected", v: collected, c: "text-success" },
    { l: "Overdue", v: overdue, c: "text-danger" },
  ];

  const rows = [
    {
      n: "INV-014",
      c: "Northwind Studio",
      a: "$2,400.00",
      tone: "danger",
      s: "Overdue",
    },
    {
      n: "INV-015",
      c: "Bluebird Co.",
      a: "$850.00",
      tone: paid ? "success" : "warning",
      s: paid ? "Paid" : "Pending",
    },
    {
      n: "INV-013",
      c: "Acme Corp",
      a: "$1,200.00",
      tone: "success",
      s: "Paid",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* Glow behind the card */}
      <div
        aria-hidden
        className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-accent/30 via-[oklch(0.7_0.2_320)]/20 to-[oklch(0.75_0.15_220)]/30 blur-2xl"
      />

      <div
        className="float-y rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-pop)] sm:p-4"
        aria-label="Illustration of the LedgerFlow dashboard"
      >
        {/* "Payment received" pop-up */}
        <div
          aria-hidden
          className={cn(
            "absolute -top-5 right-3 z-10 flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-left text-sm shadow-[var(--shadow-pop)] transition-all duration-500 sm:-right-4",
            paid ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
        >
          <CheckCircle2 className="h-4 w-4 text-success" />
          <div>
            <p className="text-xs font-semibold text-fg">Payment received</p>
            <p className="num text-xs text-fg-muted">Bluebird Co. · $850.00</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.l} className="rounded-xl bg-surface-2 p-4 text-left">
              <p className="text-xs font-medium text-fg-muted">{m.l}</p>
              <p className={cn("num mt-1 text-2xl font-semibold", m.c)}>
                {money(m.v)}
              </p>
            </div>
          ))}
        </div>

        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border text-left">
          {rows.map((r) => (
            <li
              key={r.n}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="num text-sm font-medium">{r.n}</p>
                <p className="truncate text-xs text-fg-muted">{r.c}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge key={r.s} tone={r.tone} className="animate-fadeIn">
                  {r.s}
                </Badge>
                <span className="num w-24 text-right text-sm font-semibold">
                  {r.a}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
