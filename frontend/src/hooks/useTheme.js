import { useCallback, useEffect, useState } from "react";

const KEY = "lf_theme"; // "light" | "dark" | "system"
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

function apply(pref) {
  const dark = pref === "dark" || (pref === "system" && media().matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(KEY) || "system",
  );

  useEffect(() => {
    apply(theme);
    if (theme !== "system") return;
    const m = media();
    const onChange = () => apply("system");
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next) => {
    localStorage.setItem(KEY, next);
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}
