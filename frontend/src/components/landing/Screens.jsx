import { useEffect, useState } from "react";
import { cn } from "../../lib/cn";
import { Reveal } from "./Effects";

const SHOTS = [
  {
    id: "overview",
    label: "Overview",
    alt: "The LedgerFlow overview showing balances and invoices that need attention",
  },
  {
    id: "invoices",
    label: "Invoices",
    alt: "The invoice list with status filters and search",
  },
  {
    id: "assistant",
    label: "AI assistant",
    alt: "The AI assistant asking for confirmation before creating an invoice",
  },
];

const src = (shot, mode) => `/screens/${shot.id}-${mode}.png`;

const probe = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });

// A screenshot only counts if both its light and dark versions load
function useAvailableShots() {
  const [ready, setReady] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      SHOTS.map(async (shot) => {
        const both = await Promise.all([
          probe(src(shot, "light")),
          probe(src(shot, "dark")),
        ]);
        return both.every(Boolean) ? shot.id : null;
      }),
    ).then((ids) => {
      if (!cancelled) setReady(ids.filter(Boolean));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return SHOTS.filter((s) => ready.includes(s.id));
}

export function Screens() {
  const shots = useAvailableShots();
  const [active, setActive] = useState(0);
  if (shots.length === 0) return null;

  const shot = shots[Math.min(active, shots.length - 1)];

  return (
    <section aria-label="Screenshots" className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-accent">See it for real</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              The actual app, in light and dark
            </h2>
          </div>

          {shots.length > 1 && (
            <div
              role="tablist"
              aria-label="Screenshots"
              className="mt-8 flex justify-center gap-2"
            >
              {shots.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => setActive(i)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    i === active
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-fg-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-pop)]">
            <img
              src={src(shot, "light")}
              alt={shot.alt}
              width="1440"
              height="900"
              loading="lazy"
              decoding="async"
              className="block h-auto w-full dark:hidden"
            />
            <img
              src={src(shot, "dark")}
              alt={shot.alt}
              width="1440"
              height="900"
              loading="lazy"
              decoding="async"
              className="hidden h-auto w-full dark:block"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
